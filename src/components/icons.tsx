import type { SVGProps } from "react";

export const SoftballIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a13.1 13.1 0 0 0 -4 20" />
    <path d="M12 2a13.1 13.1 0 0 1 4 20" />
  </svg>
);
