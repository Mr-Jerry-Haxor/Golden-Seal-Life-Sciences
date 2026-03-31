import { Injectable, signal } from '@angular/core';

const DARK_MODE_KEY = 'gsls_dark_mode';

@Injectable({
  providedIn: 'root'
})
export class UiPreferencesService {
  private readonly darkModeSignal = signal<boolean>(this.readInitialDarkMode());

  readonly darkMode = this.darkModeSignal.asReadonly();

  toggleDarkMode(): void {
    this.setDarkMode(!this.darkModeSignal());
  }

  setDarkMode(enabled: boolean): void {
    this.darkModeSignal.set(enabled);
    localStorage.setItem(DARK_MODE_KEY, enabled ? 'true' : 'false');
  }

  private readInitialDarkMode(): boolean {
    const stored = localStorage.getItem(DARK_MODE_KEY);
    if (stored === 'true') {
      return true;
    }

    if (stored === 'false') {
      return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
