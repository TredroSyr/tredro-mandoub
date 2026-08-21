import { SVGProps } from 'react';

export const CurrencyTry = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <text
      x="12"
      y="13"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="16"
      fontWeight="600"
      fill="currentColor"
    >
      ₺
    </text>
  </svg>
);

export default CurrencyTry;
