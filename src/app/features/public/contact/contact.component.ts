import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { SiteContentService } from '../../../core/services/site-content.service';
import { LeadCaptureFormComponent } from '../../../shared/components/lead-capture-form/lead-capture-form.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, LeadCaptureFormComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  private readonly analytics = inject(AnalyticsService);
  private readonly siteContent = inject(SiteContentService);

  readonly isLoading = this.siteContent.isLoading;
  readonly settings = this.siteContent.settings;
  readonly contactEmailHref = computed(() => {
    const email = this.settings().contactEmail?.trim() || '';
    return email ? `mailto:${email}` : 'mailto:';
  });
  readonly contactPhoneHref = computed(() => this.toTelHref(this.settings().contactPhone));
  readonly whatsappHref = computed(() => this.toWhatsAppHref(this.settings().whatsappNumber));

  trackContactAction(action: string): void {
    void this.analytics.trackCtaClick(action, 'contact_info_panel');
  }

  private toTelHref(phone: string | null | undefined): string {
    const normalizedPhone = phone?.trim() || '';
    if (!normalizedPhone) {
      return 'tel:';
    }

    const compactPhone = normalizedPhone.replace(/[^\d+]/g, '');
    return `tel:${compactPhone || normalizedPhone}`;
  }

  private toWhatsAppHref(value: string | null | undefined): string {
    const normalized = value?.trim() || '';
    if (!normalized) {
      return 'https://wa.me/';
    }

    const digitsOnly = normalized.replace(/\D/g, '');
    return `https://wa.me/${digitsOnly || normalized}`;
  }
}
