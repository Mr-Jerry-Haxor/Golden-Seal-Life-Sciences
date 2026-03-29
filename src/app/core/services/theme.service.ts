import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject } from '@angular/core';
import { SiteTheme } from '../models/site.models';
import { SiteContentService } from './site-content.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly siteContent = inject(SiteContentService);

  constructor() {
    effect(() => {
      this.applyTheme(this.siteContent.theme());
    });
  }

  private applyTheme(theme: SiteTheme): void {
    const root = this.document.documentElement;
    root.style.setProperty('--brand-primary', theme.brandPrimary);
    root.style.setProperty('--brand-secondary', theme.brandSecondary);
    root.style.setProperty('--brand-accent', theme.accent);
    root.style.setProperty('--bg-start', theme.backgroundStart);
    root.style.setProperty('--bg-end', theme.backgroundEnd);
    root.style.setProperty('--surface', theme.surface);
    root.style.setProperty('--text-primary', theme.textPrimary);
    root.style.setProperty('--text-muted', theme.textMuted);
    root.style.setProperty('--pointer-color', theme.pointerColor);
  }
}
