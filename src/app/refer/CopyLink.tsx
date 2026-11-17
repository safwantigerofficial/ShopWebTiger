'use client';
import { useState } from 'react';

export default function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <input className="input font-mono text-xs" readOnly value={link} onFocus={(e) => e.target.select()} />
      <button
        className="btn-ghost shrink-0"
        onClick={async () => {
          await navigator.clipboard.writeText(link).catch(() => undefined);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? '✅' : '📋 Copy'}
      </button>
    </div>
  );
}
