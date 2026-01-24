# 📚 NotebookLM Clone (Uz)

> **Zamonaviy o‘quv va tadqiqot interfeysi** — manbalar bilan chat, AI xulosa, test, kartochka, taqdimot, infografika va aqliy xarita yaratish.  
> **Frontend (Vite + React)** va **Backend (Express + SQLite)** alohida ishlaydi.

---

## ✨ Asosiy imkoniyatlar

- 📌 Manbalar bilan chat va **AI xulosa**
- 🧠 **Test**, **kartochka**, **taqdimot**, **infografika**, **aqliy xarita**
- ✅ “Mavzu tugatildi” va **qiyin test generatsiyasi**
- 📄 **PDF ko‘rish** (mobil fallback bilan)
- 📊 **Profil statistikasi** va materiallar hisoboti

---

## 🧰 Texnologiyalar

| Qism | Texnologiyalar |
|-----|---------------|
| **Frontend** | React, Vite, TypeScript |
| **Backend** | Express, SQLite, JWT, pdf-parse |
| **AI** | OpenRouter (Gemini / Llama) |

---

## 🗂️ Papkalar tuzilmasi

```txt
.
├─ frontend/   # UI va AI chaqiruvlari
└─ backend/    # API va SQLite
🚀 Ishga tushirish
Quyidagi buyruqlarni 2 ta alohida terminalda ishga tushiring.

1) Backend
cd backend
npm install
Muqobil sozlamalar (ixtiyoriy):

OPENROUTER_API_KEY — AI chaqiruvlari uchun

JWT_SECRET — tokenlar uchun

PORT — default: 5001

Ishga tushirish:

npm run dev
Tekshirish:

GET http://localhost:5001/api/health
2) Frontend
cd frontend
npm install
npm run dev
Brauzerda ochish:

http://localhost:5173
👤 Admin (default)
Backend avtomatik admin yaratadi:

username: admin

password: admin123

Admin sahifa:

http://localhost:5173/admin
🔑 AI kalitini ulash
Frontend API kalitni localStorage orqali oladi:

Sozlamalarda OPENROUTER_API_KEY ni kiriting
yoki

.env fayl orqali VITE_OPENROUTER_API_KEY ni bering (frontend papkada)

📄 PDF ko‘rish (mobil)
Mobil qurilmalarda PDF uchun “Open in new tab” tugmasi chiqadi.
PDF yangi oynada ochiladi.

🔌 API qisqa yo‘l
Backend endpointlar:

GET /api/health

GET /api/public/sources

POST /api/auth/login

POST /api/auth/register

GET /api/notes

🧯 Muammolar (FAQ)
❌ PDF ko‘rinmasa → yangi oynada ochish tugmasini ishlating

🤖 AI javob bermasa → OPENROUTER_API_KEY ni tekshiring

⛔ 429 xatosi → so‘rov tezligini pasaytiring (rate limit yoqilgan)

🧪 Ishlab chiqish tavsiyalari
Frontendni optimize qilish:

npm run build
Backend loglarni kuzating
(ayniqsa PDF parse va auth xatolari)

📌 Roadmap (ixtiyoriy)
 UI/UX polish (dark mode, responsive)

 Sources indexing + vector search

 Export: PDF / DOCX / PPTX

 Admin analytics & moderation panel