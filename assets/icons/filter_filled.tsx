import { SVGProps } from 'react';

export const FilterFilled = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M19 28V40.5C19 41.062 19.314 41.577 19.813 41.834C20.03 41.945 20.265 42 20.5 42C20.807 42 21.113 41.906 21.372 41.721L28.372 36.721C28.766 36.439 29 35.984 29 35.5V28H19ZM39.5 6H8.5C7.122 6 6 7.122 6 8.5V11.589C6 13.902 7.042 16.049 8.858 17.48L18.403 25H29.596L39.141 17.48C40.958 16.049 42 13.901 42 11.589V8.5C42 7.122 40.878 6 39.5 6Z"/>
  </svg>
);

export default FilterFilled;
