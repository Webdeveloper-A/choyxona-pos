# Choyxona POS

Next.js + Firebase asosidagi ko‘p rolli POS tizimi. Loyihada admin, ofitsiant, oshxona va kassa panellari mavjud.

## Asosiy imkoniyatlar

- Firebase Auth orqali login va ro‘yxatdan o‘tish
- Rollarga qarab avtomatik yo‘naltirish
- Menu, stol va xona boshqaruvi
- Ofitsiant tomonidan buyurtma yaratish
- Oshxona status oqimi: `new -> preparing -> ready`
- Kassa orqali to‘lovni yopish: `ready -> paid`
- Ofitsiant uchun `mark served` oqimi
- Audit log yozuvi
- Buyurtmalar tarixi va filterlash

## Ishga tushirish

```bash
npm install
npm run typecheck
npm run lint
npm run dev
```

## Deploydan oldin

1. `.env.example` dan nusxa olib `.env.local` yarating.
2. Vercel yoki boshqa hostingda **hamma env qiymatlarni** kiritib chiqing.
3. Lokal loyihadan `node_modules` ni zipga qo‘shmang. Build serverning o‘zi dependency o‘rnatishi kerak.

## Muhit o‘zgaruvchilari

`.env.example` faylida kerakli qiymatlar ro‘yxati bor. Server route lar ishlashi uchun quyidagilar to‘liq bo‘lishi shart:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## Muhim eslatma

Firestore composite indexlar talab qilinadi. Tayyor indekslar uchun `firestore.indexes.json` faylidan foydalaning.
