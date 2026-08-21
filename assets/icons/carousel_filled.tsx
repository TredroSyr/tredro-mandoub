import { SVGProps } from 'react';

export const CarouselFilled = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M31.5 43H16.5C14.019 43 12 40.981 12 38.5V9.5C12 7.019 14.019 5 16.5 5H31.5C33.981 5 36 7.019 36 9.5V38.5C36 40.981 33.981 43 31.5 43ZM39.5 9H37.975C37.987 9.166 38 9.331 38 9.5V38.5C38 38.669 37.987 38.834 37.975 39H39.5C41.981 39 44 36.981 44 34.5V13.5C44 11.019 41.981 9 39.5 9ZM8.5 39H10.025C10.013 38.834 10 38.669 10 38.5V9.5C10 9.331 10.013 9.166 10.025 9H8.5C6.019 9 4 11.019 4 13.5V34.5C4 36.981 6.019 39 8.5 39Z"/>
  </svg>
);

export default CarouselFilled;
