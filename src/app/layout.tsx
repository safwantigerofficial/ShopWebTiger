import './globals.css';
import Link from 'next/link';
import Nav from '../components/Nav';

export const metadata = { title: 'SafwanTiger Shop', description: 'Premium digital goods — instant delivery' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="sticky top-0 z-40 border-b border-night-600 bg-night-950/70 backdrop-blur">
          <div className="mx-auto max-w-4xl px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="text-xl">🐯</span>
              <span>SafwanTiger <span className="text-brand">Shop</span></span>
            </Link>
            <div className="hidden sm:flex items-center gap-5 text-sm text-slate-400">
              <Link href="/shop" className="hover:text-slate-200">Shop</Link>
              <Link href="/orders" className="hover:text-slate-200">Orders</Link>
              <Link href="/wallet" className="hover:text-slate-200">Wallet</Link>
              <Link href="/freebies" className="hover:text-slate-200">Freebies</Link>
              <Link href="/refer" className="hover:text-slate-200">Refer &amp; Earn</Link>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 pt-6 pb-24">{children}</main>
        <Nav />
      </body>
    </html>
  );
}
