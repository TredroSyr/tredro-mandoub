import { SVGProps } from 'react';

export const ClockFilled = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M24 4C12.972 4 4 12.972 4 24C4 35.028 12.972 44 24 44C35.028 44 44 35.028 44 24C44 12.972 35.028 4 24 4ZM28.561 30.561C28.268 30.854 27.884 31 27.5 31C27.116 31 26.732 30.854 26.439 30.561L21.439 25.561C21.158 25.279 21 24.898 21 24.5V13.5C21 12.671 21.671 12 22.5 12C23.329 12 24 12.671 24 13.5V23.879L28.561 28.44C29.146 29.025 29.146 29.975 28.561 30.561Z"/>
  </svg>
);

export default ClockFilled;
