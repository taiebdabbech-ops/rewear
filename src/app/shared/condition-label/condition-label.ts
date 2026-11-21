import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Condition, CONDITION_INFO } from '../../core/models';

/** Condition grade: the darker the label, the better the condition. */
@Component({
  selector: 'app-condition-label',
  template: `<span [class]="classes()" [attr.title]="info()">{{ condition() }}</span>`,
  styleUrl: './condition-label.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionLabel {
  readonly condition = input.required<Condition>();
  /** Bigger version used on the product page. */
  readonly large = input(false);

  /** Explanation shown as a tooltip when the mouse is on the label. */
  readonly info = computed(() => CONDITION_INFO[this.condition()]);
  /** CSS classes: one colour per grade (cond-ln, cond-ex, cond-go, cond-fa). */
  readonly classes = computed(() => {
    const grade: Record<Condition, string> = {
      'Like New': 'ln',
      Excellent: 'ex',
      Good: 'go',
      Fair: 'fa',
    };
    return `cond cond-${grade[this.condition()]}${this.large() ? ' cond-lg' : ''}`;
  });
}
