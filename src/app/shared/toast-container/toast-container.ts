import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-toast-container',
  imports: [Icon],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainer {
  readonly toastService = inject(ToastService);
}
