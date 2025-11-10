import { StrictMode } from 'react';
import React, { useEffect } from "react";
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store, persistor } from './features/store';
import { PersistGate } from 'redux-persist/integration/react';
import { SocketProvider } from './context/SocketContext';
import notificationService from './context/notificationService';
import './index.css';
import App from './App.jsx';
// Wrapper component to initialize notification service
function NotificationInitializer({ children }) {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      notificationService.connect(token);
    } else {
      console.log('⚠️ No token found, skipping notification service connection');
    }
    return () => {
      notificationService.disconnect();
    };
  }, []);
  return children;
}
const rootElement = document.getElementById('root');
let root;
if (!rootElement._reactRoot) {
  root = createRoot(rootElement);
  rootElement._reactRoot = root;
} else {
  root = rootElement._reactRoot;
}
// Single render call
root.render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SocketProvider>
          <NotificationInitializer>
            <App />
          </NotificationInitializer>
        </SocketProvider>
      </PersistGate>
    </Provider>
  </StrictMode>
);
