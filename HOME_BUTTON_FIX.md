# Home page navigation fix

## Nima o'zgardi
- Bosh sahifadagi **Kirish** va **Ro'yxatdan o'tish** tugmalari oddiy `Link` o'rniga client-side `router.push()` orqali ishlaydigan tugmalarga o'tkazildi.
- Navigatsiya ishlamay qolsa, browser-level fallback sifatida `window.location.assign()` qo'shildi.
- Qo'shimcha alias redirectlar qo'shildi:
  - `/logon` -> `/login`
  - `/signin` -> `/login`
  - `/signup` -> `/register`

## O'zgargan fayllar
- `src/components/public/home-cta-buttons.tsx` — yangi komponent
- `src/app/(public)/page.tsx` — bosh sahifa tugmalari yangilandi
- `next.config.ts` — redirectlar qo'shildi

## Tekshiruv
- `npm run typecheck` — passed
- `npm run lint` — passed
