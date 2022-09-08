export default function Bilibili({ bv, page, danmaku }) {
  const src = `//player.bilibili.com/player.html?bvid=${bv}&page=${
    page ? page : 1
  }&danmaku=${danmaku ? danmaku : 0}&high_quality=1`;
  return (
    <div className="relative w-full overflow-hidden pt-[56.25%]">
      <iframe
        className="absolute w-full h-full top-0 left-0"
        src={src}
        scrolling="no"
        border={0}
        frameBorder={0}
        allowFullScreen={true}
      ></iframe>
    </div>
  );
}
