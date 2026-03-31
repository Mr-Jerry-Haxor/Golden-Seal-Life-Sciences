import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';

const LEAD_MODAL_DISMISSED_KEY = 'gsls_lead_modal_dismissed';

@Component({
  selector: 'app-lead-intent-modal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './lead-intent-modal.component.html',
  styleUrl: './lead-intent-modal.component.scss'
})
export class LeadIntentModalComponent implements OnInit, OnDestroy {
  private readonly analytics = inject(AnalyticsService);
  private readonly router = inject(Router);

  readonly visible = signal(false);

  private delayTimer: number | null = null;

  private readonly onMouseOut = (event: MouseEvent): void => {
    if (event.relatedTarget !== null) {
      return;
    }

    if (event.clientY > 8) {
      return;
    }

    this.open('exit_intent');
  };

  ngOnInit(): void {
    if (this.isDismissed()) {
      return;
    }

    this.delayTimer = window.setTimeout(() => {
      this.open('delay_timer');
    }, 18000);

    document.addEventListener('mouseout', this.onMouseOut);
  }

  ngOnDestroy(): void {
    if (this.delayTimer !== null) {
      window.clearTimeout(this.delayTimer);
      this.delayTimer = null;
    }

    document.removeEventListener('mouseout', this.onMouseOut);
  }

  dismiss(reason = 'dismiss_button'): void {
    if (!this.visible()) {
      return;
    }

    this.visible.set(false);
    sessionStorage.setItem(LEAD_MODAL_DISMISSED_KEY, '1');
    void this.analytics.trackEvent('lead_modal_dismissed', this.router.url, { reason });
  }

  onCtaClick(): void {
    sessionStorage.setItem(LEAD_MODAL_DISMISSED_KEY, '1');
    void this.analytics.trackCtaClick('lead_modal_contact', 'lead_modal', this.router.url);
  }

  private open(trigger: string): void {
    if (this.visible() || this.isDismissed()) {
      return;
    }

    this.visible.set(true);
    void this.analytics.trackEvent('lead_modal_opened', this.router.url, { trigger });
  }

  private isDismissed(): boolean {
    return sessionStorage.getItem(LEAD_MODAL_DISMISSED_KEY) === '1';
  }
}
