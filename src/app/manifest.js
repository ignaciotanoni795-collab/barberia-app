export default function manifest() {
  return {
    name: 'Otto Barbería',
    short_name: 'Otto',
    description: 'Reservá tu turno en Otto Barbería',
    start_url: '/',
    display: 'standalone',
    background_color: '#1C1917',
    theme_color: '#1C1917',
    lang: 'es-AR',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
