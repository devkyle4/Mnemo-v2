import { useState, useCallback } from 'react';

export const useAlert = () => {
  const [alerts, setAlerts] = useState([]);

  const showAlert = useCallback(({ type, title, message, autoClose = true, duration = 4000 }) => {
    const id = Date.now() + Math.random();
    
    const newAlert = {
      id,
      type,
      title,
      message,
      autoClose,
      duration
    };

    setAlerts((prev) => [...prev, newAlert]);

    // Auto-remove after duration if autoClose is true
    if (autoClose) {
      setTimeout(() => {
        removeAlert(id);
      }, duration);
    }

    return id;
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  // Convenience methods
  const success = useCallback((title, message, options = {}) => {
    return showAlert({ type: 'success', title, message, ...options });
  }, [showAlert]);

  const error = useCallback((title, message, options = {}) => {
    return showAlert({ type: 'error', title, message, ...options });
  }, [showAlert]);

  const warning = useCallback((title, message, options = {}) => {
    return showAlert({ type: 'warning', title, message, ...options });
  }, [showAlert]);

  const info = useCallback((title, message, options = {}) => {
    return showAlert({ type: 'info', title, message, ...options });
  }, [showAlert]);

  return {
    alerts,
    showAlert,
    removeAlert,
    success,
    error,
    warning,
    info
  };
};