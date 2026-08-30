import { NextResponse } from 'next/server';

const DEFAULTS = {
  name: 'Forkiva POS',
  short_name: 'Forkiva',
  description: 'Forkiva restaurant POS and management system.',
  background_color: '#ffffff',
  theme_color: '#714B67',
  icon: '/favicon.ico',
};

export async function GET() {
  let manifest = { ...DEFAULTS, pwa_enabled: false };

  try {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1';
    const res = await fetch(`${base}/app/settings`, { next: { revalidate: 300 } });
    if (res.ok) {
      const json = await res.json();
      const s = json.body || {};
      manifest = {
        pwa_enabled: Boolean(s.pwa_enabled),
        name: String(s.pwa_name || DEFAULTS.name),
        short_name: String(s.pwa_short_name || DEFAULTS.short_name),
        description: String(s.pwa_description || DEFAULTS.description),
        background_color: String(s.pwa_background_color || DEFAULTS.background_color),
        theme_color: String(s.pwa_theme_color || DEFAULTS.theme_color),
        icon: String(s.pwa_icon || DEFAULTS.icon),
      };
    }
  } catch {
    /* use defaults */
  }

  const body = {
    name: manifest.name,
    short_name: manifest.short_name,
    description: manifest.description,
    start_url: '/admin/pos',
    display: 'standalone',
    background_color: manifest.background_color,
    theme_color: manifest.theme_color,
    orientation: 'any',
    icons: [
      {
        src: manifest.icon,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: manifest.icon,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };

  return NextResponse.json(body, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
