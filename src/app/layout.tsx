import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KAVACHAM | Worker Safety & Environmental Monitoring System',
  description: 'Industrial Real-Time Worker Safety and Environmental Monitoring Dashboard for ESP32/WSN Nodes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-industrial-950 text-slate-100 min-h-screen antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
