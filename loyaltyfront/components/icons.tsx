import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** Outline icon on a 24px grid. Inherits the text color and hides itself from screen readers. */
function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v9h12v-9" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function StoreIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 9.5 5.5 4h13L20 9.5" />
      <path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" />
      <path d="M5.5 12.5V20h13v-7.5" />
      <path d="M10 20v-4.5h4V20" />
    </Icon>
  );
}

export function MenuBookIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 4.500h11a2 2 0 0 1 2 2V20H7a2 2 0 0 1-2-2Z" />
      <path d="M5 18a2 2 0 0 1 2-2h11" />
      <path d="M9 8.500h6M9 12h4" />
    </Icon>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.4-3 2.7-4.8 5.5-4.8s5.1 1.8 5.5 4.8" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 14.6c1.8.6 2.8 2 3 4.4" />
    </Icon>
  );
}

export function GiftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="9" width="16" height="4" rx="1" />
      <path d="M5.5 13v7h13v-7M12 9v11" />
      <path d="M12 9c-1.5-4-5.5-4-5.5-1.5C6.500 9 9 9 12 9Zm0 0c1.500-4 5.500-4 5.500-1.500C17.500 9 15 9 12 9Z" />
    </Icon>
  );
}

export function HistoryIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.600" />
      <path d="M4 4v4.600h4.600" />
      <path d="M12 8v4.200l2.800 1.800" />
    </Icon>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 4 2.400 5 5.600.7-4.100 3.800 1.100 5.500L12 16.300 7 19l1.100-5.500L4 9.700 9.600 9Z" />
    </Icon>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s6-5.400 6-10.200A6 6 0 0 0 6 10.800C6 15.600 12 21 12 21Z" />
      <circle cx="12" cy="10.500" r="2.200" />
    </Icon>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.500 5 6v5.500c0 4.200 2.800 7.300 7 9 4.200-1.700 7-4.800 7-9V6Z" />
      <path d="m9 12 2.200 2.200L15.200 10" />
    </Icon>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7.500A2.500 2.500 0 0 1 6.500 5H18v3" />
      <path d="M4 7.500V17a2 2 0 0 0 2 2h12.500a1.500 1.500 0 0 0 1.500-1.500v-8A1.500 1.500 0 0 0 18.500 8H6.500A2.500 2.500 0 0 1 4 5.500" />
      <circle cx="16" cy="13.500" r="1" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m7 10 5 5 5-5" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m10 7 5 5-5 5" />
    </Icon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 19V6M6 12l6-6 6 6" />
    </Icon>
  );
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v13M6 12l6 6 6-6" />
    </Icon>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="9" width="10" height="10" rx="2" />
      <path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    </Icon>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 5H6.500A1.500 1.500 0 0 0 5 6.500v11A1.500 1.500 0 0 0 6.500 19H10" />
      <path d="M14 8.500 17.500 12 14 15.500M17.500 12H9.500" />
    </Icon>
  );
}

/** The two linked rings of the LoyalChain logo. */
export function ChainMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="-50 -32 100 64" aria-hidden="true" {...props}>
      <g
        fill="none"
        stroke="#F07340"
        strokeWidth="5.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g transform="rotate(-28)">
          <rect x="-40" y="-10" width="48" height="20" rx="10" />
        </g>
        <g transform="rotate(28)">
          <rect x="-8" y="-10" width="48" height="20" rx="10" />
        </g>
      </g>
    </svg>
  );
}
