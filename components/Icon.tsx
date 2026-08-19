type P = { className?: string; size?: number };

const S = ({ className, size = 24, children }: P & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const IconCheck = (p: P) => (
  <S {...p}><path d="M20 6 9 17l-5-5" /></S>
);
export const IconAlert = (p: P) => (
  <S {...p}><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></S>
);
export const IconCamera = (p: P) => (
  <S {...p}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" /><circle cx="12" cy="13" r="3.5" /></S>
);
export const IconX = (p: P) => (
  <S {...p}><path d="M18 6 6 18M6 6l12 12" /></S>
);
export const IconArrow = (p: P) => (
  <S {...p}><path d="M5 12h14m-6-7 7 7-7 7" /></S>
);
export const IconFlag = (p: P) => (
  <S {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1Zm0 0v7" /></S>
);
export const IconBox = (p: P) => (
  <S {...p}><path d="m21 8-9-5-9 5v8l9 5 9-5Zm-9 5L3 8m9 5 9-5m-9 5v9" /></S>
);
export const IconClock = (p: P) => (
  <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></S>
);
export const IconLock = (p: P) => (
  <S {...p}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></S>
);
export const IconRunner = (p: P) => (
  <S {...p}><circle cx="14" cy="4.5" r="2" /><path d="m8 21 2.5-6L8 12l1-5 4 2 3 1M9 15l-4 1m8-2 3 4" /></S>
);
