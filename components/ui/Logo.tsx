import Image from "next/image";

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <Image
      src="/landing/logo.png"
      alt=""
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  );
}
