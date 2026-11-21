import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';

/**
 * "Forgot password" page (sitemap: Log in / Sign up › Forgot password).
 * Simulated: no e-mail is sent. The confirmation never says whether the address has
 * an account, so the page cannot be used to find out who is registered (good practice).
 */
@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);

  readonly submitted = signal(false);
  /** Address shown in the confirmation once the form is sent. */
  readonly sentTo = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  invalid(): boolean {
    const control = this.form.controls.email;
    return control.invalid && (control.touched || this.submitted());
  }

  send(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.sentTo.set(this.form.controls.email.value.trim().toLowerCase());
  }

  /** "Use another address": back to the empty form. */
  restart(): void {
    this.sentTo.set(null);
    this.submitted.set(false);
    this.form.reset();
  }
}
