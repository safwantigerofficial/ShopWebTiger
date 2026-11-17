import Link from 'next/link';
import { getSession } from '../lib/session';
import { listCategories } from '../db/queries';
import Reveal from '../components/Reveal';

export const dynamic = 'force-dynamic';

const features = [
  { icon: '⚡', title: 'Instant delivery', text: 'Your item lands in seconds — keys, codes and accounts auto-delivered the moment you pay.' },
  { icon: '💳', title: 'Wallet balance', text: 'Top up once, buy anytime. Same balance as the Telegram bot — one wallet, two doors.' },
  { icon: '🎁', title: 'Freebies', text: 'Active drops and buff freebies — claim them here just like in the bot.' },
  { icon: '🤝', title: 'Refer & earn', text: 'Share your link, earn on every friend, and convert referrals straight into balance.' },
  { icon: '🚀', title: 'Buff tokens', text: 'Submit your code, get a live price, confirm — orders tracked in real time.' },
  { icon: '🛡', title: 'Your data is yours', text: 'Same account, same history, same trust — the site just gives it a proper face.' },
];

const steps = [
  { n: '01', title: 'Log in with Telegram', text: 'One tap — your existing wallet, orders and referrals are already inside.' },
  { n: '02', title: 'Top up your wallet', text: 'Crypto top-up via CryptoBot, credited automatically when the invoice is paid.' },
  { n: '03', title: 'Buy and receive', text: 'Pick a product, confirm, and your item is delivered instantly on-screen.' },
];

export default async function HomePage() {
  const session = await getSession();
  const loggedIn = !!session.telegramId;
  const categories = await listCategories().catch(() => []);

  return (
    <div className="space-y-24 pb-4">
      {/* HERO */}
      <section className="pt-14 sm:pt-20 text-center">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.25em] text-brand font-semibold">🐯 SafwanTiger Shop</p>
          <h1 className="serif text-5xl sm:text-7xl font-medium tracking-tight mt-4 leading-[1.05]">
            Premium digital goods.<br />
            <em className="text-brand">Instant</em> delivery.
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto mt-5 text-base sm:text-lg">
            The same trusted store from Telegram — now with a proper storefront.
            Your balance, orders and rewards are already waiting inside.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link href={loggedIn ? '/shop' : '/login'} className="btn-primary !px-6 !py-3 text-base">
              {loggedIn ? 'Open the store →' : 'Log in & shop →'}
            </Link>
            <a href="#how" className="btn-ghost !px-6 !py-3 text-base">How it works</a>
          </div>
        </Reveal>
      </section>

      {/* STATS / CATEGORIES STRIP */}
      <Reveal>
        <section className="card !p-0 overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-night-600">
            {[
              ['⚡', 'Instant', 'delivery'],
              ['🛡', 'Same', 'wallet'],
              ['🎁', 'Live', 'freebies'],
              ['🤝', 'Referral', 'rewards'],
            ].map(([icon, a, b]) => (
              <div key={a + b} className="px-4 py-6 text-center">
                <div className="text-2xl">{icon}</div>
                <div className="font-semibold mt-1">{a} <span className="text-slate-400 font-normal">{b}</span></div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* FEATURES GRID */}
      <section>
        <Reveal>
          <h2 className="serif text-3xl sm:text-4xl font-medium text-center">Everything the bot does — <em className="text-brand">prettier</em></h2>
          <p className="text-slate-400 text-center mt-2 max-w-md mx-auto">One account, one wallet — the website is just the front door.</p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <div className="card card-hover h-full">
                <div className="text-2xl">{f.icon}</div>
                <div className="font-semibold mt-3">{f.title}</div>
                <p className="text-sm text-slate-400 mt-1">{f.text}</p>
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
          <div className="flex flex-wrap justify-center gap-2.5 mt-6">
            {categories.map((c, i) => (
              <Reveal key={c.id} delay={i * 40}>
                <Link href={loggedIn ? '/shop' : '/login'} className="chip chip-grey !text-sm !px-4 !py-2 hover:border-brand transition">
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
        <div className="grid sm:grid-cols-3 gap-3 mt-8">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 80}>
              <div className="card h-full relative overflow-hidden">
                <div className="serif text-5xl text-night-500 select-none absolute -top-1 right-3">{s.n}</div>
                <div className="font-semibold mt-6 relative">{s.title}</div>
                <p className="text-sm text-slate-400 mt-2 relative">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <Reveal>
        <section className="card text-center !py-12 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 80% at 50% 120%, rgba(62,207,142,.14), transparent)' }} />
          <h2 className="serif text-3xl sm:text-4xl font-medium relative">Your wallet is already inside.</h2>
          <p className="text-slate-400 mt-2 relative">Log in once — everything carries over.</p>
          <Link href={loggedIn ? '/shop' : '/login'} className="btn-primary !px-8 !py-3 mt-6 relative">
            {loggedIn ? 'Open the store →' : 'Log in with Telegram →'}
          </Link>
        </section>
      </Reveal>
    </div>
  );
}
