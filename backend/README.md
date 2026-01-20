# Backend API

Bu loyihaning backend qismi Node.js, Express va MongoDB yordamida yaratilgan.

## Tarkibi

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - NoSQL ma'lumotlar bazasi
- **Mongoose** - MongoDB ODM
- **JWT** - Autentifikatsiya uchun
- **bcryptjs** - Parollarni shifrlash uchun

## O'rnatish

1. Backend papkasiga o'ting:
```bash
cd backend
```

2. Kerakli paketlarni o'rnating:
```bash
npm install
```

3. `.env` faylini sozlang:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/myapp
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
```

## Ishga tushirish

Development rejimida ishga tushirish:
```bash
npm run dev
```

Production rejimida:
```bash
npm start
```

## API Endpoints

### Autentifikatsiya

- `POST /api/auth/register` - Yangi foydalanuvchi ro'yxatdan o'tkazish
- `POST /api/auth/login` - Tizimga kirish

### Foydalanuvchilar

- `GET /api/users` - Barcha foydalanuvchilarni olish
- `GET /api/users/:id` - ID bo'yicha foydalanuvchini olish
- `PUT /api/users/:id` - Foydalanuvchini yangilash
- `DELETE /api/users/:id` - Foydalanuvchini o'chirish

## Loyiha tuzilishi

```
backend/
├── controllers/      # Request handlerlar
├── models/          # MongoDB modellari
│   └── User.js      # User modeli
├── routes/          # API marshrutlari
│   ├── auth.js      # Autentifikatsiya marshrutlari
│   └── users.js     # Foydalanuvchilar marshrutlari
├── .env            # Environment o'zgaruvchilari
├── package.json    # Loyiha konfiguratsiyasi
├── server.js       # Asosiy server fayl
└── README.md       # Hujjatlar
```

## Ma'lumotlar Bazasi

MongoDB o'rnatilganligiga ishonch hosil qiling va u ishlab turganini tekshiring:
```bash
mongod
```