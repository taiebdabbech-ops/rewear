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
  readonly large = input(false);

  readonly info = computed(() => CONDITION_INFO[this.condition()]);
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
