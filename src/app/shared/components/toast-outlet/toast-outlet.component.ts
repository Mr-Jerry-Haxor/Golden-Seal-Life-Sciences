import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-outlet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-outlet.component.html',
  styleUrl: './toast-outlet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastOutletComponent {
  private readonly toastService = inject(ToastService);

  readonly toastItems = this.toastService.toastItems;

  dismiss(toastId: string): void {
    this.toastService.dismiss(toastId);
  }
}
