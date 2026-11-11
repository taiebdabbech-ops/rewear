import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-star-rating',
  imports: [Icon],
  templateUrl: './star-rating.html',
  styleUrl: './star-rating.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarRating {
  readonly value = input.required<number>();
  readonly count = input<number | null>(null);

  readonly stars = computed(() => {
    const rounded = Math.round(this.value());
    return [1, 2, 3, 4, 5].map((n) => n <= rounded);
  });
  readonly label = computed(() => `Rated ${this.value()} out of 5`);
}
