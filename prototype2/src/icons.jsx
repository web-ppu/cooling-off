const Svg = ({ children, size = 22, stroke = 1.75, fill = 'none', className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke="currentColor" strokeWidth={stroke}
    strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" className={className}
  >
    {children}
  </svg>
);

export const IcCube = (p) => (
  <Svg {...p}>
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
    <path d="M4 7.5l8 4.5 8-4.5" />
    <path d="M12 12v9" />
  </Svg>
);

export const IcList = (p) => (
  <Svg {...p}>
    <path d="M8 6h12" />
    <path d="M8 12h12" />
    <path d="M8 18h12" />
    <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
  </Svg>
);

export const IcHelp = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.6c0 1.6-2.4 1.9-2.4 3.4" />
    <circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none" />
  </Svg>
);

export const IcInfo = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <circle cx="12" cy="8" r="0.8" fill="currentColor" stroke="none" />
  </Svg>
);

export const IcBack = (p) => (
  <Svg {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Svg>
);

export const IcArrowRight = (p) => (
  <Svg {...p}>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </Svg>
);

export const IcPlus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Svg>
);

export const IcLock = (p) => (
  <Svg {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
);

export const IcClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

export const IcSend = (p) => (
  <Svg {...p}>
    <path d="M5 12l14-7-5 16-3-7-6-2z" />
  </Svg>
);

export const IcSparkle = (p) => (
  <Svg {...p}>
    <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4z" />
    <path d="M19 16l.7 1.8L21.5 18.5 19.7 19.2 19 21l-.7-1.8L16.5 18.5 18.3 17.8 19 16z" />
  </Svg>
);

export const IcX = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  </Svg>
);

export const IcSnow = (p) => (
  <Svg {...p}>
    <path d="M12 3v18" />
    <path d="M3 12h18" />
    <path d="M5.5 5.5l13 13" />
    <path d="M18.5 5.5l-13 13" />
  </Svg>
);
