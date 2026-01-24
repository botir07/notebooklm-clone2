# NotebookLM Clone (Uz)

Zamonaviy o'quv va tadqiqot interfeysi: manbalar bilan chat, AI xulosa, test, kartochka, taqdimot, infografika va aqliy xarita yaratish. Loyihada frontend (Vite + React) va backend (Express + SQLite) alohida ishlaydi.

## Asosiy imkoniyatlar
- Manbalar bilan chat va AI xulosa
- Test, kartochka, taqdimot, infografika, aqliy xarita
- Mavzu tugatildi va qiyin test generatsiyasi
- PDF fayllarini ko'rish (mobil fallback bilan)
- Profil statistikasi va materiallar hisoboti

## Texnologiyalar
- Frontend: React, Vite, TypeScript
- Backend: Express, SQLite, JWT, pdf-parse
- AI: OpenRouter (Gemini/Llama)

## Papkalar
- `frontend/` - UI va AI chaqiruvlari
- `backend/` - API va SQLite

## Ishga tushirish
Quyidagi buyruqlarni 2 ta terminalda ishlating.

### 1) Backend
```bash
cd backend
npm install
```

Muqobil sozlamalar (ixtiyoriy):
- `OPENROUTER_API_KEY` (AI chaqiruvlari uchun)
- `JWT_SECRET` (tokenlar uchun)
- `PORT` (default: 5001)

Ishga tushirish:
```bash
npm run dev
```

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```

Brauzerda ochish:
- `http://localhost:5173`

## Admin manbalar
Backend avtomatik admin yaratadi:
- username: `admin`
- password: `admin123`

Admin sahifa:
- `http://localhost:5173/admin`

## AI kalitini ulash
Frontend API kalitni localStorage orqali oladi:
- Sozlamalarda `OPENROUTER_API_KEY` ni kiriting
- Yoki `.env` orqali `VITE_OPENROUTER_API_KEY` ni bering (frontend papkada)

## PDF ko'rish (mobil)
Mobil qurilmalarda PDF ochish tugmasi chiqadi. U PDF ni yangi oynada ochadi.

## API qisqa yo'l
Backend endpointlar:
- `GET /api/health`
- `GET /api/public/sources`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/notes`

## Muammolar
- PDF ko'rinmasa: yangi oynada ochish tugmasini ishlating
- AI javob bermasa: `OPENROUTER_API_KEY` tekshiring
- 429 xatosi: so'rov tezligini pasaytiring (rate limit yoqilgan)

## Ishlab chiqish tavsiyalari
- Frontendni optimize qilish uchun `npm run build` bilan tekshiring
- Backend loglarni kuzating, ayniqsa PDF parse va auth xatolari
