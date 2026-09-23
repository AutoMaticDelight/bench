"use client";

import { useEffect, useRef, useState } from "react";
import { IconAlert, IconArrow, IconCamera, IconCheck, IconX } from "./Icon";

/* The top of the floor screen is the fixture, moving, not a photo.

   By default it plays a clip of the fixture: the view sweeps to the side the
   way a hand holding the iPad would, and the eight fasteners on the bolt circle
   resolve to a verdict as the sweep completes. Nobody has to grant a camera
   for the screen to make its point.

   "Use camera" switches to the rear camera for a room with the real part in it.
   Then the sweep comes from the gyroscope and the fixture's outline builds over
   the live feed. Honest limit: that outline is driven by yaw, not photogrammetry.

   The current step and the one after it sit beside the feed, never below it. */

type Verdict = "go" | "hold" | "stop";
type Mode = "clip" | "live";
type Cam = "asking" | "live" | "off";
type Motion = "unknown" | "needs-permission" | "on" | "pointer";

/* eight bolts on the circle, clockwise from 12 o'clock */
const VERDICTS: Verdict[] = ["go", "go", "hold", "go", "go", "stop", "go", "go"];
const NOTE: Record<Verdict, string> = { go: "correct", hold: "wrong washer stack", stop: "missing" };
const CLIP_RESOLVE = 0.66; // fraction of the clip where the rings appear
const SWEEP_FOR_FULL = 110; // degrees of yaw to finish the model, live mode
const RESOLVE_AT = 0.8;

export function LiveFixture({
  now,
  then,
}: {
  now: { seq: number; title: string; instruction: string };
  then?: { seq: number; title: string };
}) {
  const video = useRef<HTMLVideoElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const cov = useRef(0);
  const yaw = useRef(0);
  const lastAlpha = useRef<number | null>(null);
  const lastMotionAt = useRef(0);
  const [mode, setMode] = useState<Mode>("clip");
  const [cam, setCam] = useState<Cam>("asking");
  const [motion, setMotion] = useState<Motion>("unknown");
  const [coverage, setCoverage] = useState(0);

  const resolved = coverage >= RESOLVE_AT;
  const bad = VERDICTS.map((v, i) => ({ v, n: i + 1 })).filter((b) => b.v !== "go");
  const okCount = VERDICTS.length - bad.length;
  const first = bad.find((b) => b.v === "stop") ?? bad[0];

  /* ---- clip mode: the HUD follows the clip's clock ---- */
  function onClipTime() {
    const v = video.current;
    if (!v || mode !== "clip" || !v.duration) return;
    const c = Math.min(1, v.currentTime / (v.duration * CLIP_RESOLVE));
    cov.current = c;
    setCoverage(c);
  }

  /* ---- live mode: rear camera ---- */
  useEffect(() => {
    if (mode !== "live") return;
    let stream: MediaStream | null = null;
    let stop = false;
    setCam("asking");
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("no camera api");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (stop) { stream.getTracks().forEach((t) => t.stop()); return; }
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play().catch(() => {});
        }
        setCam("live");
      } catch {
        setCam("off");
      }
    })();
    return () => { stop = true; stream?.getTracks().forEach((t) => t.stop()); if (video.current) video.current.srcObject = null; };
  }, [mode]);

  /* ---- live mode: gyroscope on the iPad, pointer drag anywhere else ---- */
  function sweep(deg: number) {
    yaw.current += deg;
    cov.current = Math.min(1, cov.current + Math.abs(deg) / SWEEP_FOR_FULL);
    lastMotionAt.current = performance.now();
  }
  function onOrientation(e: DeviceOrientationEvent) {
    if (e.alpha == null) return;
    if (lastAlpha.current != null) {
      let d = e.alpha - lastAlpha.current;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      if (Math.abs(d) < 60) sweep(d);
    }
    lastAlpha.current = e.alpha;
    setMotion("on");
  }
  useEffect(() => {
    if (mode !== "live") return;
    cov.current = 0; yaw.current = 0; setCoverage(0);
    const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === "function") { setMotion("needs-permission"); return; }
    if ("DeviceOrientationEvent" in window) {
      window.addEventListener("deviceorientation", onOrientation);
      return () => window.removeEventListener("deviceorientation", onOrientation);
    }
    setMotion("pointer");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);
  async function enableMotion() {
    try {
      const DOE = (window as unknown as { DeviceOrientationEvent: { requestPermission: () => Promise<string> } }).DeviceOrientationEvent;
      const r = await DOE.requestPermission();
      if (r === "granted") { window.addEventListener("deviceorientation", onOrientation); setMotion("on"); }
      else setMotion("pointer");
    } catch { setMotion("pointer"); }
  }

  /* ---- live mode: the fixture's outline builds over the feed ---- */
  useEffect(() => {
    if (mode !== "live") return;
    let stop = false;
    let cleanup = () => {};
    (async () => {
      const THREE = await import("three");
      const el = host.current;
      if (!el || stop) return;

      /* colors come from the tokens, never from the component */
      const css = getComputedStyle(el);
      const rootCss = getComputedStyle(document.documentElement);
      const tok = (name: string, from = css) => new THREE.Color(from.getPropertyValue(name).trim());
      const cFg = tok("--fg"), cDim = tok("--fg-dim"), cInfo = tok("--color-info", rootCss);
      const cGo = tok("--color-go", rootCss), cHold = tok("--color-hold", rootCss), cStop = tok("--color-stop", rootCss);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      const gl = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      gl.setPixelRatio(Math.min(devicePixelRatio, 1.75));
      gl.setClearColor(0x000000, 0);
      gl.domElement.style.position = "absolute";
      gl.domElement.style.inset = "0";
      el.appendChild(gl.domElement);

      type Part = { fill: InstanceType<typeof THREE.Mesh>; edge: InstanceType<typeof THREE.LineSegments>; t: number };
      const parts: Part[] = [];
      const g = new THREE.Group();
      type Geo = InstanceType<typeof THREE.BoxGeometry> | InstanceType<typeof THREE.CylinderGeometry>;
      const add = (geo: Geo, t: number, pos: [number, number, number], rotX = 0) => {
        const fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cInfo, transparent: true, opacity: 0 }));
        const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 24), new THREE.LineBasicMaterial({ color: cFg, transparent: true, opacity: 0 }));
        fill.position.set(...pos); edge.position.set(...pos);
        fill.rotation.x = rotX; edge.rotation.x = rotX;
        g.add(fill, edge);
        parts.push({ fill, edge, t });
      };
      add(new THREE.BoxGeometry(6, 0.34, 2.6), 0.04, [0, -0.5, 0]);
      add(new THREE.CylinderGeometry(1.62, 1.62, 0.3, 48), 0.18, [0, -0.18, 0]);
      add(new THREE.CylinderGeometry(0.5, 0.5, 0.34, 32), 0.26, [0, -0.18, 0]);
      const rings: { mesh: InstanceType<typeof THREE.Mesh>; i: number }[] = [];
      for (let i = 0; i < 8; i++) {
        const a = ((-90 + i * 45) * Math.PI) / 180, R = 1.16;
        const pos: [number, number, number] = [R * Math.cos(a), 0.02, R * Math.sin(a)];
        add(new THREE.CylinderGeometry(0.17, 0.17, 0.16, 16), 0.32 + i * 0.05, pos);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.035, 10, 40), new THREE.MeshBasicMaterial({ color: cDim, transparent: true, opacity: 0 }));
        ring.rotation.x = Math.PI / 2; ring.position.set(pos[0], 0.14, pos[2]);
        g.add(ring); rings.push({ mesh: ring, i });
      }
      add(new THREE.BoxGeometry(0.86, 1.5, 0.42), 0.76, [0, 0.72, 0]);
      add(new THREE.CylinderGeometry(0.43, 0.43, 0.42, 32), 0.86, [0, 1.47, 0], Math.PI / 2);
      add(new THREE.CylinderGeometry(0.19, 0.19, 0.46, 24), 0.92, [0, 1.47, 0], Math.PI / 2);
      scene.add(g);

      const size = () => { const w = el.clientWidth, h = el.clientHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); gl.setSize(w, h); };
      size();
      const ro = new ResizeObserver(size); ro.observe(el);

      let px: number | null = null;
      const down = (e: PointerEvent) => { px = e.clientX; setMotion((m) => (m === "on" ? m : "pointer")); };
      const move = (e: PointerEvent) => { if (px == null) return; sweep((e.clientX - px) / 3); px = e.clientX; };
      const up = () => { px = null; };
      el.addEventListener("pointerdown", down); window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);

      let raf = 0, shown = -1;
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        const c = cov.current;
        const rounded = Math.round(c * 100);
        if (rounded !== shown) { shown = rounded; setCoverage(c); }
        const az = (yaw.current * Math.PI) / 180;
        camera.position.set(6.4 * Math.sin(az), 3.4, 6.4 * Math.cos(az));
        camera.lookAt(0, 0.45, 0);
        for (const p of parts) {
          const k = Math.max(0, Math.min(1, (c - p.t) / 0.12));
          (p.fill.material as InstanceType<typeof THREE.MeshBasicMaterial>).opacity = k * 0.16;
          (p.edge.material as InstanceType<typeof THREE.LineBasicMaterial>).opacity = k * 0.95;
        }
        const res = Math.max(0, Math.min(1, (c - RESOLVE_AT) / 0.12));
        for (const r of rings) {
          const m = r.mesh.material as InstanceType<typeof THREE.MeshBasicMaterial>;
          const v = VERDICTS[r.i];
          m.color.copy(res > 0 ? (v === "go" ? cGo : v === "hold" ? cHold : cStop) : cDim);
          m.opacity = Math.max(0, Math.min(1, (c - 0.32 - r.i * 0.05) / 0.12)) * (res > 0 ? 1 : 0.55);
          r.mesh.scale.setScalar(v !== "go" && res > 0 ? 1 + 0.12 * Math.sin(now / 180) : 1);
        }
        gl.render(scene, camera);
      };
      raf = requestAnimationFrame(loop);

      cleanup = () => {
        cancelAnimationFrame(raf); ro.disconnect();
        el.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up);
        gl.dispose(); gl.domElement.remove();
      };
    })();
    return () => { stop = true; cleanup(); };
  }, [mode]);

  const pct = Math.round(coverage * 100);
  const live = mode === "live";

  return (
    <section className="panel overflow-hidden" style={{ borderRadius: "var(--radius)" }}>
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* ---- the fixture, moving ---- */}
        <div
          ref={host}
          className="relative min-w-0 select-none"
          style={{ height: "clamp(260px, 46vh, 520px)", background: "var(--bg)", cursor: live ? "grab" : "default", touchAction: "none" }}
        >
          {live ? (
            <video ref={video} muted playsInline autoPlay className="absolute inset-0 h-full w-full object-cover" style={{ opacity: cam === "live" ? 1 : 0 }} />
          ) : (
            <video
              ref={video}
              muted
              playsInline
              autoPlay
              loop
              poster="/fixture.jpg"
              onTimeUpdate={onClipTime}
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source src="/fixture.mp4" type="video/mp4" />
            </video>
          )}
          {live && cam !== "live" && (
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 60%, var(--panel) 0%, var(--bg) 75%)" }} />
          )}

          {/* HUD */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between" style={{ padding: "calc(var(--pad) * 0.6)" }}>
            <span className={`chip ${live && cam === "live" ? "chip-info" : "chip-mute"}`}>
              <IconCamera size={16} /> {live ? (cam === "live" ? "Live" : cam === "asking" ? "Camera…" : "No camera") : "100-4412-01"}
            </span>
            {live ? (
              <button onClick={() => setMode("clip")} className="btn btn-ghost whitespace-nowrap" style={{ minHeight: "2.25rem" }}>Back</button>
            ) : (
              <button onClick={() => setMode("live")} className="btn btn-ghost whitespace-nowrap" style={{ minHeight: "2.25rem" }}>
                <IconCamera size={18} /> Use camera
              </button>
            )}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ padding: "calc(var(--pad) * 0.6)", background: "linear-gradient(to top, var(--scrim), transparent)" }}>
            {!resolved ? (
              <div>
                <div className="flex items-center justify-between">
                  <span className="t-label" style={{ color: "var(--fg)" }}>
                    {live ? (motion === "on" ? "Move the iPad to the side" : "Drag or move the iPad to the side") : "Checking the bolt circle"}
                  </span>
                  <span className="t-id" style={{ color: "var(--fg)" }}>{pct}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--fg)", transition: "width 120ms linear" }} />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-1.5">
                  {VERDICTS.map((v, i) => (
                    <span
                      key={i}
                      className="grid place-items-center rounded-full"
                      title={`Bolt ${i + 1} · ${NOTE[v]}`}
                      style={{
                        width: "1.25rem", height: "1.25rem",
                        background: v === "go" ? "var(--color-go)" : v === "hold" ? "var(--color-hold)" : "var(--color-stop)",
                        color: v === "stop" ? "var(--on-stop)" : "var(--on-go)",
                      }}
                    >
                      {v === "go" ? <IconCheck size={12} /> : v === "hold" ? <IconAlert size={12} /> : <IconX size={12} />}
                    </span>
                  ))}
                </span>
                <span className="t-label" style={{ color: "var(--fg)" }}>
                  {okCount} of {VERDICTS.length} correct
                  {bad.map((b) => ` · #${b.n} ${NOTE[b.v]}`)}
                </span>
              </div>
            )}
          </div>

          {live && motion === "needs-permission" && (
            <button onClick={enableMotion} className="btn btn-ghost absolute" style={{ right: "calc(var(--pad) * 0.6)", bottom: "calc(var(--ctl-h) + var(--pad) * 0.4)" }}>
              Enable motion
            </button>
          )}
        </div>

        {/* ---- the next step, always beside the feed ---- */}
        <div className="flex min-w-0 flex-col border-t border-line md:border-l md:border-t-0" style={{ padding: "var(--pad)", gap: "calc(var(--gap) * 0.75)" }}>
          <div className="flex items-center justify-between">
            <span className="t-label">Now · step {now.seq}</span>
            {resolved && first && (
              <span className={`chip ${first.v === "stop" ? "chip-stop" : "chip-hold"}`}>Start at #{first.n}</span>
            )}
          </div>
          <p className="t-head">{now.title}</p>
          <p className="t-caption" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {resolved && first
              ? `Bolt #${first.n} is ${NOTE[first.v]}. Fix that first, then ${now.instruction.charAt(0).toLowerCase()}${now.instruction.slice(1)}`
              : now.instruction}
          </p>
          {then && (
            <div className="rule mt-auto flex items-center gap-2 pt-3">
              <span className="t-label">Then</span>
              <span className="t-sub min-w-0 flex-1 truncate">{then.seq}. {then.title}</span>
              <IconArrow size={20} className="shrink-0 fg-dim" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
