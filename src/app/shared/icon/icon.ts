import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Names accepted by <app-icon name="…">; each one is an SVG drawing in icon.html. */
export type IconName =
  | 'search'
  | 'heart'
  | 'heart-filled'
  | 'user'
  | 'star'
  | 'shield'
  | 'plus'
  | 'menu'
  | 'close'
  | 'home'
  | 'bag'
  | 'pin'
  | 'message'
  | 'upload'
  | 'chevron-down'
  | 'filter'
  | 'trash'
  | 'edit'
  | 'check'
  | 'leaf'
  | 'eye'
  | 'logout'
  | 'info'
  | 'arrow-right'
  | 'arrow-left'
  | 'tag'
  | 'mail'
  | 'send';

/** Outline icons (1.8 px stroke, rounded ends) as defined in our visual identity. */
@Component({
  selector: 'app-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  /** Which icon to draw. */
  readonly name = input.required<IconName>();
  /** Width and height in pixels (20 by default). */
  readonly size = input(20);
}
