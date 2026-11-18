'use client';
import { useState } from 'react';
import CEText from './CEText';
import CE from './CE';

export type Tutorial = { text: string | null; url: string | null; fileId: string | null; fileType: string | null };

export default function UsingMethod({ t }: { t: Tutorial | null | undefined }) {
  const [open, setOpen] = useState(false);
  const has = !!(t && (t.text?.trim() || t.url || t.fileId));
  return (
    <div>
      <button type="button" className="btn-ghost w-full !py-2.5 text-sm" onClick={(e) => { e.preventDefault(); setOpen((v) => !v); }}>
        <CE id="5794085322400733645" /> Using method
      </button>
      {open && (
        <div className="mt-2 rounded-xl p-3.5 text-sm whitespace-pre-wrap leading-relaxed text-left"
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--fg2)' }}>
          {has ? (
            <>
              {t!.text?.trim() && <CEText text={t!.text} />}
              {t!.fileId && t!.fileType === 'photo' && (
                <img src={`/api/tgfile?file=${encodeURIComponent(t!.fileId)}&name=guide.jpg`} alt="" className="mt-3 rounded-lg max-w-full" />
              )}
              {t!.fileId && t!.fileType !== 'photo' && (
                <a className="btn-ghost mt-3 !py-2 text-sm w-full" href={`/api/tgfile?file=${encodeURIComponent(t!.fileId)}&name=guide${t!.fileType === 'video' ? '.mp4' : ''}`}>
                  Download guide {t!.fileType}
                </a>
              )}
              {t!.url && /^https?:\/\//.test(t!.url) && (
                <a className="btn-primary mt-3 !py-2 text-sm w-full" href={t!.url} target="_blank" rel="noreferrer">Open guide link</a>
              )}
            </>
          ) : (
            'No using method has been added for this product yet. Contact support if you need help.'
          )}
        </div>
      )}
    </div>
  );
}
