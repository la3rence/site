export default function Bilibili({ bv, page, danmaku }) {
  const src = `//www.bilibili.com/blackboard/html5mobileplayer.html?bvid=${bv}&page=${
    page ? page : 1
  }&danmaku=${danmaku ? danmaku : 0}&high_quality=1`;
  return (
    <div className="max-w-4xl mx-auto relative w-full overflow-hidden pt-[56.2%] sm:pt-[29.5%] dark:filter dark:dark:brightness-75">
      <iframe
        className="absolute w-full h-full top-0 left-0"
        src={src}
        border={0}
        allowFullScreen={true}
      />
    </div>
  );
}
