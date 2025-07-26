import fs from "fs";
import path from "path";
import { useEffect } from "react";
import mediumZoom from "medium-zoom";
import Header from "../components/header";
import { useTheme } from "next-themes";
import Image from "next/image";

export default function Moments(props) {
  const title = "Moments";
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    let zoom;
    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const handleMediaChange = e => {
      if (!e.matches && !zoom) {
        // 非移动设备且 zoom 未初始化时初始化
        if (resolvedTheme === "dark") {
          zoom = mediumZoom(document.querySelectorAll("img"), {
            background: "#111111bb",
            margin: 24,
          });
        } else {
          zoom = mediumZoom(document.querySelectorAll("img"), {
            background: "#eeeeee99",
            margin: 24,
          });
        }
      } else if (e.matches && zoom) {
        // 移动设备且 zoom 已初始化时销毁
        zoom.detach();
        zoom = null;
      }
    };

    // 初始检查
    handleMediaChange(mediaQuery);
    // 监听屏幕变化
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
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
