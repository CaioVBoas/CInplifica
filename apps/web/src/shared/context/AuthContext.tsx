import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // const [user, setUser] = useState<User | null>(null);
  // const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  const [user, setUser] = useState<User | null>({
    id: '1',
    name: 'Daniel',
    email: 'daniel@cin.ufpe.br',
    role: 'STUDENT',
  });

  const [token, setToken] = useState<string | null>('fake-token');
  
  // const [loading, setLoading] = useState(true);
  const [loading, setLoading] = useState(false);


  // useEffect(() => {
  //   if (token) {
  //     // Decode JWT or fetch user profile from API
  //     // For now, let's assume we can decode or we fetch it
  //     try {
  //       const payload = JSON.parse(atob(token.split('.')[1]));
  //       setUser({
  //         id: payload.id,
  //         name: payload.name,
  //         email: payload.email,
  //         role: payload.role,
  //       });
  //     } catch (e) {
  //       console.error('Failed to decode token', e);
  //       logout();
  //     }
  //   }
  //   setLoading(false);
  // }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
