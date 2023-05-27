import Image from "next/image";

export default function Avatar({ src, size, alt }) {
  return (
    <Image
      className="rounded-full not-prose inline-block border border-zinc-300"
      src={`${process.env.NEXT_PUBLIC_PROXY_URL}${src.replace("https://", "")}`}
      width={size}
      height={size}
      alt={alt}
    />
  );
}
