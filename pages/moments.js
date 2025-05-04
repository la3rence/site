import Image from "next/image";
import fs from "fs";
import path from "path";
import { useEffect } from "react";
import mediumZoom from "medium-zoom";
import Header from "../components/header";

export default function Moments(props) {
  const title = "Moments";
  useEffect(() => {
    const selector = document.querySelectorAll("img");
    mediumZoom(selector, {
      background: "#eee9",
      margin: 24,
    });
  }, []);

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
                className="mx-auto object-cover aspect-square"
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
