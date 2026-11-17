import './globals.css';
import Nav from '../components/Nav';

export const metadata = { title: 'SafwanTiger Shop', description: 'Digital goods store' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto max-w-3xl px-4 pt-4 pb-24">{children}</main>
        <Nav />
      </body>
    </html>
  );
}
