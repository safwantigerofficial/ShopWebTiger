import './globals.css';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import MobileTabs from '../components/MobileTabs';
import { getSession, currentUser } from '../lib/session';

export const metadata = { title: 'SafwanTiger Shop', description: 'Your digital store' };

const themeInit = `(function(){var t=localStorage.getItem('st-theme')||'light';document.documentElement.dataset.theme=t})()`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const user = session.telegramId ? await currentUser() : null;
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
        <div className="flex min-h-screen">
          <Sidebar loggedIn={!!session.telegramId} balance={user?.balance ?? null} />
          <div className="flex-1 min-w-0 flex flex-col">
            <Topbar loggedIn={!!session.telegramId} balance={user?.balance ?? null} />
            <main className="flex-1 px-5 sm:px-8 py-6 pb-24 md:pb-6 max-w-[1100px] w-full mx-auto">{children}</main>
            <footer className="px-8 py-5 pb-20 md:pb-5 text-xs flex justify-between" style={{ color: 'var(--fg3)' }}>
              <span>SafwanTiger</span>
              <span>Your digital store</span>
            </footer>
          </div>
        </div>
        <MobileTabs />
      </body>
    </html>
  );
}
