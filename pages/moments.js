import Image from "next/image";
import fs from "fs";
import path from "path";
import { useEffect } from "react";
import mediumZoom from "medium-zoom";

export default function Moments(props) {
  useEffect(() => {
    mediumZoom(document.querySelectorAll("img"), { background: "#fff", margin: 24 });
  }, []);

  return (
    <div className="mt-20">
      <h3 className="mt-10 text-6xl font-bold">Moments</h3>
      <h4>Updated: 2025/03</h4>
      <div className="mt-10 -mx-6 md:m-20 flex flex-wrap justify-center">
        {props.pics.map(pic => (
          <figure className="flex flex-col items-center justify-center" key={pic.name}>
            <Image
              className="md:px-2 my-4 object-contain h-auto"
              src={`/images/moments/${pic.name}`}
              width={450}
              height={500}
              data-zoom-src={`/images/moments/${pic.name}`}
              priority={false}
              alt={pic.name.replace(/\.[^/.]+$/, "")}
            />
            <figcaption className="text-xs mb-2 text-zinc-500 text-center">
              {pic.name.replace(/\.[^/.]+$/, "")}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
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
