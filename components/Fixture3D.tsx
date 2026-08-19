"use client";

import { useEffect, useRef, useState } from "react";

/* The fitting the bolt pattern sits on, rotatable. Built from primitives rather
   than a CAD import so it stays a few kilobytes of code and can be read. */
export function Fixture3D() {
  const host = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState("Drag to rotate");

  useEffect(() => {
    let stop = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const el = host.current;
      if (!el || stop) return;

      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      cam.position.set(4.4, 3.0, 5.2);

      const gl = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      gl.setPixelRatio(Math.min(devicePixelRatio, 2));
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
      el.appendChild(gl.domElement);

      const alu = new THREE.MeshStandardMaterial({ color: 0xb4bcc4, metalness: 0.82, roughness: 0.38 });
      const steel = new THREE.MeshStandardMaterial({ color: 0x8f9aa4, metalness: 0.92, roughness: 0.26 });
      const dark = new THREE.MeshStandardMaterial({ color: 0x4a5058, metalness: 0.7, roughness: 0.5 });
      const railMat = new THREE.MeshStandardMaterial({ color: 0x6f7780, metalness: 0.75, roughness: 0.45 });

      const g = new THREE.Group();
      const rail = new THREE.Mesh(new THREE.BoxGeometry(6, 0.34, 2.6), railMat);
      rail.position.y = -0.5; rail.receiveShadow = true; g.add(rail);

      const flange = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, 0.3, 64), alu);
      flange.position.y = -0.18; flange.castShadow = true; flange.receiveShadow = true; g.add(flange);
      const bore = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.34, 48), dark);
      bore.position.y = -0.18; g.add(bore);

      for (let i = 0; i < 8; i++) {
        const a = ((-90 + i * 45) * Math.PI) / 180, R = 1.16;
        const head = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.16, 24), steel);
        head.position.set(R * Math.cos(a), 0.02, R * Math.sin(a));
        head.castShadow = true;
        const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.18, 6), dark);
        socket.position.copy(head.position); socket.position.y = 0.05;
        g.add(head, socket);
      }

      const lug = new THREE.Mesh(new THREE.BoxGeometry(0.86, 1.5, 0.42), alu);
      lug.position.y = 0.72; lug.castShadow = true; g.add(lug);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.42, 40), alu);
      cap.rotation.x = Math.PI / 2; cap.position.y = 1.47; cap.castShadow = true; g.add(cap);
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.46, 32), dark);
      pin.rotation.x = Math.PI / 2; pin.position.y = 1.47; g.add(pin);
      scene.add(g);

      scene.add(new THREE.HemisphereLight(0xdfe6ee, 0x0b0d0f, 1.05));
      const key = new THREE.DirectionalLight(0xffffff, 2.1);
      key.position.set(5, 7, 4); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x4c8dff, 0.9);
      rim.position.set(-5, 2, -4); scene.add(rim);

      const ctl = new OrbitControls(cam, gl.domElement);
      ctl.enableDamping = true; ctl.dampingFactor = 0.07; ctl.enablePan = false;
      ctl.minDistance = 4.2; ctl.maxDistance = 11;
      ctl.maxPolarAngle = Math.PI / 2 + 0.28;
      ctl.autoRotate = !reduce; ctl.autoRotateSpeed = 1.1;
      ctl.target.set(0, 0.45, 0);

      let idle: ReturnType<typeof setTimeout>;
      ctl.addEventListener("start", () => { ctl.autoRotate = false; setHint("Release to resume"); });
      ctl.addEventListener("end", () => {
        setHint("Drag to rotate");
        clearTimeout(idle);
        idle = setTimeout(() => { if (!reduce) ctl.autoRotate = true; }, 3500);
      });

      const size = () => {
        const w = el.clientWidth, h = el.clientHeight;
        cam.aspect = w / h; cam.updateProjectionMatrix(); gl.setSize(w, h, false);
      };
      size();
      const ro = new ResizeObserver(size); ro.observe(el);

      let visible = true;
      const io = new IntersectionObserver((es) => es.forEach((e) => (visible = e.isIntersecting)), { threshold: 0.05 });
      io.observe(el);

      let raf = 0;
      const loop = () => { raf = requestAnimationFrame(loop); if (visible) { ctl.update(); gl.render(scene, cam); } };
      loop();

      cleanup = () => {
        cancelAnimationFrame(raf); clearTimeout(idle);
        io.disconnect(); ro.disconnect(); ctl.dispose(); gl.dispose();
        gl.domElement.remove();
      };
    })();

    return () => { stop = true; cleanup(); };
  }, []);

  return (
    <div data-surface="floor" className="panel overflow-hidden" style={{ borderRadius: "0.875rem" }}>
      <div className="flex items-center justify-between border-b border-line" style={{ padding: "0.75rem 1rem" }}>
        <span className="t-label">100-4412-01 · hinge fitting</span>
        <span className="t-caption">{hint}</span>
      </div>
      <div ref={host} style={{ height: "clamp(240px, 38vw, 340px)", cursor: "grab" }} />
      <div style={{ padding: "0 1rem 1rem" }}>
        <p className="t-caption">
          The part the bolt pattern sits on — eight fasteners on the bolt circle, the clevis lug
          and pin bore, seated against the panel rail.
        </p>
      </div>
    </div>
  );
}
