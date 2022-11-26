export default function Project({ name, desc, url }) {
  return (
    <>
      {name && (
        <a
          className="group cursor-pointer no-underline sm:rounded-lg bg-zinc-100
       hover:bg-zinc-200 sm:w-[49%] w-full dark:bg-zinc-800 dark:hover:bg-zinc-600"
          href={url}
          target="_blank"
        >
          <h5 className="pt-2">
            {name}
            <span
              className="invisible group-hover:visible absolute z-[1]
            rounded-lg bg-zinc-300 dark:bg-black text-sm px-2"
            >
              {url.replace("https://", "")}
            </span>
          </h5>
          <p className="text-sm font-normal">{desc}</p>
        </a>
      )}
    </>
  );
}
