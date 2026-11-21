import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../core/toast.service';
import { CITIES, cleanPhone, passwordsMatch, TN_PHONE } from '../../../core/validators';

type ProfileField = 'firstName' | 'lastName' | 'phone' | 'city';
type PasswordField = 'current' | 'password' | 'confirm';

/**
 * "Profile" tab of My account (sitemap: Profile settings).
 * Two independent forms: personal details (PATCH /users/:id) and password change.
 */
@Component({
  selector: 'app-profile-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './profile-settings.html',
  styleUrl: './profile-settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSettings {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);
  readonly profileSubmitted = signal(false);
  readonly passwordSubmitted = signal(false);
  readonly passwordError = signal<string | null>(null);

  /** The user's own city stays selectable even if it is not in the standard list. */
  readonly cities = computed(() => {
    const city = this.auth.user()?.city;
    return city && !CITIES.includes(city) ? [city, ...CITIES] : CITIES;
  });

  readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(30)]],
    lastName: ['', [Validators.required, Validators.maxLength(30)]],
    phone: ['', [Validators.required, Validators.pattern(TN_PHONE)]],
    city: ['', Validators.required],
  });

  readonly passwordForm = this.fb.nonNullable.group(
    {
      current: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  constructor() {
    this.resetProfile();
  }

  /** Puts the saved values back in the form (also used by the Cancel button). */
  resetProfile(): void {
    const user = this.auth.user();
    if (!user) return;
    this.profileForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      city: user.city,
    });
    this.profileSubmitted.set(false);
  }

  profileInvalid(name: ProfileField): boolean {
    const control = this.profileForm.controls[name];
    return control.invalid && (control.touched || this.profileSubmitted());
  }

  passwordInvalid(name: PasswordField): boolean {
    const control = this.passwordForm.controls[name];
    return control.invalid && (control.touched || this.passwordSubmitted());
  }

  /** True when the two new passwords are filled in but different. */
  mismatch(): boolean {
    const confirm = this.passwordForm.controls.confirm;
    return this.passwordForm.hasError('mismatch') && (confirm.touched || this.passwordSubmitted());
  }

  saveProfile(): void {
    this.profileSubmitted.set(true);
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const value = this.profileForm.getRawValue();
    this.savingProfile.set(true);
    this.auth
      .updateProfile({
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        phone: cleanPhone(value.phone),
        city: value.city,
      })
      .subscribe({
        next: () => {
          this.savingProfile.set(false);
          this.profileForm.markAsPristine();
          this.toast.show('Your profile is updated.');
        },
        error: () => {
          this.savingProfile.set(false);
          this.toast.show('The profile could not be saved. Is the API running on port 3000?', 'error');
        },
      });
  }

  changePassword(): void {
    this.passwordSubmitted.set(true);
    this.passwordError.set(null);
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { current, password } = this.passwordForm.getRawValue();
    this.savingPassword.set(true);
    this.auth.changePassword(current, password).subscribe({
      next: (result) => {
        this.savingPassword.set(false);
        if (result === 'wrong-password') {
          this.passwordError.set('The current password is not correct.');
          return;
        }
        this.passwordForm.reset();
        this.passwordSubmitted.set(false);
        this.toast.show('Your password is changed.');
      },
      error: () => {
        this.savingPassword.set(false);
        this.passwordError.set('Cannot reach the API. Is json-server running on port 3000?');
      },
    });
  }
}
