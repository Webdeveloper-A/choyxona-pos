# Occupancy Fix

Qo‘shilgan asosiy o‘zgarishlar:

- Stol/xona `status` maydoni endi faqat ko‘rinish uchun emas, real biznes qoidaga aylandi.
- `customer` va `waiter` panelida `band` joylar tanlab bo‘lmaydi.
- Yangi order yaratilganda tanlangan stol/xona avtomatik `band` bo‘ladi.
- Order `paid` yoki `cancelled` bo‘lganda stol/xona avtomatik `bo'sh` ga qaytadi.
- Backend transaction ishlatadi, shuning uchun bir joyni bir vaqtda ikki foydalanuvchi olib qo‘yishi oldi olinadi.

O‘zgargan fayllar:

- `src/lib/constants/place-status.ts`
- `src/types/table.ts`
- `src/types/room.ts`
- `src/app/api/orders/create/route.ts`
- `src/app/api/orders/update-status/route.ts`
- `src/app/(customer)/customer/page.tsx`
- `src/app/(staff)/waiter/page.tsx`

Muhim tradeoff:

Hozirgi logika `bir joy = bir aktiv order` qoidasi bilan ishlaydi.
Demak stol/xona band bo‘lsa, waiter ham yangi order ocholmaydi.
Agar keyinroq bitta stolga bir necha bosqichda qo‘shimcha buyurtma qo‘shish kerak bo‘lsa,
`open tab / active session` arxitekturasiga o‘tish kerak bo‘ladi.
