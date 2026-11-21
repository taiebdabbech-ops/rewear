import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { timeAgo } from '../../../core/image-utils';
import { ListingService } from '../../../core/listing.service';
import { Inbox, MessageService } from '../../../core/message.service';
import { Message } from '../../../core/models';
import { UserService } from '../../../core/user.service';

/** The two lists: messages received as a seller, or sent to other sellers. */
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
  /** Id of the logged-in member, given by the Account page. */
  readonly userId = input.required<string>();

  private readonly messages = inject(MessageService);
  private readonly listings = inject(ListingService);
  private readonly users = inject(UserService);

  readonly boxes: { id: Box; label: string }[] = [
    { id: 'received', label: 'Received' },
    { id: 'sent', label: 'Sent' },
  ];
  /** Tab shown: Received or Sent. */
  readonly box = signal<Box>('received');
  /** Both lists as received from the API (null before the first answer). */
  readonly inbox = signal<Inbox | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  /** Lines of the open tab, with the listing photo/title and the other person's name. */
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

  /** The list is loaded when the tab opens (the userId input is ready at this moment). */
  ngOnInit(): void {
    this.load();
  }

  /** Number shown in each tab title, e.g. "Received (2)". */
  count(box: Box): number {
    return this.inbox()?.[box].length ?? 0;
  }

  /** Asks the API for both lists ("Try again" calls it again after an error). */
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
