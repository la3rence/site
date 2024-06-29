export default function Project({ name, desc, desc_zh, url, locale }) {
  return (
    <>
      {name && (
        <a
          className="group cursor-pointer no-underline bg-zinc-100
       hover:bg-zinc-200 sm:w-[49%] w-full dark:bg-zinc-800 dark:hover:bg-zinc-600 shadow"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h5 className="pt-2">{name}</h5>
          {locale === "zh" && <p className="text-sm my-2 mx-4  p-0 font-normal">{desc_zh}</p>}
          {locale != "zh" && <p className="text-sm font-normal">{desc}</p>}
        </a>
      )}
    </>
  );
}
