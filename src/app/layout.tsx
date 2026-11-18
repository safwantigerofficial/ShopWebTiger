import './globals.css';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import ThemeToggle from '../components/ThemeToggle';
import Cursor from '../components/Cursor';
import { getSession } from '../lib/session';

export const metadata = { title: 'SafwanTiger Shop', description: 'Your digital store' };

const themeInit = `(function(){var t=localStorage.getItem('st-theme')||'light';document.documentElement.dataset.theme=t})()`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <link rel="icon" href="/logo.jpg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Cursor />
        <div className="flex min-h-screen">
          <Sidebar loggedIn={!!session.telegramId} />
          <div className="flex-1 min-w-0 flex flex-col">
            <Topbar loggedIn={!!session.telegramId} />
            <main className="flex-1 px-5 sm:px-8 py-6 max-w-[1100px] w-full mx-auto">{children}</main>
            <footer className="px-8 py-5 text-xs flex justify-between" style={{ color: 'var(--fg3)' }}>
              <span>SafwanTiger</span>
              <span>Your digital store</span>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
