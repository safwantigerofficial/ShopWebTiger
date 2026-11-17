import './globals.css';
import Link from 'next/link';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';

export const metadata = { title: 'SafwanTiger Shop', description: 'Premium digital goods — instant delivery' };

const themeInit = `(function(){var t=localStorage.getItem('st-theme')||'dark';document.documentElement.dataset.theme=t})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <link rel="icon" href="/logo.jpg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="sticky top-0 z-40 border-b" style={{ borderColor: 'var(--border)', background: 'var(--nav)', backdropFilter: 'blur(10px)' }}>
          <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight shrink-0">
              <img src="/logo.jpg" alt="SafwanTiger" className="w-9 h-9 rounded-xl object-cover" />
              <span className="hidden xs:inline">SafwanTiger <span style={{ color: 'var(--brand)' }}>Shop</span></span>
            </Link>
            <Nav />
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 pt-6 pb-10 min-h-[70vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
