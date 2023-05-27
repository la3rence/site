import Image from "next/image";

export default function Avatar({ src, size, alt }) {
  console.log(src);
  return (
    <Image
      className="rounded-full not-prose inline-block border border-zinc-300"
      src={src}
      width={size}
      height={size}
      alt={alt}
    />
  );
}
