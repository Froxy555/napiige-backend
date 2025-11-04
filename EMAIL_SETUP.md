# Email Értesítő Rendszer Beállítása

## 📧 Áttekintés

Az alkalmazás automatikus email értesítéseket küld a következő eseményekkor:
- ✅ Új felvétel feltöltése
- 🙏 Új reflexió írása
- 💬 Új csoportüzenet
- 🎉 Csoportba meghívás

## 🔧 Gmail Beállítás (Ajánlott)

### 1. lépés: App Password létrehozása

Gmail-nél **nem használhatod** a normál jelszavadat! Létre kell hoznod egy **App Password**-öt:

1. Menj a Google Fiók beállításokhoz: https://myaccount.google.com/
2. Válaszd a **Security** (Biztonság) menüpontot
3. Kapcsold be a **2-Step Verification**-t (ha még nincs bekapcsolva)
4. Görgess le az **App passwords** részhez
5. Kattints a **Generate** gombra
6. Válaszd ki: **Mail** és **Other (Custom name)**
7. Add meg a nevet: "Igeszakasz App"
8. Másold ki a generált 16 karakteres jelszót

### 2. lépés: .env fájl frissítése

Nyisd meg a `backend/.env` fájlt és frissítsd:

```env
# Email konfiguráció
EMAIL_USER=te@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  # A 16 karakteres App Password
APP_NAME=Evangéliumi Keresztény Egyház
APP_URL=http://localhost:3000
```

⚠️ **Fontos:** Ne commitold a `.env` fájlt Git-be! Ez már benne van a `.gitignore`-ban.

## 🔧 Más Email Szolgáltatók

### Outlook/Hotmail

```javascript
// backend/config/email.js
service: 'outlook'
```

### Yahoo

```javascript
// backend/config/email.js
service: 'yahoo'
```

### Egyedi SMTP szerver

```javascript
// backend/config/email.js
return nodemailer.createTransporter({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

## 📝 Email Template-ek Testreszabása

Az email template-ek a `backend/config/email.js` fájlban találhatók.

### Új template hozzáadása

```javascript
emailTemplates.ujEsemeny = (param1, param2) => `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      /* CSS stílusok */
    </style>
  </head>
  <body>
    <div class="container">
      <!-- HTML tartalom -->
    </div>
  </body>
  </html>
`;
```

## 🧪 Tesztelés

### Email küldés tesztelése

```bash
# Indítsd el a szervert
cd backend
npm start
```

Tölts fel egy új felvételt az alkalmazásban, és ellenőrizd, hogy megérkezik-e az email!

### Hibakeresés

Ha nem érkezik email, nézd meg a szerver konzol logokat:

```bash
Email elküldve: <message-id>  # Sikeres
Email küldési hiba: ...        # Hiba
```

## 🎨 Email Megjelenés

Az emailek responsive designnal rendelkeznek:
- ✅ Mobil barát
- ✅ Sötét/világos mód támogatás a legtöbb email kliensnél
- ✅ Egyház színvilága (lila gradiens)

## 🚀 Produkciós Deployment

Production környezetben:

1. Frissítsd az `APP_URL`-t:
```env
APP_URL=https://igeszakasz.yourdomain.com
```

2. Használj biztonságos jelszókezelőt (pl. AWS Secrets Manager, Azure Key Vault)

3. Beállíthatod az email küldés rate limitjét nagy felhasználószám esetén

## 📊 Továbbfejlesztési Lehetőségek

- [ ] Email preferenciák (ki-be kapcsolható értesítések)
- [ ] Email template-ek szerkesztése admin felületen
- [ ] Email queue rendszer (pl. Bull, RabbitMQ)
- [ ] Email analytics (megnyitások, kattintások követése)
- [ ] Digest emailek (napi összefoglaló)

## ❓ Gyakori Kérdések

**Q: Miért nem érkezik az email?**
A: Ellenőrizd, hogy:
- Helyes App Password van beállítva
- 2FA be van kapcsolva Gmail-nél
- Spam mappában nincs-e
- A felhasználói profilban van email cím beállítva

**Q: Hogyan kapcsolom ki az emaileket fejlesztés közben?**
A: Kommenteld ki az email küldést a route-okban, vagy hagyd üresen az `EMAIL_USER`-t.

**Q: Hány emailt küldhetek naponta?**
A: Gmail: ~500 email/nap ingyenes fióknál, ~2000 email/nap G Workspace-nél.
