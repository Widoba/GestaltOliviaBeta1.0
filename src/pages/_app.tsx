import React from 'react';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import '../styles/globals.css';

// Dynamic import for ErrorBoundary to avoid SSR issues
const ErrorBoundary = dynamic(() => import('../components/ErrorBoundary'), {
  ssr: false,
  loading: () => <div>Loading error handler...</div>
});

// Global error handler for uncaught exceptions
const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
  // Log to console for development
  console.error('Global error caught by ErrorBoundary:', error, errorInfo);

  // In production, you would send this to a monitoring service
  // Example: sendToErrorMonitoring(error, errorInfo);
};

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary onError={handleGlobalError}>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}

export default MyApp;