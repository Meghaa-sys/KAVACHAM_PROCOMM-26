import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KAVACHAM | Worker Safety & Environmental Monitoring System',
  description:
    'Industrial Real-Time Worker Safety and Environmental Monitoring Dashboard for ESP32/WSN Nodes',
};

export const viewport: Viewport = {
  themeColor: '#05070c',
  width: 'device-width',
  initialScale: 1,
  // Control-room dashboards are read on phones at arm's length - keep pinch zoom.
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Webfonts load progressively; the CSS stack falls back to system UI
            fonts if the network is unavailable (offline mine-site gateways). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700;800&display=swap"
        />
      </head>
      <body className="bg-industrial-980 text-slate-100 min-h-[100dvh] antialiased font-sans selection:bg-cyan-500/30 selection:text-cyan-100">
        {children}
      </body>
    </html>
  );
}
