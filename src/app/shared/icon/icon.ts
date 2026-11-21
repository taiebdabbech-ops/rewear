import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'search' | 'heart' | 'heart-filled' | 'user' | 'star' | 'shield' | 'plus' | 'menu' | 'close'
  | 'bag' | 'pin' | 'message' | 'upload' | 'chevron-down' | 'filter' | 'trash' | 'edit' | 'check'
  | 'leaf' | 'eye' | 'logout' | 'info' | 'arrow-right' | 'arrow-left' | 'tag' | 'mail' | 'send';

/** Outline icons (1.8 px stroke, rounded ends) as defined in our visual identity. */
@Component({
  selector: 'app-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
}
