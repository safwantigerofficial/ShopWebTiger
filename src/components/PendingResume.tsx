'use client';
import { useState } from 'react';
import PayFlow from './PayFlow';
import CE from './CE';

export default function PendingResume({
  depositId, method,
}: {
  depositId: number;
  method: { id: number; provider: string; name: string; address?: string | null };
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button className="btn-ghost !py-1 !px-2 !text-[11px] !rounded-lg" onClick={() => setOpen((v) => !v)}>
        <CE id="5854985398857503237" size={11} /> {open ? 'Hide' : 'Resume'}
      </button>
      {open && (
        <div className="mt-3 text-left">
          <PayFlow method={method} resumeDepositId={depositId} />
        </div>
      )}
    </div>
  );
}
