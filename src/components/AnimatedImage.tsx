import { useEffect, useRef, useState } from "react";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & { wrapperClassName?: string };

export function AnimatedImage({ wrapperClassName = "", className = "", ...props }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${shown ? "in-view" : ""} overflow-hidden ${wrapperClassName}`}>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <img
        loading="lazy"
        className={`h-full w-full object-cover transition-transform duration-[1400ms] ease-out hover:scale-105 ${className}`}
        {...props}
      />
    </div>
  );
}
