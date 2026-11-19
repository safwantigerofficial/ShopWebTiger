'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { DBOrder } from '../../types';
import { publicOrderId } from '../../lib/services/orderId';
import { downloadTxt } from '../../lib/downloadTxt';
import UsingMethod, { type Tutorial } from '../../components/UsingMethod';
import SupportLink from '../../components/SupportLink';
import CE from '../../components/CE';

const tabs = ['Finished', 'Pending', 'Cancelled'] as const;

export default function OrdersList({ orders, tutorials }: { orders: DBOrder[]; tutorials: Record<number, Tutorial> }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>('Finished');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (tab === 'Cancelled') return o.status === 'cancelled' || o.status === 'refunded';
      if (tab === 'Pending') return o.status === 'paid' && !o.delivered_items;
      return o.status === 'paid' && !!o.delivered_items;
    });
  }, [orders, tab]);

  return (
    <div className="mt-5">
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`chip !px-5 !py-2 !text-sm ${tab === t ? 'chip-active' : 'chip-grey'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl p-8 text-center"
        style={{ border: '1.5px dashed var(--border2)', background: 'transparent' }}>
        {filtered.length === 0 && (
          <>
            <p className="text-[15px]" style={{ color: 'var(--fg2)' }}>No orders yet</p>
            <Link href="/shop" className="btn-primary !px-6 !py-2.5 mt-4 inline-flex text-sm">
              Continue shopping
            </Link>
          </>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="space-y-3 -mt-4">
          {filtered.map((o) => (
            <details key={o.id} className="card group !p-0 overflow-hidden">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 p-4">
                <div>
                  <div className="font-semibold text-[15px]">{o.product_name} ×{o.qty}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--fg3)' }}>
                    {publicOrderId(o)} · {new Date(o.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-extrabold" style={{ color: 'var(--primary)' }}>
                    ${Number(o.total).toFixed(2)}
                  </div>
                  <div className="text-[11px] group-open:hidden" style={{ color: 'var(--fg3)' }}>tap to view</div>
                </div>
              </summary>
              <div className="mx-4 mb-4 rounded-xl p-3.5 text-sm font-mono whitespace-pre-wrap break-all relative"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                {o.delivered_items && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      navigator.clipboard.writeText(o.delivered_items!).then(() => {
                        setCopiedId(o.id);
                        setTimeout(() => setCopiedId(null), 1500);
                      }).catch(() => {});
                    }}
                    className="absolute top-2 right-2 text-[11px] font-bold px-2 py-1 rounded-md"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: copiedId === o.id ? 'var(--brand, var(--primary))' : 'var(--fg2)' }}
                  >
                    {copiedId === o.id ? 'Copied' : 'Copy'}
                  </button>
                )}
                {o.delivered_items ?? 'Processing…'}
              </div>
              <div className="mx-4 mb-4 flex gap-2">
                {o.delivered_items && (
                  <button
                    className="btn-ghost flex-1 !py-2.5 text-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      downloadTxt(
                        `${publicOrderId(o)}.txt`,
                        `${o.product_name} x${o.qty} — order ${publicOrderId(o)}\n\n${o.delivered_items}`,
                      );
                    }}
                  >
                    <CE id="5318845185348626090" /> Download .txt
                  </button>
                )}
                <div className="flex-1"><UsingMethod t={o.product_id != null ? tutorials[o.product_id] : null} /></div>
              </div>
              <div className="mx-4 mb-4">
                <SupportLink
                  issue={`Hi, I have an issue with order ${publicOrderId(o)} (${o.product_name} ×${o.qty}, $${Number(o.total).toFixed(2)}).`}
                  label="Report an issue with this order"
                />
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
