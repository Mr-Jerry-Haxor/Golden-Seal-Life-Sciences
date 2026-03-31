import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { getBrandLogoWithBackgroundUrl } from '../../../core/config/brand-assets.config';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { UiPreferencesService } from '../../../core/services/ui-preferences.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss'
})
export class AdminLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);
  private readonly uiPreferences = inject(UiPreferencesService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [true]
  });

  loading = false;
  readonly isDarkMode = this.uiPreferences.darkMode;
  readonly loginLogoUrl = getBrandLogoWithBackgroundUrl('adminAuth');
  showPassword = false;
  errorMessage = '';

  toggleDarkMode(): void {
    this.uiPreferences.toggleDarkMode();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async login(): Promise<void> {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password, rememberMe } = this.form.getRawValue();
    const result = await this.auth.login(email, password, rememberMe);

    this.loading = false;
    if (!result.success) {
      this.errorMessage = result.message;
      return;
    }

    await this.router.navigateByUrl('/admin/dashboard');
  }
}
