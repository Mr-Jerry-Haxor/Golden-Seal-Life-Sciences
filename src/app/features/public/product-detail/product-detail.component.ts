import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { SiteContentService } from '../../../core/services/site-content.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly siteContent = inject(SiteContentService);

  private readonly slug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug') || '')),
    { initialValue: '' }
  );

  readonly product = computed(() =>
    this.siteContent.products().find((item) => item.slug === this.slug())
  );
}
