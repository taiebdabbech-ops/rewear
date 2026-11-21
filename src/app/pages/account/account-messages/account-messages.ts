import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { timeAgo } from '../../../core/image-utils';
import { ListingService } from '../../../core/listing.service';
import { Inbox, MessageService } from '../../../core/message.service';
import { Message } from '../../../core/models';
import { UserService } from '../../../core/user.service';

type Box = 'received' | 'sent';

/** What one line of the list needs, prepared once instead of in the template. */
interface MessageView {
  message: Message;
  listingId: string;
  listingTitle: string;
  listingPhoto: string;
  otherName: string;
  when: string;
}

/**
 * "My messages" tab: the messages a member received about his listings
 * and the ones he sent to other sellers (GET /messages?sellerId=… and ?fromUserId=…).
 */
@Component({
  selector: 'app-account-messages',
  imports: [RouterLink],
  templateUrl: './account-messages.html',
  styleUrl: './account-messages.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountMessages implements OnInit {
  readonly userId = input.required<string>();

  private readonly messages = inject(MessageService);
  private readonly listings = inject(ListingService);
  private readonly users = inject(UserService);

  readonly boxes: { id: Box; label: string }[] = [
    { id: 'received', label: 'Received' },
    { id: 'sent', label: 'Sent' },
  ];
  readonly box = signal<Box>('received');
  readonly inbox = signal<Inbox | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly items = computed<MessageView[]>(() => {
    const inbox = this.inbox();
    if (!inbox) return [];
    const box = this.box();
    return inbox[box].map((message) => {
      const listing = this.listings.byId(message.listingId);
      const other = this.users.byId(box === 'received' ? message.fromUserId : message.sellerId);
      return {
        message,
        listingId: message.listingId,
        listingTitle: listing?.title || 'Listing no longer available',
        listingPhoto: listing?.photos[0] ?? 'images/placeholder.svg',
        otherName: other ? `${other.firstName} ${other.lastName.charAt(0)}.` : 'A REWEAR member',
        when: timeAgo(message.date),
      };
    });
  });

  ngOnInit(): void {
    this.load();
  }

  count(box: Box): number {
    return this.inbox()?.[box].length ?? 0;
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.messages.inbox(this.userId()).subscribe({
      next: (inbox) => {
        this.inbox.set(inbox);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
