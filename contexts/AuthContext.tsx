import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserData {
  cpf: string;
  nome: string;
  [key: string]: any;
}

interface UrlTracking {
  fullUrl: string;
  params: Record<string, string>;
}

interface AuthContextData {
  isAuthenticated: boolean;
  userData: UserData | null;
  urlTracking: UrlTracking | null;
  login: (data: UserData) => Promise<void>;
  logout: () => Promise<void>;
  setUrlTracking: (tracking: UrlTracking) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const UTM_STORAGE_KEY = '@app:utm_tracking';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [urlTracking, setUrlTrackingState] = useState<UrlTracking | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStoredUTMs();
  }, []);

  async function loadStoredUTMs() {
    try {
      const storedUTMs = await AsyncStorage.getItem(UTM_STORAGE_KEY);
      if (storedUTMs) {
        const tracking = JSON.parse(storedUTMs);
        setUrlTrackingState(tracking);
        console.log('UTMs carregadas do storage:', tracking);
      }
    } catch (error) {
      console.error('Erro ao carregar UTMs do storage:', error);
    }
  }

  async function login(data: UserData) {
    try {
      setUserData(data);
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      setUserData(null);
      setUrlTrackingState(null);
      await AsyncStorage.removeItem(UTM_STORAGE_KEY);
      console.log('UTMs removidas do storage');
    } catch (error) {
      console.error('Erro ao remover dados:', error);
    }
  }

  async function setUrlTracking(tracking: UrlTracking) {
    try {
      setUrlTrackingState(tracking);
      await AsyncStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(tracking));
      console.log('UTMs salvas no storage:', tracking);
    } catch (error) {
      console.error('Erro ao salvar UTMs no storage:', error);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!userData,
        userData,
        urlTracking,
        login,
        logout,
        setUrlTracking,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
