/** Tiny browser-side helpers shared by site client components. */

export const EV_INQUIRY = 'rgs:inquiry';
export const EV_SEARCH = 'rgs:search';

export function openInquiry(product = ''): void {
  window.dispatchEvent(new CustomEvent(EV_INQUIRY, { detail: { product } }));
}

export function toast(msg: string, ok = true): void {
  const t = document.createElement('div');
  t.className = `toast ${ok ? 'toast--ok' : 'toast--err'}`;
  t.setAttribute('role', 'status');
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('is-visible')));
  setTimeout(() => {
    t.classList.remove('is-visible');
    setTimeout(() => t.remove(), 500);
  }, 4000);
}
