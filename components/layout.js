import Header from "./header";
import Footer from "./footer";

export default function Layout(props) {
  const { children } = props;
  return (
    <>
      <Header {...props} />
      <main
        className={`mx-auto max-w-3xl prose prose-slate dark:prose-invert prose-pre:rounded-none prose-pre:bg-black
      prose-p:before:content-none prose-headings:[*>a]:no-unnderline prose-blockquote:border-purple-600
      prose-blockquote:text-purple-600 prose-blockquote:not-italic prose-blockquote:border-l-[2.6px] prose-blockquote:pl-2`}
      >
        <div>{children}</div>
        {!props.noFooter && <Footer />}
      </main>
    </>
  );
}
