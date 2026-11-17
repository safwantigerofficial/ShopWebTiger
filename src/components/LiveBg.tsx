'use client';
import { useEffect, useRef } from 'react';

// Animated live background: two drifting brand-colored orbs that
// also shift with scroll progress, over the static grid.
export default function LiveBg() {
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const s = scrollY / Math.max(document.body.scrollHeight - innerHeight, 1);
      const t = performance.now() / 1000;
      if (a.current)
        a.current.style.transform = `translate(${Math.sin(t / 7) * 90 + s * -160}px, ${Math.cos(t / 9) * 60 + s * 220}px)`;
      if (b.current)
        b.current.style.transform = `translate(${Math.cos(t / 8) * -110 + s * 140}px, ${Math.sin(t / 6) * 80 + s * -180}px)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div ref={a} className="absolute left-[8%] top-[6%] w-[34rem] h-[34rem] rounded-full" style={{ background: 'radial-gradient(circle, var(--spot), transparent 65%)', filter: 'blur(20px)' }} />
      <div ref={b} className="absolute right-[4%] top-[40%] w-[30rem] h-[30rem] rounded-full" style={{ background: 'radial-gradient(circle, rgba(242,165,90,.06), transparent 65%)', filter: 'blur(24px)' }} />
    </div>
  );
}
