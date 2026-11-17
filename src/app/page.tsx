import Link from 'next/link';
import { getSession } from '../lib/session';
import { listCategories, listProducts } from '../db/queries';
import Reveal from '../components/Reveal';

export const dynamic = 'force-dynamic';

const features = [
  {
    title: 'Instant delivery',
    text: 'Keys, codes and accounts auto-delivered the moment your payment clears — no waiting, no tickets.',
    svg: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z',
  },
  {
    title: 'One wallet',
    text: 'The same balance you see in the Telegram bot — top up once, spend from anywhere.',
    svg: 'M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm14 5h3v-2h-3a1 1 0 00-1 1 1 1 0 001 1z',
  },
  {
    title: 'Live freebies',
    text: 'Active drops and buff freebies — claim them here exactly like in the bot.',
    svg: 'M20 12v8H4v-8M2 7h20v5H2V7zm10 13V7M12 7c-1.5 0-3-1.3-3-2.8C9 2.5 10.4 1.5 11.7 2c1.3.6 1.3 2.5.3 5zm0 0c1.5 0 3-1.3 3-2.8 0-1.7-1.4-2.7-2.7-2.2-1.3.6-1.3 2.5-.3 5z',
  },
  {
    title: 'Refer & earn',
    text: 'Your own web referral link — earn on every friend and convert referrals straight into balance.',
    svg: 'M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 11a4 4 0 100-8 4 4 0 000 8zM21 21v-2a4 4 0 00-3-3.87M15 3.13a4 4 0 010 7.75',
  },
  {
    title: 'Buff tokens',
    text: 'Submit your code, see a live price, confirm — orders tracked in real time.',
    svg: 'M5 17l4-4 3 3 7-7M15 7h6v6',
  },
  {
    title: 'Same trust',
    text: 'One account, one history — the site is just the store window; the engine is identical.',
    svg: 'M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10z',
  },
];

const steps = [
  { n: '01', title: 'Log in with Telegram', text: 'One tap — your existing wallet, orders and referrals are already inside.' },
  { n: '02', title: 'Top up your wallet', text: 'Crypto top-up via CryptoBot — credited automatically once the invoice is paid.' },
  { n: '03', title: 'Buy and receive', text: 'Pick a product, confirm, and your item is delivered on-screen instantly.' },
];

export default async function HomePage() {
  const session = await getSession();
  const loggedIn = !!session.telegramId;
  const categories = await listCategories().catch(() => []);
  const { rows: featured } = categories.length
    ? await listProducts(categories[0].id, 0, 6).catch(() => ({ rows: [] }))
    : { rows: [] };

  return (
    <div className="space-y-28 pb-6">
      {/* HERO */}
      <section className="pt-16 sm:pt-24 text-center relative">
        <div className="hero-orb absolute left-1/2 -translate-x-1/2 -top-6 w-40 h-40 sm:w-52 sm:h-52 rounded-3xl overflow-hidden shadow-2xl"
          style={{ boxShadow: '0 30px 80px -20px rgba(62,207,142,.35), 0 0 0 1px var(--border)' }}>
          <img src="/logo.jpg" alt="SafwanTiger" className="w-full h-full object-cover" />
        </div>
        <Reveal>
          <div className="pt-44 sm:pt-56">
            <p className="text-xs uppercase tracking-[0.28em] font-semibold" style={{ color: 'var(--brand)' }}>
              SafwanTiger Shop
            </p>
            <h1 className="serif text-5xl sm:text-7xl font-medium tracking-tight mt-4 leading-[1.04]">
              Premium digital goods.<br />
              <em style={{ color: 'var(--brand)' }}>Instant</em> delivery.
            </h1>
            <p className="max-w-lg mx-auto mt-6 text-base sm:text-lg" style={{ color: 'var(--fg2)' }}>
              The same trusted store from Telegram — now with a proper storefront.
              Your balance, orders and rewards are already waiting inside.
            </p>
            <div className="flex items-center justify-center gap-3 mt-9">
              <Link href={loggedIn ? '/shop' : '/login'} className="btn-primary !px-7 !py-3.5 text-base">
                {loggedIn ? 'Open the store' : 'Log in & shop'}
              </Link>
              <a href="#how" className="btn-ghost !px-7 !py-3.5 text-base">How it works</a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* STRIP */}
      <Reveal>
        <section className="card !p-0 overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4" style={{ borderColor: 'var(--border)' }}>
            {[
              ['Instant', 'delivery'],
              ['Same', 'wallet'],
              ['Live', 'freebies'],
              ['Referral', 'rewards'],
            ].map(([a, b], i) => (
              <div key={a + b} className="px-4 py-7 text-center" style={{ borderLeft: i ? '1px solid var(--border)' : undefined }}>
                <div className="font-semibold">{a} <span style={{ color: 'var(--fg2)' }} className="font-normal">{b}</span></div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* FEATURED PRODUCTS */}
      {featured.length > 0 && (
        <section>
          <Reveal>
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="serif text-3xl sm:text-4xl font-medium">Fresh on the shelf</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--fg2)' }}>A peek at {categories[0].name.toLowerCase()} — log in to buy.</p>
              </div>
              <Link href="/shop" className="text-sm font-medium shrink-0" style={{ color: 'var(--brand)' }}>View all →</Link>
            </div>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p, i) => {
              const out = !p.unlimited_stock && p.stock <= 0;
              return (
                <Reveal key={p.id} delay={i * 60}>
                  <Link href={loggedIn ? `/product/${p.id}` : '/login'} className="card card-hover block h-full">
                    <div className="font-semibold leading-snug">{p.name}</div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="chip chip-green">${p.price.toFixed(2)}</span>
                      <span className={`chip ${out ? 'chip-red' : 'chip-grey'}`}>
                        {p.unlimited_stock ? 'In stock' : out ? 'Out of stock' : `${p.stock} left`}
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {/* FEATURES */}
      <section>
        <Reveal>
          <h2 className="serif text-3xl sm:text-4xl font-medium text-center">
            Everything the bot does — <em style={{ color: 'var(--brand)' }}>prettier</em>
          </h2>
          <p className="text-center mt-2 max-w-md mx-auto" style={{ color: 'var(--fg2)' }}>
            One account, one wallet — the website is just the front door.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-10">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <div className="card card-hover h-full">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(62,207,142,.12)', color: 'var(--brand)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={f.svg} />
                  </svg>
                </div>
                <div className="font-semibold mt-4">{f.title}</div>
                <p className="text-sm mt-1" style={{ color: 'var(--fg2)' }}>{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section>
          <Reveal>
            <h2 className="serif text-3xl sm:text-4xl font-medium text-center">Browse the shelves</h2>
          </Reveal>
          <div className="flex flex-wrap justify-center gap-2.5 mt-7">
            {categories.map((c, i) => (
              <Reveal key={c.id} delay={i * 40}>
                <Link href={loggedIn ? '/shop' : '/login'} className="chip chip-grey !text-sm !px-4 !py-2 hover:opacity-80 transition">
                  {c.name}
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section id="how">
        <Reveal>
          <h2 className="serif text-3xl sm:text-4xl font-medium text-center">Three steps. Done.</h2>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-3 mt-10">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 90}>
              <div className="card h-full relative overflow-hidden">
                <div className="serif text-6xl select-none absolute -top-2 right-3" style={{ color: 'var(--border2)' }}>{s.n}</div>
                <div className="font-semibold mt-8 relative">{s.title}</div>
                <p className="text-sm mt-2 relative" style={{ color: 'var(--fg2)' }}>{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TRUST / DETAILS */}
      <Reveal>
        <section className="card !py-8">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              ['Wallet, orders, referrals', 'Everything is shared with the bot — what you see here is what you have there.'],
              ['Crypto top-ups', 'CryptoBot invoices — the same gateway and the same auto-credit as the bot.'],
              ['Buff & freebies', 'Buff token orders and freebie claims work end-to-end on the web.'],
            ].map(([t, d]) => (
              <div key={t}>
                <div className="font-semibold">{t}</div>
                <p className="text-sm mt-1.5" style={{ color: 'var(--fg2)' }}>{d}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* FINAL CTA */}
      <Reveal>
        <section className="card text-center !py-14 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 85% at 50% 120%, rgba(62,207,142,.16), transparent)' }} />
          <img src="/logo.jpg" alt="" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-5" />
          <h2 className="serif text-3xl sm:text-4xl font-medium relative">Your wallet is already inside.</h2>
          <p className="mt-2 relative" style={{ color: 'var(--fg2)' }}>Log in once — everything carries over.</p>
          <Link href={loggedIn ? '/shop' : '/login'} className="btn-primary !px-8 !py-3.5 mt-7 relative">
            {loggedIn ? 'Open the store' : 'Log in with Telegram'}
          </Link>
        </section>
      </Reveal>
    </div>
  );
}
