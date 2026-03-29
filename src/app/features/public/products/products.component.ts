import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { SiteContentService } from '../../../core/services/site-content.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent {
  private readonly siteContent = inject(SiteContentService);

  readonly products = this.siteContent.products;
  readonly groupedProducts = computed(() => {
    const groups = new Map<string, typeof this.products extends () => infer R ? R : never>();

    for (const product of this.products()) {
      const existing = groups.get(product.category) || [];
      groups.set(product.category, [...existing, product]);
    }

    return Array.from(groups.entries()).map(([category, products]) => ({ category, products }));
  });
}
