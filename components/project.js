export default function Project({ name, desc, url }) {
  return (
    <>
      {name && (
        <a
          className="group cursor-pointer no-underline sm:rounded-lg bg-zinc-100 hover:scale-105 hover:transition-transform
       hover:bg-zinc-200 sm:w-[49%] w-full dark:bg-zinc-800 dark:hover:bg-zinc-600 shadow"
          href={url}
          target="_blank"
        >
          <h5 className="pt-2">{name}</h5>
          <p className="text-sm font-normal">{desc}</p>
        </a>
      )}
    </>
  );
}
