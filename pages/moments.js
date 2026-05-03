import fs from "fs";
import path from "path";
import { useEffect, useRef } from "react";
import Header from "../components/header";
import { useTheme } from "next-themes";
import Image from "next/image";
import { createImageZoom } from "../lib/image-zoom";

export default function Moments(props) {
  const title = "Moments";
  const { resolvedTheme } = useTheme();
  const galleryRef = useRef(null);

  useEffect(() => {
    let zoom;
    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const handleMediaChange = e => {
      if (!e.matches && !zoom) {
        const images = galleryRef.current?.querySelectorAll("img") ?? [];
        zoom = createImageZoom(images, {
          background: resolvedTheme === "dark" ? "rgba(0,0,0,0.82)" : "rgba(255,255,255,0.68)",
          backdropFilter: resolvedTheme === "dark" ? "none" : "blur(18px) saturate(1.2)",
          margin: 24,
          maxScale: 1.35,
        });
      } else if (e.matches && zoom) {
        zoom.detach();
        zoom = null;
      }
    };

    handleMediaChange(mediaQuery);
    mediaQuery.addEventListener("change", handleMediaChange);
    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
      if (zoom) {
        zoom.detach();
      }
    };
  }, [resolvedTheme]);

  return (
    <>
      <Header title={title} tags={title} />
      <div className="mt-10">
        <h1 id="title" className={`articleTitle text-balance text-2xl mb-0 mt-14`}>
          {title}
        </h1>
        <h4>Updated: 2025-03</h4>
        <div
          ref={galleryRef}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {props.pics.map(pic => (
            <figure key={pic.name}>
              <Image
                className="mx-auto object-cover aspect-square z-50 shadow-xs"
                src={`/images/moments/${pic.name}`}
                width={600}
                height={600}
                unoptimized={false}
                data-zoom-src={`/images/moments/${pic.name}`}
                priority={false}
                loading="lazy"
                alt={pic.name.replace(/\.[^/.]+$/, "")}
              />
            </figure>
          ))}
        </div>
      </div>
    </>
  );
}

export const getStaticProps = async () => {
  const IMAGE_PATH = "public/images/moments";
  const imagePath = path.join(process.cwd(), IMAGE_PATH);
  const names = fs.readdirSync(imagePath);
  const picNames = names.filter(file => /\.(png|jpg|webp|jpeg)$/i.test(file));
  // const pics =  await Promise.all(picNames.map(async name => {
  // const dimensions = await imageSizeFromFile(path.join(imagePath, name));
  // return { name, w: dimensions.width/8, h: dimensions.height/8 };
  // }));
  const pics = picNames.map(name => {
    return { name: name };
  });

  return {
    props: {
      pics,
    },
  };
};
