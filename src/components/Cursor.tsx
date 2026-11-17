'use client';
import { useEffect, useRef } from 'react';

// Custom cursor: green dot + soft trailing ring, like the verify site.
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia('(pointer: coarse)').matches) return; // touch — skip
    document.body.classList.add('custom-cursor');
    const dot = dotRef.current!;
    const ring = ringRef.current!;
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, raf = 0;
    const move = (e: MouseEvent) => { x = e.clientX; y = e.clientY; };
    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      dot.style.transform = `translate(${x}px,${y}px)`;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      ring.classList.toggle('cursor-hover', !!t.closest('a,button,[role=button]'));
    };
    addEventListener('mousemove', move, { passive: true });
    addEventListener('mouseover', over, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      document.body.classList.remove('custom-cursor');
      removeEventListener('mousemove', move);
      removeEventListener('mouseover', over);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}
