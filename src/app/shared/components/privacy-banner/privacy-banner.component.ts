import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-privacy-banner',
  standalone: true,
  imports: [CommonModule, MatButtonModule, RouterLink],
  templateUrl: './privacy-banner.component.html',
  styleUrl: './privacy-banner.component.scss'
})
export class PrivacyBannerComponent {
  private readonly analytics = inject(AnalyticsService);
  private readonly toast = inject(ToastService);
  readonly visible = computed(() => !this.analytics.hasConsentChoice());

  accept(): void {
    this.analytics.setConsent(true);
    this.toast.show({
      message: 'Analytics preference saved. You can change it from browser settings later.',
      tone: 'success'
    });
  }

  decline(): void {
    this.analytics.setConsent(false);
    this.toast.show({
      message: 'Optional analytics disabled. Core site functionality remains unchanged.',
      tone: 'info'
    });
  }
}
