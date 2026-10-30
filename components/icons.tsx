import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: P) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function MusicIcon(props: P) {
  return (
    <Svg {...props}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </Svg>
  );
}

export function SearchIcon(props: P) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.34-4.34" />
    </Svg>
  );
}

export function TimerIcon(props: P) {
  return (
    <Svg {...props}>
      <path d="M10 2h4" />
      <circle cx="12" cy="14" r="8" />
      <path d="M12 14l3-3" />
    </Svg>
  );
}

export function TerminalIcon(props: P) {
  return (
    <Svg {...props}>
      <path d="m4 17 6-6-6-6" />
      <path d="M12 19h8" />
    </Svg>
  );
}

export function ShieldIcon(props: P) {
  return (
    <Svg {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </Svg>
  );
}

export function BookIcon(props: P) {
  return (
    <Svg {...props}>
      <path d="M12 5v16" />
      <path d="M20 19a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2l-4 .002A5 5 0 0 0 12 5a5 5 0 0 0-4-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4a5 5 0 0 1 4 2 5 5 0 0 1 4-2z" />
    </Svg>
  );
}

export function CheckIcon(props: P) {
  return (
    <Svg {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Svg>
  );
}

export function XIcon(props: P) {
  return (
    <Svg {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Svg>
  );
}

export function CopyIcon(props: P) {
  return (
    <Svg {...props}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </Svg>
  );
}

export function LoaderIcon(props: P) {
  return (
    <Svg {...props} className={`animate-spin ${props.className ?? ""}`}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </Svg>
  );
}

export function DbIcon(props: P) {
  return (
    <Svg {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14a9 3 0 0 0 18 0V5" />
      <path d="M3 12a9 3 0 0 0 18 0" />
    </Svg>
  );
}

export function CloudIcon(props: P) {
  return (
    <Svg {...props}>
      <path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97A6.5 6.5 0 0 0 5.34 9.5 4 4 0 0 0 6 17.5z" />
      <path d="m10.5 13.5 4-2.5-4-2.5z" />
    </Svg>
  );
}

export function PlayIcon(props: P) {
  return (
    <Svg {...props}>
      <path d="M6 4.5v15l13-7.5z" />
    </Svg>
  );
}

export function PauseIcon(props: P) {
  return (
    <Svg {...props}>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </Svg>
  );
}

export function PencilIcon(props: P) {
  return (
    <Svg {...props}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </Svg>
  );
}

export function ArrowIcon(props: P) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </Svg>
  );
}
