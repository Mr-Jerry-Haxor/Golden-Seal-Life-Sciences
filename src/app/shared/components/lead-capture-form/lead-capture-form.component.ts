import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-lead-capture-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule
  ],
  templateUrl: './lead-capture-form.component.html',
  styleUrl: './lead-capture-form.component.scss'
})
export class LeadCaptureFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly analytics = inject(AnalyticsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  @Input() sourceContext = 'lead_form';
  @Input() submitLabel = 'Submit Inquiry';
  @Input() compact = false;
  @Output() submitted = new EventEmitter<void>();

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    company: [''],
    message: ['', [Validators.required, Validators.minLength(10)]],
    consent: [false, Validators.requiredTrue]
  });

  submitting = false;
  private trackedInteraction = false;

  markInteraction(): void {
    if (this.trackedInteraction) {
      return;
    }

    this.trackedInteraction = true;
    void this.analytics.trackLeadFormStarted(this.router.url, this.sourceContext);
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const value = this.form.getRawValue();

    try {
      await this.analytics.captureLead({
        name: value.name,
        email: value.email,
        phone: value.phone,
        company: value.company,
        message: value.message,
        sourcePath: this.router.url,
        consent: value.consent
      });

      await this.analytics.trackCtaClick('lead_form_submit', this.sourceContext, this.router.url);

      this.form.reset({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: '',
        consent: false
      });

      this.submitted.emit();
      this.toast.show({
        message: 'Thank you. Your inquiry has been submitted successfully.',
        tone: 'success'
      });
    } catch {
      await this.analytics.trackEvent('lead_submit_failed', this.router.url, {
        sourceContext: this.sourceContext
      });

      this.toast.show({
        message: 'Submission failed. Please verify Firebase setup and try again.',
        tone: 'error',
        durationMs: 4200
      });
    } finally {
      this.submitting = false;
    }
  }
}
