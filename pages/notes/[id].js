import Head from "next/head";
import { getNote } from "../../lib/notes";

export default function NotePage({ note }) {
  if (!note) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500">Not Found</div>
    );
  }

  return (
    <>
      <Head>
        <title>{note.content.slice(0, 60)}</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main
        className="mx-auto max-w-3xl px-6 py-16 prose prose-slate dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: note.html }}
      />
      <style>{`
        body { margin: 0; }
      `}</style>
    </>
  );
}

export const getStaticProps = async context => {
  try {
    const note = await getNote(context.params.id);
    if (!note) return { notFound: true };
    return {
      props: {
        note: {
          id: note._id.toString(),
          content: note.content,
          html: note.html,
          createdAt: note.createdAt.toISOString(),
        },
      },
      revalidate: 300,
    };
  } catch {
    return { notFound: true };
  }
};

export const getStaticPaths = async () => {
  return { paths: [], fallback: "blocking" };
};
