import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { getBrandLogoUrl, getBrandLogoWithBackgroundUrl } from '../../core/config/brand-assets.config';
import { SiteContentService } from '../../core/services/site-content.service';
import { UiPreferencesService } from '../../core/services/ui-preferences.service';

@Component({
  selector: 'app-public-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './public-shell.component.html',
  styleUrl: './public-shell.component.scss'
})
export class PublicShellComponent {
  private readonly siteContent = inject(SiteContentService);
  private readonly uiPreferences = inject(UiPreferencesService);
  private readonly fallbackLogoUrl = getBrandLogoWithBackgroundUrl('headerBadge');

  readonly settings = this.siteContent.settings;
  readonly year = new Date().getFullYear();
  readonly mobileNavOpen = signal(false);
  readonly brandLogoUrl = computed(() => getBrandLogoUrl(this.settings().logoUrl, 'headerIcon'));
  readonly footerBrandLogoUrl = computed(() => getBrandLogoWithBackgroundUrl('headerBadge'));
  readonly isDarkMode = this.uiPreferences.darkMode;

  toggleMobileNav(): void {
    this.mobileNavOpen.update((state) => !state);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  toggleDarkMode(): void {
    this.uiPreferences.toggleDarkMode();
  }

  useFallbackLogo(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (!image) {
      return;
    }

    image.src = this.fallbackLogoUrl;
  }
}
