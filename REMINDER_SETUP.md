# ⏰ Napi Reflexió Emlékeztető Rendszer

## 📋 Áttekintés

Automatikus email emlékeztetők küldése azoknak a felhasználóknak, akik még nem írtak reflexiót aznap.

## ⚙️ Működés

### Ütemezés
- **Időpont:** Minden nap **21:00** órakor (Budapest időzóna szerint)
- **Ellenőrzés:** A rendszer végignézi az összes felhasználót
- **Email küldés:** Csak azoknak küldi el, akik NEM írtak reflexiót aznap

### Folyamat
1. ⏰ 21:00-kor elindul a scheduled job
2. 🔍 Lekérdezi az összes felhasználót (akiknek van email címe)
3. 📊 Minden felhasználónál ellenőrzi, volt-e ma reflexió
4. 📧 Ha nem volt, küld egy szép emlékeztető emailt
5. ✅ Logol a konzolra az eredményt

## 🚀 Beállítás

### 1. Email konfiguráció

Először állítsd be az email rendszert a `backend/.env` fájlban:

```env
# Email konfiguráció
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
APP_NAME=Evangéliumi Keresztény Egyház
APP_URL=http://localhost:3000
```

**Fontos:** Gmail esetén **App Password** kell! (Lásd: EMAIL_SETUP.md)

### 2. Automatikus indítás

A scheduler automatikusan elindul, amikor a szervert indítod:

```bash
cd backend
npm start
```

Látni fogod a konzolban:
```
⏰ Scheduler indítása...
✅ Napi reflexió emlékeztető beállítva: Minden nap 21:00-kor
```

### 3. Időpont módosítása

Ha más időpontban szeretnéd futtatni, szerkeszd a `backend/services/scheduler.js` fájlt:

```javascript
// Cron formátum: perc óra nap hónap hét napja
const dailyReflectionReminder = cron.schedule('0 21 * * *', async () => {
  // ...
});
```

**Példák:**
- `'0 21 * * *'` - Minden nap 21:00
- `'0 20 * * *'` - Minden nap 20:00
- `'30 19 * * *'` - Minden nap 19:30
- `'0 9 * * 1-5'` - Hétköznap reggel 9:00

## 🧪 Tesztelés

### Teszt email küldése (Admin funkció)

Ha azonnal ki akarod próbálni (nem kell várni 21:00-ig):

**API endpoint:**
```
POST /api/admin/send-test-reminder/:userId
```

**Példa (curl):**
```bash
curl -X POST http://localhost:3001/api/admin/send-test-reminder/USER_ID_HERE \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Válasz:**
```json
{
  "success": true,
  "message": "Teszt emlékeztető sikeresen elküldve",
  "messageId": "<message-id@gmail.com>"
}
```

### Manuális futtatás (fejlesztés közben)

Ha le akarod tesztelni a scheduler logikát más időpontban:

1. Módosítsd átmenetileg a cron időt:
```javascript
// Például: futtatás minden percben teszteléshez
const dailyReflectionReminder = cron.schedule('* * * * *', async () => {
```

2. Indítsd újra a szervert
3. Figyeld a konzol logokat
4. Ne felejtsd visszaállítani az eredeti időre!

## 📧 Email Tartalom

Az email tartalma (lásd: `backend/config/email.js`):

- **Tárgy:** "✍️ Emlékeztető: Még nem írtál reflexiót ma"
- **Tartalom:**
  - Üdvözlés név szerint
  - Motiváló bibliai idézet
  - Link az alkalmazáshoz
  - Mai dátum
  - Leiratkozási info

## 📊 Naplózás

A scheduler minden futáskor konzolra logol:

```
🕘 Napi reflexió emlékeztető futtatása... 2025. 11. 03. 21:00:00
📧 15 felhasználó ellenőrzése...
✅ Email elküldve: Kiss János (janos@example.com)
⏭️ Nagy Anna már írt ma reflexiót
✅ Email elküldve: Kovács Péter (peter@example.com)
...

📊 Összesítés:
  - Elküldött emailek: 8
  - Kihagyott (már írt): 7
  - Összes felhasználó: 15
```

## 🛠️ Hibaelhárítás

### Nem fut a scheduler

**Ellenőrzés:**
1. Látod-e a konzolban: "⏰ Scheduler indítása..."?
2. Van-e node-cron telepítve? (`npm list node-cron`)
3. Jó időzónát állítottál be? (Europe/Budapest)

### Nem érkeznek emailek

**Ellenőrzés:**
1. Email konfiguráció rendben van? (EMAIL_USER, EMAIL_PASSWORD)
2. Van-e email cím beállítva a felhasználóknál?
3. Spam mappában van?
4. Nézd a konzol hibákat: "❌ Email hiba: ..."

### Rossz időpontban fut

- Ellenőrizd a szervert időzónát
- Windows-on lehet hogy más a rendszer időzóna
- Használd az `Europe/Budapest` timezone opciót

## 🔧 Tovább fejlesztési ötletek

- [ ] **Email preferenciák**: Felhasználók ki/be kapcsolhatják
- [ ] **Több emlékeztető időpont**: Reggel + Este
- [ ] **Heti összefoglaló**: Vasárnap este statisztika
- [ ] **Streak tracking**: Egymás utáni napok száma
- [ ] **Különböző template-ek**: Változatos idézetek
- [ ] **Admin dashboard**: Statisztikák az emailekről

## 💡 Tippek

1. **Fejlesztés közben** érdemes kikapcsolni vagy ritkábban futtatni
2. **Production-ben** ellenőrizd a Gmail küldési limiteket
3. **Felhasználók** később kaphatnak opciót a kikapcsolásra
4. **Motivációs idézetek** cserélgethetők az email template-ben

## 📝 Kapcsolódó fájlok

- `backend/services/scheduler.js` - Fő scheduler logika
- `backend/config/email.js` - Email templates
- `backend/routes/admin.js` - Teszt endpoint
- `backend/server.js` - Scheduler indítása
