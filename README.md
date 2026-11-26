# Biotibbiyot

Express.js asosidagi biotibbiyot ma’lumotlar portali.

## Ishga tushirish

```powershell
npm install
$env:ADMIN_USER="admin"
$env:ADMIN_PASSWORD="xavfsiz-parol"
npm start
```

Ilova `http://localhost:3000` manzilida ochiladi.

## Render’da maqolalarni doimiy saqlash

Render Free xizmatining fayl tizimi doimiy emas. Maqolalar o‘chirilishi yoki qo‘shilishi deploy/restartdan keyin saqlanishi uchun PostgreSQL bazasini yarating va Render xizmatining Environment sozlamalariga `DATABASE_URL` nomli o‘zgaruvchi sifatida ulanish manzilini kiriting. Ulanish manzili SSL talab qiladigan PostgreSQL URL bo‘lishi kerak.

Ilova jadvalni avtomatik yaratadi. Baza bo‘sh bo‘lsa, `data/articles.json` dagi mavjud maqolalarni bir marta ko‘chiradi; jadvalda maqolalar bo‘lsa, ularni qayta yozmaydi. `DATABASE_URL` sozlanmaganida ilova mahalliy JSON faylidan foydalanadi, ammo bu Render Free’da doimiy saqlashni kafolatlamaydi. Eski `biottibiyot.onrender.com` manzili yangi `biotibbiyot.onrender.com` manziliga yo‘naltiriladi.
