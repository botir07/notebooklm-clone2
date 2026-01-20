// frontend/services/authService.ts
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Интерсептор для добавления токена
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Типы
export interface User {
    id: number;
    username: string;
    email: string;
    avatar: string;
    settings: {
        theme: 'light' | 'dark';
        language: string;
        notifications: boolean;
    };
    created_at: string;
    last_login?: string;
}

export interface UserUpdatePayload extends Partial<User> {
    password?: string;
}

export interface Source {
    id: number;
    user_id: number;
    name: string;
    content: string;
    type: string;
    file_type: string;
    size: number;
    is_active: boolean;
    metadata: Record<string, any>;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export interface Note {
    id: number;
    user_id: number;
    title: string;
    content: string;
    type: string;
    source_count: number;
    sources: number[];
    quiz_data: Record<string, any>;
    flashcard_data: Record<string, any>;
    mind_map_data: Record<string, any>;
    presentation_data: Record<string, any>;
    infographic_image_url?: string;
    tags: string[];
    is_pinned: boolean;
    is_archived: boolean;
    color: string;
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface ChatHistory {
    id: number;
    user_id: number;
    session_id: string;
    title: string;
    messages: ChatMessage[];
    sources: number[];
    settings: {
        model: string;
        temperature: number;
        maxTokens: number;
    };
    is_active: boolean;
    last_message_at: string;
    created_at: string;
    updated_at: string;
}

// API функции
export const authAPI = {
    // Регистрация
    register: async (username: string, email: string, password: string) => {
        const response = await api.post('/auth/register', { username, email, password });
        return response.data;
    },

    // Вход
    login: async (username: string, password: string) => {
        const response = await api.post('/auth/login', { username, password });
        return response.data;
    },

    // Получение профиля
    getProfile: async () => {
        const response = await api.get('/auth/profile');
        return response.data;
    },

    // Обновление профиля
    updateProfile: async (data: UserUpdatePayload) => {
        const response = await api.put('/auth/profile', data);
        return response.data;
    },

    // Выход
    logout: async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
        }
    }
};

export const sourceAPI = {
    // Получение всех источников
    getSources: async () => {
        const response = await api.get('/sources');
        return response.data;
    },

    // Создание источника
    createSource: async (data: Omit<Source, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
        const response = await api.post('/sources', data);
        return response.data;
    },

    // Обновление источника
    updateSource: async (id: number, data: Partial<Source>) => {
        const response = await api.put(`/sources/${id}`, data);
        return response.data;
    },

    // Удаление источника
    deleteSource: async (id: number) => {
        const response = await api.delete(`/sources/${id}`);
        return response.data;
    },

    // Массовое обновление активности
    bulkUpdateActive: async (sourceIds: number[], isActive: boolean) => {
        const response = await api.put('/sources/bulk/active', { sourceIds, isActive });
        return response.data;
    }
};

export const noteAPI = {
    // Получение всех заметок
    getNotes: async () => {
        const response = await api.get('/notes');
        return response.data;
    },

    // Создание заметки
    createNote: async (data: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
        const response = await api.post('/notes', data);
        return response.data;
    },

    // Обновление заметки
    updateNote: async (id: number, data: Partial<Note>) => {
        const response = await api.put(`/notes/${id}`, data);
        return response.data;
    },

    // Удаление заметки
    deleteNote: async (id: number) => {
        const response = await api.delete(`/notes/${id}`);
        return response.data;
    },

    // Закрепить/открепить заметку
    togglePin: async (id: number) => {
        const response = await api.put(`/notes/${id}/pin`);
        return response.data;
    },

    // Архивировать заметку
    archiveNote: async (id: number) => {
        const response = await api.put(`/notes/${id}/archive`);
        return response.data;
    },

    // Восстановить заметку
    restoreNote: async (id: number) => {
        const response = await api.put(`/notes/${id}/restore`);
        return response.data;
    },

    // Получение статистики
    getStats: async () => {
        const response = await api.get('/notes/stats');
        return response.data;
    }
};

export const chatAPI = {
    // Получение истории чатов
    getHistory: async () => {
        const response = await api.get('/chat/history');
        return response.data;
    },

    // Сохранение истории чата
    saveHistory: async (data: {
        sessionId: string;
        messages: ChatMessage[];
        sources: number[];
        settings?: Record<string, any>;
        title?: string;
    }) => {
        const response = await api.post('/chat/history', data);
        return response.data;
    },

    // Удаление истории чата
    deleteHistory: async (sessionId: string) => {
        const response = await api.delete(`/chat/history/${sessionId}`);
        return response.data;
    }
};

// Health check
export const checkHealth = async () => {
    const response = await api.get('/health');
    return response.data;
};

export default api;
