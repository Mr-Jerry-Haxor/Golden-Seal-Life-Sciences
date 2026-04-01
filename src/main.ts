import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const CHUNK_RELOAD_GUARD_KEY = 'gsls_chunk_reload_attempted';

function isChunkLoadError(value: unknown): boolean {
  const errorMessage = (() => {
    if (value instanceof Error) {
      return value.message;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object' && value !== null && 'message' in value) {
      const message = (value as { message?: unknown }).message;
      return typeof message === 'string' ? message : '';
    }

    return '';
  })().toLowerCase();

  return (
    errorMessage.includes('loading chunk') ||
    errorMessage.includes('failed to fetch dynamically imported module') ||
    errorMessage.includes('importing a module script failed')
  );
}

function recoverFromChunkError(reason: unknown): void {
  if (typeof window === 'undefined' || !isChunkLoadError(reason)) {
    return;
  }

  const hasAlreadyRetried = window.sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY) === '1';
  if (hasAlreadyRetried) {
    return;
  }

  window.sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, '1');
  window.location.reload();
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    recoverFromChunkError(event.error ?? event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    recoverFromChunkError(event.reason);
  });
}

bootstrapApplication(App, appConfig)
  .then(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(CHUNK_RELOAD_GUARD_KEY);
    }
  })
  .catch((err) => {
    recoverFromChunkError(err);
    console.error(err);
  });
