import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DEFAULT_SETTINGS } from '../../core/models/site.models';
import { SiteContentService } from '../../core/services/site-content.service';

@Component({
  selector: 'app-public-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule],
  templateUrl: './public-shell.component.html',
  styleUrl: './public-shell.component.scss'
})
export class PublicShellComponent {
  private readonly siteContent = inject(SiteContentService);
  private readonly fallbackLogoUrl = DEFAULT_SETTINGS.logoUrl;

  readonly settings = this.siteContent.settings;
  readonly year = new Date().getFullYear();
  readonly mobileNavOpen = signal(false);
  readonly brandLogoUrl = computed(() => this.settings().logoUrl?.trim() || this.fallbackLogoUrl);

  toggleMobileNav(): void {
    this.mobileNavOpen.update((state) => !state);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  useFallbackLogo(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (!image) {
      return;
    }

    image.src = this.fallbackLogoUrl;
  }
}
