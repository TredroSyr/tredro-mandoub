import { SVGProps } from 'react';

export const RowFilledFourRow = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M11 6C7.68629 6 5 8.68629 5 12V14H42.8947V12C42.8947 8.68629 40.2085 6 36.8947 6H11Z"/>
    <path d="M5 23V17H42.8947V23H5Z"/>
    <path d="M42.8947 26H5V31H42.8947V26Z"/>
    <path d="M42.8947 34H5V36C5 39.3137 7.68629 42 11 42H36.8947C40.2084 42 42.8947 39.3137 42.8947 36V34Z"/>
  </svg>
);

export default RowFilledFourRow;
