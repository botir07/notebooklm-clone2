// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const pdfParse = require('pdf-parse');

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// JWT секрет
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

// Инициализация SQLite базы данных с промисами
class Database {
  constructor() {
    this.dbPath = path.join(__dirname, 'database.sqlite');
    this.db = null;
    this.initialized = false;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Ошибка подключения к SQLite:', err);
          reject(err);
          return;
        }
        console.log('✅ Подключено к SQLite базе данных');
        this.initializeTables().then(resolve).catch(reject);
      });
    });
  }

  async initializeTables() {
    return new Promise((resolve, reject) => {
      // Включаем поддержку внешних ключей
      this.db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Создаем таблицы последовательно
        const tables = [
          // Таблица пользователей
          `
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            avatar TEXT DEFAULT '',
            settings TEXT DEFAULT '{"theme":"dark","language":"uz","notifications":true}',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            is_active BOOLEAN DEFAULT 1
          )
          `,

          // Таблица источников
          `
          CREATE TABLE IF NOT EXISTS sources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            content TEXT NOT NULL,
            type TEXT DEFAULT 'file',
            file_type TEXT DEFAULT 'unknown',
            size INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            metadata TEXT DEFAULT '{}',
            tags TEXT DEFAULT '[]',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          )
          `,

          // Таблица заметок
          `
          CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            type TEXT DEFAULT 'reminders',
            source_count INTEGER DEFAULT 0,
            sources TEXT DEFAULT '[]',
            quiz_data TEXT DEFAULT '{}',
            flashcard_data TEXT DEFAULT '{}',
            mind_map_data TEXT DEFAULT '{}',
            presentation_data TEXT DEFAULT '{}',
            infographic_image_url TEXT,
            tags TEXT DEFAULT '[]',
            is_pinned BOOLEAN DEFAULT 0,
            is_archived BOOLEAN DEFAULT 0,
            color TEXT DEFAULT '#3B82F6',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          )
          `,

          // Таблица истории чатов
          `
          CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            session_id TEXT NOT NULL,
            title TEXT DEFAULT 'New Chat',
            messages TEXT DEFAULT '[]',
            sources TEXT DEFAULT '[]',
            settings TEXT DEFAULT '{"model":"google/gemini-2.0-flash-001","temperature":0.4,"maxTokens":1000}',
            is_active BOOLEAN DEFAULT 1,
            last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          )
          `
        ];

        // Создаем таблицы последовательно
        const createTable = (index) => {
          if (index >= tables.length) {
            // Создаем индексы
            const indexes = [
              'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
              'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
              'CREATE INDEX IF NOT EXISTS idx_sources_user_id ON sources(user_id)',
              'CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)',
              'CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id)',
              'CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id)'
            ];

            const createIndex = (idxIndex) => {
              if (idxIndex >= indexes.length) {
                console.log('✅ Таблицы и индексы инициализированы');
                this.initialized = true;
                resolve();
                return;
              }

              this.db.run(indexes[idxIndex], (err) => {
                if (err) {
                  console.error(`❌ Ошибка создания индекса ${idxIndex + 1}:`, err);
                  reject(err);
                  return;
                }
                createIndex(idxIndex + 1);
              });
            };

            createIndex(0);
            return;
          }

          this.db.run(tables[index], (err) => {
            if (err) {
              console.error(`❌ Ошибка создания таблицы ${index + 1}:`, err);
              reject(err);
              return;
            }
            createTable(index + 1);
          });
        };

        createTable(0);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

// Создаем экземпляр базы данных
const db = new Database();

// Мидлвар для проверки инициализации базы данных
const dbMiddleware = async (req, res, next) => {
  if (!db.initialized) {
    return res.status(503).json({
      success: false,
      message: 'База данных не инициализирована'
    });
  }
  next();
};

// Мидлвар для проверки токена
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Токен не предоставлен'
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await db.get(
        'SELECT * FROM users WHERE id = ? AND is_active = 1',
        [decoded.userId]
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Пользователь не найден'
        });
      }

      // Удаляем пароль из объекта пользователя
      delete user.password;
      req.user = user;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Неверный токен'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка аутентификации'
    });
  }
};

// Генерация JWT токена
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: '7d'
  });
};

const ensureAdminUser = async () => {
  const existing = await db.get('SELECT id FROM users WHERE username = ?', ['admin']);
  if (existing) return;

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const settings = JSON.stringify({
    theme: 'dark',
    language: 'uz',
    notifications: true
  });

  await db.run(
    `INSERT INTO users (username, email, password, settings, last_login, is_active)
     VALUES (?, ?, ?, ?, datetime('now'), 1)`,
    ['admin', 'admin@example.com', hashedPassword, settings]
  );
};

// Инициализируем базу данных перед запуском сервера
async function startServer() {
  try {
    await db.init();
    await ensureAdminUser();

    // Health check (публичный)
    app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'SQLite',
        initialized: db.initialized
      });
    });

    // Применяем middleware ко всем API роутам
    app.use('/api/*', dbMiddleware);

    // Public sources (read-only)
    app.get('/api/public/sources', async (req, res) => {
      try {
        const adminUser = await db.get('SELECT id FROM users WHERE username = ?', ['admin']);
        if (!adminUser) {
          return res.json({ success: true, sources: [] });
        }

        const sources = await db.all(
          `SELECT * FROM sources 
           WHERE user_id = ? 
           ORDER BY created_at DESC`,
          [adminUser.id]
        );

        const parsedSources = sources.map(source => ({
          ...source,
          metadata: JSON.parse(source.metadata || '{}'),
          tags: JSON.parse(source.tags || '[]')
        }));

        res.json({
          success: true,
          sources: parsedSources
        });
      } catch (error) {
        console.error('Get public sources error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to load sources'
        });
      }
    });

    // Аутентификация
    // Регистрация
    app.post('/api/auth/register', async (req, res) => {
      try {
        const { username, email, password } = req.body;

        // Валидация
        if (!username || !email || !password) {
          return res.status(400).json({
            success: false,
            message: 'Пожалуйста, заполните все поля'
          });
        }

        if (password.length < 6) {
          return res.status(400).json({
            success: false,
            message: 'Пароль должен быть не менее 6 символов'
          });
        }

        // Проверка существования пользователя
        const existingUser = await db.get(
          'SELECT * FROM users WHERE username = ? OR email = ?',
          [username, email]
        );

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Пользователь с таким именем или email уже существует'
          });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создание пользователя
        const settings = JSON.stringify({
          theme: 'dark',
          language: 'uz',
          notifications: true
        });

        const result = await db.run(
          `INSERT INTO users (username, email, password, settings, last_login) 
           VALUES (?, ?, ?, ?, datetime('now'))`,
          [username, email, hashedPassword, settings]
        );

        // Генерация токена
        const token = generateToken(result.id);

        // Получение созданного пользователя
        const user = await db.get(
          'SELECT id, username, email, avatar, settings, created_at, last_login FROM users WHERE id = ?',
          [result.id]
        );

        res.status(201).json({
          success: true,
          message: 'Регистрация успешна',
          token,
          user: {
            ...user,
            settings: JSON.parse(user.settings)
          }
        });
      } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
          success: false,
          message: 'Ошибка регистрации',
          error: error.message
        });
      }
    });

    // Вход
    app.post('/api/auth/login', async (req, res) => {
      try {
        const { username, password } = req.body;

        // Валидация
        if (!username || !password) {
          return res.status(400).json({
            success: false,
            message: 'Пожалуйста, введите имя пользователя и пароль'
          });
        }

        // Поиск пользователя
        const user = await db.get(
          'SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1',
          [username, username]
        );

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Неверные учетные данные'
          });
        }

        // Проверка пароля
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: 'Неверные учетные данные'
          });
        }

        // Генерация токена
        const token = generateToken(user.id);

        // Обновление времени последнего входа
        await db.run(
          "UPDATE users SET last_login = datetime('now') WHERE id = ?",
          [user.id]
        );

        // Удаляем пароль из ответа
        delete user.password;
        user.settings = JSON.parse(user.settings);

        res.json({
          success: true,
          message: 'Вход выполнен успешно',
          token,
          user
        });
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
          success: false,
          message: 'Ошибка входа',
          error: error.message
        });
      }
    });

    // Получение профиля
    app.get('/api/auth/profile', authMiddleware, async (req, res) => {
      try {
        const user = await db.get(
          'SELECT id, username, email, avatar, settings, created_at, last_login FROM users WHERE id = ?',
          [req.user.id]
        );

        user.settings = JSON.parse(user.settings);

        res.json({
          success: true,
          user
        });
      } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
          success: false,
          message: 'Ошибка получения профиля'
        });
      }
    });

    // Обновление профиля
    app.put('/api/auth/profile', authMiddleware, async (req, res) => {
      try {
        const { username, email, avatar, settings, password } = req.body;
        const userId = req.user.id;

        // Проверка уникальности
        if (username || email) {
          let query = 'SELECT * FROM users WHERE id != ? AND (';
          const params = [userId];
          const conditions = [];

          if (username) {
            conditions.push('username = ?');
            params.push(username);
          }
          if (email) {
            conditions.push('email = ?');
            params.push(email);
          }

          query += conditions.join(' OR ') + ')';
          const existingUser = await db.get(query, params);

          if (existingUser) {
            return res.status(400).json({
              success: false,
              message: 'Имя пользователя или email уже заняты'
            });
          }
        }

        // Подготовка данных для обновления
        const updates = [];
        const params = [];

        if (username) {
          updates.push('username = ?');
          params.push(username);
        }
        if (email) {
          updates.push('email = ?');
          params.push(email);
        }
        if (avatar !== undefined) {
          updates.push('avatar = ?');
          params.push(avatar);
        }
        if (password) {
          if (password.length < 6) {
            return res.status(400).json({
              success: false,
              message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'
            });
          }
          const hashedPassword = await bcrypt.hash(password, 10);
          updates.push('password = ?');
          params.push(hashedPassword);
        }
        if (settings) {
          const currentSettings = JSON.parse(req.user.settings || '{}');
          const newSettings = JSON.stringify({ ...currentSettings, ...settings });
          updates.push('settings = ?');
          params.push(newSettings);
        }

        if (updates.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Нет данных для обновления'
          });
        }

        params.push(userId);

        await db.run(
          `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
          params
        );

        // Получение обновленного пользователя
        const user = await db.get(
          'SELECT id, username, email, avatar, settings, created_at, last_login FROM users WHERE id = ?',
          [userId]
        );

        user.settings = JSON.parse(user.settings);

        res.json({
          success: true,
          message: 'Профиль обновлен',
          user
        });
      } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
          success: false,
          message: 'Ошибка обновления профиля',
          error: error.message
        });
      }
    });

    // Выход
    app.post('/api/auth/logout', authMiddleware, (req, res) => {
      res.json({
        success: true,
        message: 'Выход выполнен успешно'
      });
    });

    // Источники
    // Получение всех источников
    app.get('/api/sources', authMiddleware, async (req, res) => {
      try {
        const sources = await db.all(
          `SELECT * FROM sources 
           WHERE user_id = ? 
           ORDER BY created_at DESC`,
          [req.user.id]
        );

        // Парсинг JSON полей
        const parsedSources = sources.map(source => ({
          ...source,
          metadata: JSON.parse(source.metadata || '{}'),
          tags: JSON.parse(source.tags || '[]')
        }));

        res.json({
          success: true,
          sources: parsedSources
        });
      } catch (error) {
        console.error('Get sources error:', error);
        res.status(500).json({
          success: false,
          message: 'Ошибка получения источников'
        });
      }
    });

    // Создание источника
    app.post('/api/sources', authMiddleware, async (req, res) => {
      try {
        const { name, content, type, fileType, metadata, tags, isActive } = req.body;
        const isPdf = (fileType || '').toLowerCase() === 'pdf' || (name || '').toLowerCase().endsWith('.pdf');
        let sourceContent = content || '';
        let metadataPayload = metadata || {};

        if (isPdf && sourceContent) {
          try {
            const rawBase64 = sourceContent.startsWith('data:application/pdf')
              ? sourceContent.split(',')[1] || ''
              : sourceContent;
            const buffer = Buffer.from(rawBase64, 'base64');
            const parsed = await pdfParse(buffer);
            metadataPayload = {
              ...metadataPayload,
              text: parsed.text || ''
            };
          } catch (parseError) {
            console.error('PDF parse error:', parseError);
          }
        }

        const result = await db.run(
          `INSERT INTO sources 
           (user_id, name, content, type, file_type, size, metadata, tags, is_active) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.user.id,
            name,
            sourceContent,
            type || 'file',
            fileType || 'unknown',
            sourceContent.length,
            JSON.stringify(metadataPayload || {}),
            JSON.stringify(tags || []),
            isActive !== undefined ? isActive : 1
          ]
        );

        const source = await db.get('SELECT * FROM sources WHERE id = ?', [result.id]);

        res.json({
          success: true,
          message: 'Источник создан успешно',
          source: {
            ...source,
            metadata: JSON.parse(source.metadata),
            tags: JSON.parse(source.tags)
          }
        });
      } catch (error) {
        console.error('Create source error:', error);
        res.status(500).json({
          success: false,
          message: 'Ошибка создания источника',
          error: error.message
        });
      }
    });

    // Обновление источника
    app.put('/api/sources/:id', authMiddleware, async (req, res) => {
      try {
        const { id } = req.params;
        const { name, content, isActive, tags, metadata } = req.body;

        // Проверка принадлежности источника пользователю
        const source = await db.get(
          'SELECT * FROM sources WHERE id = ? AND user_id = ?',
          [id, req.user.id]
        );

        if (!source) {
          return res.status(404).json({
            success: false,
            message: 'Источник не найден'
          });
        }

        const updates = [];
        const params = [];

        if (name) {
          updates.push('name = ?');
          params.push(name);
        }
        if (content) {
          updates.push('content = ?');
          updates.push('size = ?');
          params.push(content, content.length);
        }
        if (isActive !== undefined) {
          updates.push('is_active = ?');
          params.push(isActive ? 1 : 0);
        }
        if (tags) {
          updates.push('tags = ?');
          params.push(JSON.stringify(tags));
        }
        if (metadata) {
          const currentMetadata = JSON.parse(source.metadata || '{}');
          updates.push('metadata = ?');
          params.push(JSON.stringify({ ...currentMetadata, ...metadata }));
        }

        updates.push("updated_at = datetime('now')");

        params.push(id, req.user.id);

        await db.run(
          `UPDATE sources SET ${updates.join(', ')} 
           WHERE id = ? AND user_id = ?`,
          params
        );

        const updatedSource = await db.get(
          'SELECT * FROM sources WHERE id = ? AND user_id = ?',
          [id, req.user.id]
        );

        res.json({
          success: true,
          message: 'Источник обновлен успешно',
          source: {
            ...updatedSource,
            metadata: JSON.parse(updatedSource.metadata),
            tags: JSON.parse(updatedSource.tags)
          }
        });
      } catch (error) {
        console.error('Update source error:', error);
        res.status(500).json({
          success: false,
          message: 'Ошибка обновления источника'
        });
      }
    });

    // Удаление источника
    app.delete('/api/sources/:id', authMiddleware, async (req, res) => {
      try {
        const { id } = req.params;

        const result = await db.run(
          'DELETE FROM sources WHERE id = ? AND user_id = ?',
          [id, req.user.id]
        );

        if (result.changes === 0) {
          return res.status(404).json({
            success: false,
            message: 'Источник не найден'
          });
        }

        res.json({
          success: true,
          message: 'Источник удален успешно'
        });
      } catch (error) {
        console.error('Delete source error:', error);
        res.status(500).json({
          success: false,
          message: 'Ошибка удаления источника'
        });
      }
    });

    // Массовое обновление активности источников
    app.put('/api/sources/bulk/active', authMiddleware, async (req, res) => {
      try {
        const { sourceIds, isActive } = req.body;

        if (!sourceIds || !Array.isArray(sourceIds)) {
          return res.status(400).json({
            success: false,
            message: 'Некорректные данные'
          });
        }

        const placeholders = sourceIds.map(() => '?').join(',');
        const params = [isActive ? 1 : 0, req.user.id, ...sourceIds];

        await db.run(
          `UPDATE sources SET is_active = ?, updated_at = datetime('now') 
           WHERE user_id = ? AND id IN (${placeholders})`,
          params
        );

        res.json({
          success: true,
          message: `Источники ${isActive ? 'активированы' : 'деактивированы'} успешно`
        });
      } catch (error) {
        console.error('Bulk update error:', error);
        res.status(500).json({
          success: false,
          message: 'Ошибка массового обновления'
        });
      }
    });

    // Заметки
    // Получение всех заметок
    app.get('/api/notes', authMiddleware, async (req, res) => {
      try {
        const notes = await db.all(
          `SELECT * FROM notes 
           WHERE user_id = ? AND is_archived = 0
           ORDER BY is_pinned DESC, created_at DESC`,
          [req.user.id]
        );

        // Парсинг JSON полей
        const parsedNotes = notes.map(note => ({
          ...note,
          sources: JSON.parse(note.sources || '[]'),
          tags: JSON.parse(note.tags || '[]'),
          quiz_data: JSON.parse(note.quiz_data || '{}'),
          flashcard_data: JSON.parse(note.flashcard_data || '{}'),
          mind_map_data: JSON.parse(note.mind_map_data || '{}'),
          presentation_data: JSON.parse(note.presentation_data || '{}')
        }));

        res.json({
          success: true,
          notes: parsedNotes
        });
      } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({
          success: false,
          message: 'Ошибка получения заметок'
        });
      }
    });

    // Создание заметки
    app.post('/api/notes', authMiddleware, async (req, res) => {
      try {
        const {
          title,
          content,
          type,
          sourceIds,
          quizData,
          flashcardData,
          mindMapData,
          presentationData,
          infographicImageUrl,
          tags,
          color,
          isPinned
        } = req.body;

        const result = await db.run(
          `INSERT INTO notes 
           (user_id, title, content, type, source_count, sources, 
            quiz_data, flashcard_data, mind_map_data, presentation_data, 
            infographic_image_url, tags, color, is_pinned) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.user.id,
            title,
            content,
            type || 'reminders',
            sourceIds ? sourceIds.length : 0,
            JSON.stringify(sourceIds || []),
            JSON.stringify(quizData || {}),
            JSON.stringify(flashcardData || {}),
            JSON.stringify(mindMapData || {}),
            JSON.stringify(presentationData || {}),
            infographicImageUrl || null,
            JSON.stringify(tags || []),
            color || '#3B82F6',
            isPinned ? 1 : 0
          ]
        );

        const note = await db.get('SELECT * FROM notes WHERE id = ?', [result.id]);

        res.json({
          success: true,
          message: 'Заметка создана успешно',
          note: {
            ...note,
            sources: JSON.parse(note.sources),
            tags: JSON.parse(note.tags),
            quiz_data: JSON.parse(note.quiz_data),
            flashcard_data: JSON.parse(note.flashcard_data),
            mind_map_data: JSON.parse(note.mind_map_data),
            presentation_data: JSON.parse(note.presentation_data)
          }
        });
      } catch (error) {
        console.error('Create note error:', error);
        res.status(500).json({
          success: false,
          message: 'Ошибка создания заметки',
          error: error.message
        });
      }
    });

    // Удаление заметки
    app.delete('/api/notes/:id', authMiddleware, async (req, res) => {
      try {
        const { id } = req.params;

        const result = await db.run(
          'DELETE FROM notes WHERE id = ? AND user_id = ?',
          [id, req.user.id]
        );

        if (result.changes === 0) {
          return res.status(404).json({
            success: false,
            message: 'Заметка не найдена'
          });
        }

        res.json({
          success: true,
          message: 'Заметка удалена успешно'
        });
      } catch (error) {
        console.error('Delete note error:', error);
        res.status(500).json({
          success: false,
          message: 'Ошибка удаления заметки'
        });
      }
    });

    // Простые тестовые эндпоинты без авторизации (для демо)
    // Chat history
    app.get('/api/chat/history', authMiddleware, async (req, res) => {
      try {
        const chats = await db.all(
          `SELECT * FROM chat_history
           WHERE user_id = ?
           ORDER BY last_message_at DESC, created_at DESC`,
          [req.user.id]
        );

        const parsedChats = chats.map((chat) => ({
          ...chat,
          messages: JSON.parse(chat.messages || '[]'),
          sources: JSON.parse(chat.sources || '[]'),
          settings: JSON.parse(chat.settings || '{}')
        }));

        res.json({
          success: true,
          chats: parsedChats
        });
      } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({
          success: false,
          message: 'Server error loading chat history'
        });
      }
    });

    app.post('/api/chat/history', authMiddleware, async (req, res) => {
      try {
        const { sessionId, messages, sources, settings, title } = req.body;

        if (!sessionId) {
          return res.status(400).json({
            success: false,
            message: 'sessionId is required'
          });
        }

        const existing = await db.get(
          'SELECT id FROM chat_history WHERE user_id = ? AND session_id = ?',
          [req.user.id, sessionId]
        );

        if (existing) {
          await db.run(
            `UPDATE chat_history
             SET title = ?,
                 messages = ?,
                 sources = ?,
                 settings = ?,
                 last_message_at = datetime('now'),
                 updated_at = datetime('now')
             WHERE user_id = ? AND session_id = ?`,
            [
              title || 'New Chat',
              JSON.stringify(messages || []),
              JSON.stringify(sources || []),
              JSON.stringify(settings || {}),
              req.user.id,
              sessionId
            ]
          );
        } else {
          await db.run(
            `INSERT INTO chat_history
             (user_id, session_id, title, messages, sources, settings, is_active, last_message_at)
             VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
            [
              req.user.id,
              sessionId,
              title || 'New Chat',
              JSON.stringify(messages || []),
              JSON.stringify(sources || []),
              JSON.stringify(settings || {})
            ]
          );
        }

        const chat = await db.get(
          'SELECT * FROM chat_history WHERE user_id = ? AND session_id = ?',
          [req.user.id, sessionId]
        );

        res.json({
          success: true,
          chat: {
            ...chat,
            messages: JSON.parse(chat.messages || '[]'),
            sources: JSON.parse(chat.sources || '[]'),
            settings: JSON.parse(chat.settings || '{}')
          }
        });
      } catch (error) {
        console.error('Save chat history error:', error);
        res.status(500).json({
          success: false,
          message: 'Server error saving chat history'
        });
      }
    });

    app.delete('/api/chat/history/:sessionId', authMiddleware, async (req, res) => {
      try {
        const { sessionId } = req.params;
        const result = await db.run(
          'DELETE FROM chat_history WHERE user_id = ? AND session_id = ?',
          [req.user.id, sessionId]
        );

        if (result.changes === 0) {
          return res.status(404).json({
            success: false,
            message: 'Chat history not found'
          });
        }

        res.json({
          success: true,
          message: 'Chat history deleted'
        });
      } catch (error) {
        console.error('Delete chat history error:', error);
        res.status(500).json({
          success: false,
          message: 'Server error deleting chat history'
        });
      }
    });

    app.post('/api/test/register', async (req, res) => {
      try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
          return res.status(400).json({
            success: false,
            message: 'Заполните все поля'
          });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        const settings = JSON.stringify({
          theme: 'dark',
          language: 'uz',
          notifications: true
        });

        const result = await db.run(
          `INSERT INTO users (username, email, password, settings, last_login) 
           VALUES (?, ?, ?, ?, datetime('now'))`,
          [username, email, hashedPassword, settings]
        );

        const token = generateToken(result.id);

        res.status(201).json({
          success: true,
          message: 'Тестовая регистрация успешна',
          token,
          userId: result.id
        });
      } catch (error) {
        console.error('Test registration error:', error);
        res.status(500).json({
          success: false,
          message: 'Ошибка тестовой регистрации',
          error: error.message
        });
      }
    });

    // Запускаем сервер
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📁 База данных: ${db.dbPath}`);
      console.log(`🌐 API доступен по: http://localhost:${PORT}/api`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });

  } catch (error) {
    console.error('❌ Ошибка инициализации сервера:', error);
    process.exit(1);
  }
}

// Запускаем сервер
startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Останавливаем сервер...');
  try {
    await db.close();
    console.log('✅ Соединение с SQLite закрыто');
  } catch (err) {
    console.error('❌ Ошибка при закрытии БД:', err);
  }
  process.exit(0);
});
