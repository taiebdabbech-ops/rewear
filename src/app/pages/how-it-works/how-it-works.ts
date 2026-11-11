import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BADGE_INFO, BADGES, CONDITION_INFO, CONDITIONS } from '../../core/models';
import { ConditionLabel } from '../../shared/condition-label/condition-label';
import { SellerBadge } from '../../shared/seller-badge/seller-badge';

@Component({
  selector: 'app-how-it-works',
  imports: [RouterLink, ConditionLabel, SellerBadge],
  templateUrl: './how-it-works.html',
  styleUrl: './how-it-works.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HowItWorks {
  readonly conditions = CONDITIONS;
  readonly conditionInfo = CONDITION_INFO;
  readonly badges = BADGES;
  readonly badgeInfo = BADGE_INFO;

  readonly faq = [
    {
      q: 'Does REWEAR take a fee from buyers?',
      a: 'No. Buyers pay only the price of the item and the delivery. A small commission is taken from the seller when an item is sold.',
    },
    {
      q: 'How do I pay?',
      a: 'In this first version, payment is cash on delivery or by hand when you meet the seller. Online payment is planned for version 2.',
    },
    {
      q: 'What if the item does not match the description?',
      a: 'Check it when you receive it. Leave an honest review on the seller profile so other buyers are informed.',
    },
    {
      q: 'Can shops sell on REWEAR?',
      a: 'Yes. Second-hand clothing shops can create an account and publish their pieces like any seller.',
    },
  ];
}
