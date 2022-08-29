import Header from "./header";

export default function Layout(props) {
  const { children, title } = props;
  return (
    <>
      <Header title={title} />
      <main
        className="prose prose-slate
      max-w-3xl
      dark:prose-invert
      prose-pre:rounded-none 
      prose-pre:bg-[#0d1117] 
      prose-blockquote:border-purple-500
      prose-blockquote:text-purple-500
      prose-blockquote:border-l-2
      prose-p:before:content-none
      prose-headings:[*>a]:no-unnderline
      mx-6"
      >
        <div className="my-10">{children}</div>
      </main>
    </>
  );
}
