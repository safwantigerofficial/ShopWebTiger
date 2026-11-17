'use client';
import { useEffect, useRef, useState } from 'react';

// heygen-style custom cursor: white arrow with blue edge, switches
// to a blue-and-white hand over interactive elements.
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);

  useEffect(() => {
    if (matchMedia('(pointer: coarse)').matches) return;
    document.body.classList.add('custom-cursor');
    const el = ref.current!;
    let raf = 0;
    const move = (e: MouseEvent) => {
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
      });
      const t = e.target as HTMLElement;
      setHover(!!t.closest('a,button,input,textarea,select,label,[role=button]'));
    };
    const press = (e: MouseEvent) => setDown(e.type === 'mousedown');
    addEventListener('mousemove', move, { passive: true });
    addEventListener('mousedown', press);
    addEventListener('mouseup', press);
    return () => {
      document.body.classList.remove('custom-cursor');
      removeEventListener('mousemove', move);
      removeEventListener('mousedown', press);
      removeEventListener('mouseup', press);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="fixed top-0 left-0 z-[9999] pointer-events-none"
      style={{ transition: 'transform 0.06s linear' }}
    >
      {hover ? (
        // hand pointer — white fill, blue outline (like heygen)
        <svg width="32" height="32" viewBox="0 0 24 24" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.3" strokeLinejoin="round"
          style={{ transform: `translate(-2px,-4px) scale(${down ? 0.9 : 1})`, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.4))' }}>
          <path d="M8.5 12.5V5.8a1.3 1.3 0 012.6 0v5.2h1V4.5a1.3 1.3 0 012.6 0v6h1V6.3a1.3 1.3 0 012.6 0v4.2h1V8a1.3 1.3 0 012.6 0v7.2c0 4-2.8 6.3-6.3 6.3-3 0-4.6-1.2-6-3.6l-2.6-4.3c-.6-1 .3-1.9 1.2-1.6l1.7.5z" />
        </svg>
      ) : (
        // arrow pointer — white fill, blue outline
        <svg width="30" height="30" viewBox="0 0 24 24" fill="#171717" stroke="#0a0a0a" strokeWidth="1.5" strokeLinejoin="round"
          style={{ transform: `scale(${down ? 0.88 : 1})`, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.4))' }}>
          <path d="M4 2l16 8.5-7 1.5-3.2 7L4 2z" />
        </svg>
      )}
    </div>
  );
}
