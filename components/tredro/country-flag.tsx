import { cn } from "@/lib/utils";
import syFlag from "@/assets/flag-sy.svg";
import Image from "next/image";

const flagOverrides: Record<string, string> = {
  sy: syFlag,
};

const toTwemojiCodepoints = (iso2: string) =>
  iso2
    .toLowerCase()
    .split("")
    .map((char) => (0x1f1e6 + char.charCodeAt(0) - 97).toString(16))
    .join("-");

export function CountryFlag({
  iso2,
  className,
}: {
  iso2: string;
  className?: string;
}) {
  const src =
    flagOverrides[iso2.toLowerCase()] ??
    `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${toTwemojiCodepoints(iso2)}.svg`;

  return (
    <Image
      src={src}
      alt=""
      width={20}
      height={20}
      aria-hidden="true"
      loading="lazy"
      className={cn("rounded-[2px] object-cover", className)}
    />
  );
}
