import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon } from '../icon/icon';

/** Five stars (full or empty) for a seller's average mark, with an accessible text label. */
@Component({
  selector: 'app-star-rating',
  imports: [Icon],
  templateUrl: './star-rating.html',
  styleUrl: './star-rating.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarRating {
  /** Average mark out of 5, e.g. 4.6. */
  readonly value = input.required<number>();
  /** Number of reviews shown after the stars; null hides it. */
  readonly count = input<number | null>(null);

  /** [true, true, true, true, false] for 4 stars: true = full star. */
  readonly stars = computed(() => {
    const rounded = Math.round(this.value());
    return [1, 2, 3, 4, 5].map((n) => n <= rounded);
  });
  /** Text read by screen readers instead of the star drawings. */
  readonly label = computed(() => `Rated ${this.value()} out of 5`);
}
