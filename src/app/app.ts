import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { SeoService } from './core/services/seo.service';
import { AmbientBackgroundComponent } from './shared/components/ambient-background/ambient-background.component';
import { CustomCursorComponent } from './shared/components/custom-cursor/custom-cursor.component';
import { PrivacyBannerComponent } from './shared/components/privacy-banner/privacy-banner.component';
import { ScrollProgressTopComponent } from './shared/components/scroll-progress-top/scroll-progress-top.component';
import { ToastOutletComponent } from './shared/components/toast-outlet/toast-outlet.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    AmbientBackgroundComponent,
    CustomCursorComponent,
    PrivacyBannerComponent,
    ScrollProgressTopComponent,
    ToastOutletComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly themeService = inject(ThemeService);
  private readonly seoService = inject(SeoService);
  readonly enableAmbientBackground = signal(true);
  readonly enableCustomCursor = signal(true);

  constructor() {
    void this.themeService;
    void this.seoService;

    if (typeof window !== 'undefined') {
      this.configureVisualEffectsMode();
    }
  }

  private configureVisualEffectsMode(): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const narrowViewport = window.innerWidth < 1024;
    const lowCpuDevice = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
    const networkInfo = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const saveDataEnabled = Boolean(networkInfo?.saveData);

    const disableAmbientBackground = prefersReducedMotion || coarsePointer || narrowViewport || lowCpuDevice || saveDataEnabled;
    const disableCustomCursor = prefersReducedMotion || coarsePointer || lowCpuDevice || saveDataEnabled;

    this.enableAmbientBackground.set(!disableAmbientBackground);
    this.enableCustomCursor.set(!disableCustomCursor);
  }
}
