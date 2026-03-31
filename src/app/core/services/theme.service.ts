import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject } from '@angular/core';
import { SiteTheme } from '../models/site.models';
import { SiteContentService } from './site-content.service';
import { UiPreferencesService } from './ui-preferences.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly siteContent = inject(SiteContentService);
  private readonly uiPreferences = inject(UiPreferencesService);

  constructor() {
    effect(() => {
      this.applyTheme(this.siteContent.theme(), this.uiPreferences.darkMode());
    });
  }

  private applyTheme(theme: SiteTheme, darkModeEnabled: boolean): void {
    const root = this.document.documentElement;

    root.classList.toggle('dark', darkModeEnabled);

    root.style.setProperty('--brand-primary', theme.brandPrimary);
    root.style.setProperty('--brand-secondary', theme.brandSecondary);
    root.style.setProperty('--brand-accent', theme.accent);

    if (darkModeEnabled) {
      root.style.setProperty('--bg-start', '#020617');
      root.style.setProperty('--bg-end', '#0f172a');
      root.style.setProperty('--surface', '#0f172a');
      root.style.setProperty('--text-primary', '#e2e8f0');
      root.style.setProperty('--text-muted', '#94a3b8');
      root.style.setProperty('--pointer-color', theme.accent || '#2ecc71');
      return;
    }

    root.style.setProperty('--bg-start', theme.backgroundStart);
    root.style.setProperty('--bg-end', theme.backgroundEnd);
    root.style.setProperty('--surface', theme.surface);
    root.style.setProperty('--text-primary', theme.textPrimary);
    root.style.setProperty('--text-muted', theme.textMuted);
    root.style.setProperty('--pointer-color', theme.pointerColor);
  }
}
