'use client';
import { useEffect, useState } from 'react';

export default function ScrollTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <button
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed z-40 right-4 bottom-[76px] md:bottom-6 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border2)',
        color: 'var(--fg)',
        boxShadow: '0 8px 20px -8px rgba(17,24,39,.25)',
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0) scale(1)' : 'translateY(12px) scale(.8)',
        pointerEvents: show ? 'auto' : 'none',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
