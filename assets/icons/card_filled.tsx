import { SVGProps } from 'react';

export const CardFilled = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M38.5 40H9.5C6.468 40 4 37.532 4 34.5V13.5C4 10.468 6.468 8 9.5 8H38.5C41.532 8 44 10.468 44 13.5V34.5C44 37.532 41.532 40 38.5 40Z"/>
  </svg>
);

export default CardFilled;
