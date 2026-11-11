import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Badge, BADGE_INFO } from '../../core/models';
import { Icon, IconName } from '../icon/icon';

/** Seller badge: always an icon and a word, never colour alone. */
@Component({
  selector: 'app-seller-badge',
  imports: [Icon],
  template: `<span [class]="classes()" [attr.title]="info()"><app-icon [name]="icon()" [size]="13" />{{ badge() }}</span>`,
  styleUrl: './seller-badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerBadge {
  readonly badge = input.required<Badge>();
  readonly large = input(false);

  readonly info = computed(() => BADGE_INFO[this.badge()]);
  readonly icon = computed<IconName>(() => {
    const icons: Record<Badge, IconName> = { Basic: 'user', Verified: 'shield', Trusted: 'star' };
    return icons[this.badge()];
  });
  readonly classes = computed(
    () => `badge badge-${this.badge().toLowerCase()}${this.large() ? ' badge-lg' : ''}`,
  );
}
