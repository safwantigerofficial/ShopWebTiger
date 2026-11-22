'use client';

export default function HelpButton({ className = 'btn-ghost !py-1 !px-2.5 !text-xs !rounded-lg' }: { className?: string }) {
  return (
    <button className={className} onClick={() => window.dispatchEvent(new Event('st-open-support'))}>
      Need help?
    </button>
  );
}
