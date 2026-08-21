import { SVGProps } from 'react';

export const TagFilled = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M39 4H28C26.409 4 24.883 4.632 23.758 5.757L5.758 23.757C3.415 26.1 3.415 29.899 5.758 32.242L15.758 42.242C16.929 43.414 18.465 44 20 44C21.535 44 23.071 43.414 24.242 42.243L42.242 24.243C43.368 23.117 44 21.591 44 19.999V9C44 6.239 41.761 4 39 4ZM34 17C32.343 17 31 15.657 31 14C31 12.343 32.343 11 34 11C35.657 11 37 12.343 37 14C37 15.657 35.657 17 34 17Z"/>
  </svg>
);

export default TagFilled;
