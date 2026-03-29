import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AnalyticsService } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-privacy-banner',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './privacy-banner.component.html',
  styleUrl: './privacy-banner.component.scss'
})
export class PrivacyBannerComponent {
  private readonly analytics = inject(AnalyticsService);
  readonly visible = computed(() => !this.analytics.hasConsentChoice());

  accept(): void {
    this.analytics.setConsent(true);
  }

  decline(): void {
    this.analytics.setConsent(false);
  }
}
