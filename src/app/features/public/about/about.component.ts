import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { SiteContentService } from '../../../core/services/site-content.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {
  private readonly siteContent = inject(SiteContentService);

  readonly isLoading = this.siteContent.isLoading;
  readonly settings = this.siteContent.settings;
}
