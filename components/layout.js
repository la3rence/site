import Header from "./header";

export default function Layout(props) {
  const { children } = props;
  return (
    <>
      <Header />
      {/* different main part */}
      <main
        className="prose prose-slate
      dark:prose-invert
      prose-pre:rounded-none 
      prose-pre:bg-[#0d1117] 
      prose-blockquote:border-purple-500
      prose-blockquote:text-purple-500
      prose-blockquote:border-l-2
      prose-p:before:content-none
      prose-headings:[*>a]:no-unnderline
      mx-3"
      >
        <div className="">{children}</div>
      </main>
    </>
  );
}
