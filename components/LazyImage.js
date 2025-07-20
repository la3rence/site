import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function LazyImage(props) {
  const [show, setShow] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!ref.current) return;
    const observer = new window.IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setShow(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }, // 提前加载
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{show ? <Image {...props} /> : null}</div>;
}
