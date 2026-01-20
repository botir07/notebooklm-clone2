// frontend/components/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, User, UserUpdatePayload } from '../services/authService';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    updateProfile: (data: UserUpdatePayload) => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');

        if (token) {
            try {
                const response = await authAPI.getProfile();
                setUser(response.user);
            } catch (error) {
                console.error('Auth profile error:', error);
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    };

    const register = async (username: string, email: string, password: string) => {
        setLoading(true);
        try {
            const response = await authAPI.register(username, email, password);

            localStorage.setItem('token', response.token);
            setUser(response.user);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const login = async (username: string, password: string) => {
        setLoading(true);
        try {
            const response = await authAPI.login(username, password);

            localStorage.setItem('token', response.token);
            setUser(response.user);
        } catch {
            throw new Error('Login yoki parol xato');
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (data: UserUpdatePayload) => {
        try {
            const response = await authAPI.updateProfile(data);
            setUser(response.user);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Update failed');
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        updateProfile,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
