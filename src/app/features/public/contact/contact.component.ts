import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { SiteContentService } from '../../../core/services/site-content.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  private readonly fb = inject(FormBuilder);
  private readonly analytics = inject(AnalyticsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly siteContent = inject(SiteContentService);

  readonly settings = this.siteContent.settings;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    company: [''],
    message: ['', [Validators.required, Validators.minLength(10)]],
    consent: [false, Validators.requiredTrue]
  });

  submitting = false;

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
      this.form.reset({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: '',
        consent: false
      });
      this.snackBar.open('Thank you. Your message has been submitted.', 'Close', {
        duration: 3500
      });
    } catch {
      this.snackBar.open('Submission failed. Please verify Firebase setup and try again.', 'Close', {
        duration: 4200
      });
    } finally {
      this.submitting = false;
    }
  }
}
