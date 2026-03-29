import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { AmbientBackgroundComponent } from './shared/components/ambient-background/ambient-background.component';
import { CustomCursorComponent } from './shared/components/custom-cursor/custom-cursor.component';
import { PrivacyBannerComponent } from './shared/components/privacy-banner/privacy-banner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AmbientBackgroundComponent, CustomCursorComponent, PrivacyBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly themeService = inject(ThemeService);

  constructor() {
    void this.themeService;
  }
}
