'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { EV_SEARCH, openInquiry, toast } from '@/lib/client-events';

/**
 * Port of the PHP site's main.js. Global behaviour is wired once; page-level widgets
 * (rails, tabs, testimonials, reels, gallery, hero) are re-initialised after every navigation.
 */
type Cleanup = () => void;

const $ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document) => c.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document) => Array.from(c.querySelectorAll<T>(s));
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = () => (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

/* ---------------- once per page load ---------------- */

function initGlobal(): Cleanup {
  const cleanups: Cleanup[] = [];
  const body = document.body;

  // Preloader (first page view of the session only)
  const preloader = $('#preloader');
  if (preloader && document.documentElement.classList.contains('show-preloader')) {
    const hide = () => { preloader.classList.add('is-done'); setTimeout(() => preloader.remove(), 600); };
    if (document.readyState === 'complete') setTimeout(hide, 400);
    else window.addEventListener('load', () => setTimeout(hide, 300), { once: true });
    setTimeout(hide, 2500);
  } else preloader?.remove();

  // Header shrink + back-to-top
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    $('#header')?.classList.toggle('is-scrolled', y > 30);
    $('#backToTop')?.classList.toggle('is-visible', y > 700);
    ticking = false;
  };
  const scrollListener = () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } };
  window.addEventListener('scroll', scrollListener, { passive: true });
  onScroll();
  cleanups.push(() => window.removeEventListener('scroll', scrollListener));

  // Scroll reveal + counters (also for content added later, e.g. filtered product grids)
  const animateCount = (el: HTMLElement) => {
    const target = parseInt(el.dataset.count || '0', 10) || 0;
    if (reduceMotion()) { el.textContent = target.toLocaleString('en-IN'); return; }
    const t0 = performance.now(), dur = 1600;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('en-IN');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target as HTMLElement;
    if (el.dataset.count !== undefined) animateCount(el);
    el.classList.add('is-in');
    io.unobserve(el);
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  const seen = new WeakSet<Element>();
  const observe = (root: ParentNode = document) => {
    $$('.reveal:not(.is-in), .reveal-img:not(.is-in), [data-count]', root).forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      io.observe(el);
    });
  };
  observe();
  const mo = new MutationObserver((muts) => {
    for (const m of muts) m.addedNodes.forEach((n) => { if (n.nodeType === 1) { observe(n as Element); if ((n as Element).matches?.('.reveal, [data-count]')) observe(n.parentElement ?? document); } });
  });
  mo.observe(body, { childList: true, subtree: true });
  cleanups.push(() => { mo.disconnect(); io.disconnect(); });

  // Click delegation (capture phase, so it runs before links navigate)
  const onClick = (e: MouseEvent) => {
    const t = e.target as Element;
    const q = t.closest<HTMLElement>('[data-quick-inquiry]');
    if (q) { e.preventDefault(); openInquiry(q.dataset.product || ''); return; }
    if (t.closest('[data-search-open]')) { e.preventDefault(); window.dispatchEvent(new Event(EV_SEARCH)); return; }
    const a = t.closest<HTMLAnchorElement>('[data-lightbox]');
    if (a) { e.preventDefault(); openLightbox(a); return; }
    if (t.closest('#backToTop')) window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
  };
  document.addEventListener('click', onClick, true);
  cleanups.push(() => document.removeEventListener('click', onClick, true));

  // WhatsApp button: peek label once
  const fab = $('.fab--wa');
  if (fab && !reduceMotion()) {
    const t = setTimeout(() => { fab.classList.add('is-peek'); setTimeout(() => fab.classList.remove('is-peek'), 3200); }, 2500);
    cleanups.push(() => clearTimeout(t));
  }

  // Server-rendered toasts fade out
  $$('.toast.is-visible').forEach((t) => setTimeout(() => t.classList.remove('is-visible'), 5000));

  return () => cleanups.forEach((c) => c());
}

/* ---------------- lightbox ---------------- */

let lb: HTMLDivElement | null = null;
let lbItems: { href: string; caption: string }[] = [];
let lbIndex = 0;

function buildLightbox() {
  lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.hidden = true;
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Image viewer');
  const svg = (d: string) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="${d}"/></svg>`;
  lb.innerHTML = `
    <button class="lightbox__btn lightbox__close" aria-label="Close">${svg('M18 6 6 18M6 6l12 12')}</button>
    <button class="lightbox__btn lightbox__prev" aria-label="Previous">${svg('m15 18-6-6 6-6')}</button>
    <img class="lightbox__img" alt="">
    <button class="lightbox__btn lightbox__next" aria-label="Next">${svg('m9 18 6-6-6-6')}</button>
    <div class="lightbox__caption"></div>`;
  document.body.appendChild(lb);
  lb.addEventListener('click', (e) => {
    const t = e.target as Element;
    if (t.closest('.lightbox__close') || t === lb) closeLightbox();
    else if (t.closest('.lightbox__prev')) showLb(lbIndex - 1);
    else if (t.closest('.lightbox__next')) showLb(lbIndex + 1);
  });
  document.addEventListener('keydown', (e) => {
    if (!lb || lb.hidden) return;
    if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
    if (e.key === 'ArrowRight') showLb(lbIndex + 1);
    if (e.key === 'Escape') closeLightbox();
  });
}

function showLb(i: number) {
  if (!lb) return;
  lbIndex = (i + lbItems.length) % lbItems.length;
  const item = lbItems[lbIndex];
  const img = $<HTMLImageElement>('.lightbox__img', lb)!;
  img.src = item.href;
  img.alt = item.caption;
  $('.lightbox__caption', lb)!.textContent = item.caption;
  $('.lightbox__prev', lb)!.hidden = $('.lightbox__next', lb)!.hidden = lbItems.length < 2;
}

function closeLightbox() {
  if (lb && !lb.hidden) { lb.hidden = true; document.body.style.overflow = ''; }
}

function openLightbox(a: HTMLAnchorElement) {
  if (!lb) buildLightbox();
  const nodes = $$<HTMLAnchorElement>(`[data-lightbox="${a.dataset.lightbox}"]`);
  lbItems = nodes.map((n) => ({ href: n.getAttribute('href') || '', caption: n.dataset.caption || '' }));
  lb!.hidden = false;
  document.body.style.overflow = 'hidden';
  showLb(nodes.indexOf(a));
  $<HTMLButtonElement>('.lightbox__close', lb!)?.focus();
}

/* ---------------- per page ---------------- */

function initPage(): Cleanup {
  const ac = new AbortController();
  const signal = ac.signal; // every listener below is removed when the page changes
  const cleanups: Cleanup[] = [() => ac.abort()];
  const on = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void) => window.addEventListener(type, fn, { signal });

  // Hero: showroom video + pointer parallax
  const heroVisual = $('[data-parallax]');
  if (heroVisual) {
    const heroVideo = $<HTMLVideoElement>('video', heroVisual);
    if (heroVideo) {
      if (reduceMotion() || saveData()) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }
      else {
        const vio = new IntersectionObserver(([e]) => (e.isIntersecting ? heroVideo.play().catch(() => {}) : heroVideo.pause()), { threshold: 0.2 });
        vio.observe(heroVideo);
        cleanups.push(() => vio.disconnect());
      }
    }
    if (!reduceMotion() && window.matchMedia('(hover: hover) and (min-width: 1024px)').matches) {
      const hero = heroVisual.closest<HTMLElement>('.hero2');
      const layers = $$('[data-depth]', heroVisual);
      let raf = 0;
      const set = (dx: number, dy: number) => layers.forEach((l) => {
        const d = parseFloat(l.dataset.depth || '0') || 0;
        l.style.setProperty('--px', `${(-dx * d).toFixed(1)}px`);
        l.style.setProperty('--py', `${(-dy * d).toFixed(1)}px`);
      });
      hero?.addEventListener('pointermove', (e) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = heroVisual.getBoundingClientRect();
          set(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        });
      }, { signal });
      hero?.addEventListener('pointerleave', () => set(0, 0), { signal });
    }
  }

  // Rails: arrow buttons + mouse drag
  $$('[data-rail-nav]').forEach((navEl) => {
    const rail = document.getElementById(navEl.dataset.railNav || '');
    if (!rail) return;
    const btns = $$<HTMLButtonElement>('button', navEl);
    const update = () => {
      btns[0].disabled = rail.scrollLeft < 4;
      btns[1].disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
    };
    btns.forEach((b) => b.addEventListener('click', () => rail.scrollBy({ left: +(b.dataset.dir || 1) * rail.clientWidth * 0.8, behavior: reduceMotion() ? 'auto' : 'smooth' }), { signal }));
    rail.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true, signal });
    on('resize', update);
    update();
  });
  $$('.rail').forEach((rail) => {
    let down = false, startX = 0, startLeft = 0, moved = false;
    rail.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; startX = e.clientX; startLeft = rail.scrollLeft; }, { signal });
    on('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) { moved = true; rail.classList.add('is-dragging'); }
      rail.scrollLeft = startLeft - dx;
    });
    on('pointerup', () => { if (!down) return; down = false; setTimeout(() => rail.classList.remove('is-dragging'), 0); });
    rail.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, { capture: true, signal });
    rail.addEventListener('dragstart', (e) => e.preventDefault(), { signal });
  });

  // Tabs with sliding ink bar
  $$('[data-tabs]').forEach((tabs) => {
    const btns = $$<HTMLButtonElement>('.tabs__btn', tabs);
    const ink = $('.tabs__ink', tabs);
    const moveInk = (b: HTMLElement | null) => { if (ink && b) { ink.style.width = b.offsetWidth + 'px'; ink.style.transform = `translateX(${b.offsetLeft}px)`; } };
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-selected', String(x === b)); });
      btns.forEach((x) => {
        const panel = document.getElementById(x.getAttribute('aria-controls') || '');
        if (!panel) return;
        const show = x === b;
        panel.hidden = !show;
        panel.classList.toggle('is-active', show);
        if (show) {
          $$('.reveal', panel).forEach((el) => el.classList.add('is-in'));
          panel.classList.remove('is-entering'); void panel.offsetWidth; panel.classList.add('is-entering');
        }
      });
      moveInk(b);
    }, { signal }));
    const active = () => $('.tabs__btn.is-active', tabs) || btns[0];
    requestAnimationFrame(() => moveInk(active()));
    on('resize', () => moveInk(active()));
    document.fonts?.ready.then(() => moveInk(active()));
  });

  // Testimonials
  const tm = $('[data-tm]');
  if (tm) {
    const track = $('.tm__track', tm)!;
    const cards = $$('.tm__card', tm);
    const cur = $('[data-tm-current]');
    const DELAY = 6000;
    let index = 0, timer: ReturnType<typeof setTimeout> | undefined, inView = false;
    const pad = (n: number) => String(n).padStart(2, '0');
    const setActive = (i: number) => {
      index = (i + cards.length) % cards.length;
      cards.forEach((c, k) => c.classList.toggle('is-active', k === index));
      if (cur) cur.textContent = pad(index + 1);
    };
    const restart = () => {
      clearTimeout(timer);
      tm.classList.remove('is-running'); void tm.offsetWidth;
      if (reduceMotion() || !inView || tm.classList.contains('is-paused') || cards.length < 2) return;
      tm.classList.add('is-running');
      timer = setTimeout(() => go(index + 1), DELAY);
    };
    const go = (i: number) => {
      setActive(i);
      track.scrollTo({ left: cards[index].offsetLeft - track.offsetLeft, behavior: reduceMotion() ? 'auto' : 'smooth' });
      restart();
    };
    $('[data-tm-prev]')?.addEventListener('click', () => go(index - 1), { signal });
    $('[data-tm-next]')?.addEventListener('click', () => go(index + 1), { signal });
    tm.addEventListener('mouseenter', () => { tm.classList.add('is-paused'); clearTimeout(timer); }, { signal });
    tm.addEventListener('mouseleave', () => { tm.classList.remove('is-paused'); restart(); }, { signal });
    let st: ReturnType<typeof setTimeout> | undefined;
    track.addEventListener('scroll', () => {
      clearTimeout(st);
      st = setTimeout(() => {
        const left = track.scrollLeft;
        let best = 0;
        cards.forEach((c, k) => { if (Math.abs(c.offsetLeft - track.offsetLeft - left) < Math.abs(cards[best].offsetLeft - track.offsetLeft - left)) best = k; });
        if (best !== index) { setActive(best); restart(); }
      }, 120);
    }, { passive: true, signal });
    tm.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') go(index + 1); if (e.key === 'ArrowLeft') go(index - 1); }, { signal });
    const tio = new IntersectionObserver(([e]) => { inView = e.isIntersecting; restart(); }, { threshold: 0.3 });
    tio.observe(tm);
    cleanups.push(() => { tio.disconnect(); clearTimeout(timer); });
  }

  // Reels: muted looping videos that play only while on screen
  const reelVideos = $$<HTMLVideoElement>('.reel__video[data-src]');
  if (reelVideos.length && !reduceMotion() && !saveData()) {
    const attach = (v: HTMLVideoElement) => { if (!v.getAttribute('src')) { v.src = v.dataset.src || ''; v.preload = 'auto'; } };
    const play = (v: HTMLVideoElement) => { attach(v); v.muted = true; v.play().catch(() => {}); };
    const warm = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { attach(e.target as HTMLVideoElement); warm.unobserve(e.target); }
    }), { rootMargin: '300px 600px' });
    const vis = new IntersectionObserver((entries) => entries.forEach((e) => {
      const v = e.target as HTMLVideoElement;
      if (e.isIntersecting) play(v); else v.pause();
    }), { threshold: 0.35 });
    reelVideos.forEach((v) => { warm.observe(v); vis.observe(v); });
    const onVis = () => reelVideos.forEach((v) => {
      if (document.hidden) v.pause();
      else if (v.getAttribute('src')) { const r = v.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) play(v); }
    });
    document.addEventListener('visibilitychange', onVis, { signal });
    cleanups.push(() => { warm.disconnect(); vis.disconnect(); });
  }

  // Reels: like & share
  let liked: string[] = [];
  try { liked = JSON.parse(localStorage.getItem('rgs-likes') || '[]'); } catch { /* storage unavailable */ }
  $$('[data-like]').forEach((btn, i) => {
    const key = btn.closest('.reel')?.querySelector('.reel__link')?.getAttribute('href') || String(i);
    if (liked.includes(key)) btn.setAttribute('aria-pressed', 'true');
    btn.addEventListener('click', () => {
      const isOn = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(isOn));
      const at = liked.indexOf(key);
      if (isOn && at < 0) liked.push(key); else if (!isOn && at >= 0) liked.splice(at, 1);
      try { localStorage.setItem('rgs-likes', JSON.stringify(liked)); } catch { /* storage unavailable */ }
    }, { signal });
  });
  $$('[data-share]').forEach((btn) => btn.addEventListener('click', async () => {
    const url = btn.dataset.share || location.href, title = btn.dataset.title || document.title;
    if (navigator.share) { try { await navigator.share({ title, url }); } catch { /* cancelled */ } return; }
    try { await navigator.clipboard.writeText(url); toast('Link copied to clipboard'); } catch { window.open(url, '_blank', 'noopener'); }
  }, { signal }));

  // Product gallery thumbnails
  const galleryMain = $<HTMLAnchorElement>('#galleryMain');
  if (galleryMain) {
    $$<HTMLButtonElement>('.gallery__thumb').forEach((t) => t.addEventListener('click', () => {
      $$('.gallery__thumb').forEach((x) => x.classList.remove('is-active'));
      t.classList.add('is-active');
      const img = $<HTMLImageElement>('img', galleryMain)!;
      const source = $<HTMLSourceElement>('source', galleryMain);
      img.style.opacity = '0';
      setTimeout(() => {
        if (source) source.srcset = t.dataset.webp || t.dataset.full || '';
        img.removeAttribute('srcset');
        img.src = t.dataset.full || '';
        img.style.opacity = '1';
      }, 160);
      galleryMain.setAttribute('href', t.dataset.full || '');
    }, { signal }));
  }

  return () => cleanups.forEach((c) => c());
}

export function SiteEffects() {
  const pathname = usePathname();
  useEffect(() => initGlobal(), []);
  useEffect(() => {
    closeLightbox();
    return initPage();
  }, [pathname]);
  return null;
}
