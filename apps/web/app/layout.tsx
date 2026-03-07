import './globals.css';
import Link from 'next/link';

const nav = [
  ['Dashboard', '/dashboard'],
  ['Connections', '/connections'],
  ['Projects', '/projects'],
  ['Release Contexts', '/release-contexts'],
  ['Requirements', '/requirements'],
  ['Generate', '/generate'],
  ['Review Workspace', '/workspace'],
  ['Push Executions', '/push-executions'],
  ['Activity Log', '/audit']
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen grid grid-cols-[260px_1fr]">
          <aside className="bg-slate-950 text-slate-100 p-4">
            <h1 className="text-lg font-semibold mb-4">Osiris Enterprise POC</h1>
            <nav className="space-y-1">{nav.map(([label, href]) => <Link key={href} href={href} className="block rounded px-2 py-1 hover:bg-slate-800">{label}</Link>)}</nav>
          </aside>
          <main>
            <header className="border-b bg-white px-6 py-3 text-sm text-slate-600 flex justify-between"><span>Organization: Demo Org</span><span>Workflow: Connect → Discover → Select → Generate → Review → Push</span></header>
            <section className="p-6">{children}</section>
          </main>
        </div>
      </body>
    </html>
  );
}
