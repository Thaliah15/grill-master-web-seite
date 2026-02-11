# restaurant-orders (Next.js + Prisma + Stripe + COD)

هذا مشروع جاهز (MVP) لموقع مطعم:
- عرض المنيو + سلة
- Checkout: دفع أونلاين عبر Stripe أو دفع عند الاستلام (COD)
- لوحة إدارة بسيطة للطلبات والمنتجات (/admin) بتوكن

## تشغيل محلياً
1) ثبّت Node.js (LTS)
2) انسخ البيئة:
```bash
cp .env.example .env
```

3) ثبّت الحزم:
```bash
npm install
```

4) جهّز قاعدة البيانات (SQLite افتراضي):
```bash
npm run prisma:migrate
npm run prisma:seed
```

5) شغّل:
```bash
npm run dev
```

افتح: http://localhost:3000

## Stripe Webhook (ضروري لتمييز الطلب المدفوع)
- شغّل stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
وخُذ `whsec_...` وحطّه في `STRIPE_WEBHOOK_SECRET`.

## لوحة الإدارة
- افتح /admin
- ادخل الـ ADMIN_TOKEN الموجود في .env


## Frontend (Deutsch + Tailwind)
- UI wurde auf Deutsch umgestellt.
- Tailwind CSS wurde hinzugefügt (nach `npm install` direkt nutzbar).


## Speisekarte mit Kategorien
Kategorien: Vorspeisen, Pizza, Burger, Salate, Getränke, Desserts.
Migration: `npx prisma migrate dev --name add_categories`
Seed: `npm run prisma:seed`


## Admin Panel (ohne Prisma Studio)
- /admin → Tabs: Bestellungen, Kategorien, Produkte
- CRUD für Kategorien & Produkte (mit ADMIN_TOKEN)


## Bild-Upload (Admin)
- POST /api/admin/upload (multipart/form-data, field `file`)
- Speichert lokal unter public/uploads und gibt URL zurück.
- Max 5MB, nur JPG/PNG/WEBP.


## Restaurant Einstellungen
- Admin → Tab **Einstellungen**
- Öffnungszeiten (Europe/Berlin), Mindestbestellwert, Liefergebühr, Abholung/Lieferung

## Benachrichtigungen bei neuer Bestellung (optional)
### Email (SMTP)
Setze in `.env`:
- SMTP_HOST, SMTP_PORT, SMTP_SECURE (true/false)
- SMTP_USER, SMTP_PASS
- NOTIFY_EMAIL_TO
- NOTIFY_EMAIL_FROM (optional)

### WhatsApp (Twilio, optional)
Setze in `.env`:
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_WHATSAPP_FROM (z.B. whatsapp:+14155238886)
- TWILIO_WHATSAPP_TO (z.B. whatsapp:+49...)

> Wenn diese Variablen fehlen, läuft die Bestellung trotzdem — es wird nur nichts gesendet.


## Produkt-Details (Extras)
- /product/[id] zeigt Extras & Optionen auf einer eigenen Seite.

## Notifications
- Bestellungen senden Email/WhatsApp nur wenn .env konfiguriert ist.
