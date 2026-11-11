/**
 * The ONLY place the offline service worker is registered.
 * It never registers in development, inside iframes (editor previews), or with ?sw=off.
 */
const SW_PATH = 'sw.js';

async function unregisterAppWorkers() {
  if (!('serviceWorker' in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs.filter((r) => r.active?.scriptURL.endsWith('/' + SW_PATH) || r.installing?.scriptURL.endsWith('/' + SW_PATH)).map((r) => r.unregister())
  );
}

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1') return true;
  if (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(host)) return true;
  if (/(^|\.)lovableproject(-dev)?\.com$/.test(host) || /(^|\.)beta\.lovable\.dev$/.test(host)) return true;
  if (new URLSearchParams(window.location.search).get('sw') === 'off') return true;
  return false;
}

export async function setupOfflineSupport() {
  if (!('serviceWorker' in navigator)) return;
  if (isRefusedContext()) {
    await unregisterAppWorkers();
    return;
  }
  const { registerSW } = await import('virtual:pwa-register');
  registerSW({ immediate: true });
}
