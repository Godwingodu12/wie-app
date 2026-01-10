'use client';
import { Provider } from 'react-redux';
import { store } from './store';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from '@/components/home/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
}
