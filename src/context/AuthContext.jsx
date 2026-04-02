import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [role, setRole] = useState(localStorage.getItem('role') || null);
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    const login = (userData, userToken, userRole) => {
        setToken(userToken);
        setUser(userData);
        setRole(userRole);
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('role', userRole);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setRole(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
    };

    return (
        <AuthContext.Provider value={{ token, user, role, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
