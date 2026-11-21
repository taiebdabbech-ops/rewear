import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth.service';
import { ContactService } from '../../../core/contact.service';
import { CONTACT_SUBJECTS, ContactSubject, newId } from '../../../core/models';
import { ToastService } from '../../../core/toast.service';
import { Icon } from '../../../shared/icon/icon';

type ContactField = 'name' | 'email' | 'subject' | 'text';

/** Contact form (sitemap: Support › Contact). Name and e-mail are pre-filled for members. */
@Component({
  selector: 'app-contact-form',
  imports: [ReactiveFormsModule, Icon],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactForm {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly contact = inject(ContactService);
  private readonly toast = inject(ToastService);

  readonly subjects = CONTACT_SUBJECTS;
  readonly maxLength = 1000;
  readonly sending = signal(false);
  readonly submitted = signal(false);
  readonly sent = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email]],
    subject: ['' as ContactSubject | '', Validators.required],
    text: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(this.maxLength)]],
  });

  constructor() {
    this.prefill();
  }

  invalid(name: ContactField): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  send(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.sending.set(true);
    this.contact
      .send({
        id: newId(),
        name: value.name.trim(),
        email: value.email.trim().toLowerCase(),
        subject: value.subject as ContactSubject,
        text: value.text.trim(),
        userId: this.auth.user()?.id ?? null,
        date: new Date().toISOString(),
      })
      .subscribe({
        next: () => {
          this.sending.set(false);
          this.sent.set(true);
          this.toast.show('Message sent to the REWEAR team.');
        },
        error: () => {
          this.sending.set(false);
          this.error.set('The message could not be sent. Is json-server running on port 3000?');
        },
      });
  }

  /** "Write another message": empty form, name and e-mail kept for members. */
  another(): void {
    this.sent.set(false);
    this.submitted.set(false);
    this.prefill();
  }

  private prefill(): void {
    const user = this.auth.user();
    this.form.reset({
      name: user ? `${user.firstName} ${user.lastName}` : '',
      email: user?.email ?? '',
      subject: '',
      text: '',
    });
  }
}
