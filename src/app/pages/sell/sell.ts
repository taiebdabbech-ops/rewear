import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { resizeImage } from '../../core/image-utils';
import { ListingService } from '../../core/listing.service';
import {
  CATEGORIES,
  Category,
  Condition,
  CONDITION_INFO,
  CONDITIONS,
  Listing,
  ListingStatus,
  newId,
  SIZES,
  TYPES,
} from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon/icon';

const MAX_PHOTOS = 4;

/** Field labels used in the error message. */
const FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  description: 'Description',
  category: 'Category',
  type: 'Type',
  size: 'Size',
  brand: 'Brand',
  color: 'Colour',
  condition: 'Condition',
  price: 'Price',
};

@Component({
  selector: 'app-sell',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './sell.html',
  styleUrl: './sell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sell {
  /** Optional query parameter ?edit=<listing id> to edit an existing listing. */
  readonly edit = input<string>();

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly listingService = inject(ListingService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly categories = CATEGORIES;
  readonly conditions = CONDITIONS;
  readonly conditionInfo = CONDITION_INFO;
  readonly types = TYPES;
  readonly sizes = SIZES;
  readonly maxPhotos = MAX_PHOTOS;

  readonly photos = signal<string[]>([]);
  readonly submitted = signal(false);
  readonly saving = signal(false);
  readonly photoError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(60)]],
    description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(600)]],
    category: ['' as Category | '', Validators.required],
    type: ['', Validators.required],
    size: ['', Validators.required],
    brand: ['', [Validators.required, Validators.maxLength(30)]],
    color: ['', Validators.maxLength(20)],
    condition: ['' as Condition | '', Validators.required],
    price: [null as number | null, [Validators.required, Validators.min(1), Validators.max(5000)]],
  });

  /** The listing being edited, if the URL contains ?edit=… and the user owns it. */
  readonly editing = computed<Listing | undefined>(() => {
    const id = this.edit();
    const user = this.auth.user();
    if (!id || !user) return undefined;
    const listing = this.listingService.byId(id);
    return listing && listing.sellerId === user.id ? listing : undefined;
  });

  private filledFor: string | null = null;

  constructor() {
    // Fill the form once when we open an existing listing.
    effect(() => {
      const listing = this.editing();
      if (listing && this.filledFor !== listing.id) {
        this.filledFor = listing.id;
        this.form.patchValue({
          title: listing.title,
          description: listing.description,
          category: listing.category,
          type: listing.type,
          size: listing.size,
          brand: listing.brand,
          color: listing.color,
          condition: listing.condition,
          price: listing.price,
        });
        this.photos.set([...listing.photos]);
      }
    });
  }

  /** True when a field must show its error message. */
  invalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && (control.touched || this.submitted());
  }

  /** Names of the fields that block publication, in the order of the form. */
  private invalidFields(): string[] {
    const fields: string[] = [];
    if (this.photos().length === 0) fields.push('Photos');
    for (const [name, control] of Object.entries(this.form.controls)) {
      if (control.invalid) fields.push(FIELD_LABELS[name] ?? name);
    }
    return fields;
  }

  /** Waits for the red borders to appear, then brings the first wrong field into view. */
  private scrollToFirstError(): void {
    setTimeout(() => {
      const first = document.querySelector<HTMLElement>('.sell-form .invalid');
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (first instanceof HTMLInputElement || first instanceof HTMLTextAreaElement || first instanceof HTMLSelectElement) {
        first.focus({ preventScroll: true });
      }
    });
  }

  async onFiles(event: Event): Promise<void> {
    const inputElement = event.target as HTMLInputElement;
    const files = Array.from(inputElement.files ?? []);
    inputElement.value = '';
    this.photoError.set(null);

    const room = MAX_PHOTOS - this.photos().length;
    if (files.length > room) {
      this.photoError.set(`You can add up to ${MAX_PHOTOS} photos.`);
    }
    for (const file of files.slice(0, Math.max(0, room))) {
      if (!file.type.startsWith('image/')) {
        this.photoError.set('Only image files (JPG, PNG, WebP) are accepted.');
        continue;
      }
      try {
        const dataUrl = await resizeImage(file);
        this.photos.update((list) => [...list, dataUrl]);
      } catch {
        this.photoError.set('One of the photos could not be read.');
      }
    }
  }

  removePhoto(index: number): void {
    this.photos.update((list) => list.filter((_, i) => i !== index));
  }

  makeCover(index: number): void {
    this.photos.update((list) => [list[index], ...list.filter((_, i) => i !== index)]);
  }

  save(status: ListingStatus): void {
    this.submitted.set(true);
    const user = this.auth.user();
    if (!user) return;

    if (status === 'active' && (this.form.invalid || this.photos().length === 0)) {
      this.form.markAllAsTouched();
      this.toast.show(`Please check: ${this.invalidFields().join(', ')}.`, 'error');
      this.scrollToFirstError();
      return;
    }
    if (status === 'draft' && this.form.controls.title.invalid) {
      this.form.controls.title.markAsTouched();
      this.toast.show('Give your draft a title first.', 'error');
      return;
    }

    const value = this.form.getRawValue();
    const data = {
      title: value.title.trim(),
      description: value.description.trim(),
      category: (value.category || 'Women') as Category,
      type: value.type,
      size: value.size,
      brand: value.brand.trim(),
      color: value.color.trim(),
      condition: (value.condition || 'Good') as Condition,
      price: Number(value.price ?? 0),
      photos: this.photos(),
      status,
    };

    this.saving.set(true);
    const existing = this.editing();
    const request = existing
      ? this.listingService.update(existing.id, data)
      : this.listingService.create({
          ...data,
          id: newId(),
          sellerId: user.id,
          createdAt: new Date().toISOString(),
          views: 0,
        });

    request.subscribe({
      next: (saved) => {
        this.saving.set(false);
        if (status === 'active') {
          this.toast.show(existing ? 'Your listing is updated.' : 'Your item is online!');
          // ?published=new shows the publish confirmation on the product page.
          this.router.navigate(['/product', saved.id], existing ? {} : { queryParams: { published: 'new' } });
        } else {
          this.toast.show('Draft saved in My account.', 'info');
          this.router.navigate(['/account'], { queryParams: { tab: 'listings' } });
        }
      },
      error: () => {
        this.saving.set(false);
        this.toast.show('Saving failed. Is the API running on port 3000?', 'error');
      },
    });
  }
}
