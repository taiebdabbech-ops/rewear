import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { CITIES, cleanPhone, passwordsMatch, TN_PHONE } from '../../core/validators';
import { Icon } from '../../shared/icon/icon';

/** The two tabs of the page. */
type AuthMode = 'login' | 'signup';

/**
 * Log in / Sign up page (two tabs). Reactive forms with validation messages under each field;
 * after success the member goes back to the page he wanted (returnUrl) or to My account.
 */
@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Auth {
  /** Query parameters: ?mode=signup and ?returnUrl=/sell */
  readonly mode = input<string>();
  readonly returnUrl = input<string>();

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** Tab clicked by the user; null until he clicks (then ?mode= decides). */
  private readonly chosenMode = signal<AuthMode | null>(null);
  readonly currentMode = computed<AuthMode>(
    () => this.chosenMode() ?? (this.mode() === 'signup' ? 'signup' : 'login'),
  );

  /** True while the API answers: the buttons are disabled to avoid double sending. */
  readonly loading = signal(false);
  readonly loginError = signal<string | null>(null);
  readonly signupError = signal<string | null>(null);
  /** Error messages appear only after a first try (or once a field was touched). */
  readonly loginSubmitted = signal(false);
  readonly signupSubmitted = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  /** Sign-up rules: Tunisian phone, password of 6+ characters typed twice, terms accepted. */
  readonly signupForm = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.maxLength(30)]],
      lastName: ['', [Validators.required, Validators.maxLength(30)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(TN_PHONE)]],
      city: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', Validators.required],
      terms: [false, Validators.requiredTrue],
    },
    { validators: passwordsMatch },
  );

  readonly cities = CITIES;

  /** Switches tab and clears the old error messages. */
  setMode(mode: AuthMode): void {
    this.chosenMode.set(mode);
    this.loginError.set(null);
    this.signupError.set(null);
  }

  /** Should the error under this log-in field be shown? */
  loginInvalid(name: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[name];
    return control.invalid && (control.touched || this.loginSubmitted());
  }

  /** Should the error under this sign-up field be shown? */
  signupInvalid(name: string): boolean {
    const control = this.signupForm.get(name);
    return !!control && control.invalid && (control.touched || this.signupSubmitted());
  }

  /** Log-in form: checks the fields, asks AuthService, then redirects or shows an error. */
  login(): void {
    this.loginSubmitted.set(true);
    this.loginError.set(null);
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.getRawValue();
    this.loading.set(true);
    this.auth.login(email, password).subscribe({
      next: (ok) => {
        this.loading.set(false);
        if (!ok) {
          this.loginError.set('Wrong email or password.');
          return;
        }
        this.toast.show(`Welcome back, ${this.auth.user()?.firstName ?? ''}!`);
        this.router.navigateByUrl(this.returnUrl() || '/account');
      },
      error: () => {
        this.loading.set(false);
        this.loginError.set('Cannot reach the API. Is json-server running on port 3000?');
      },
    });
  }

  /** Sign-up form: checks every field, creates the account, then redirects. */
  signup(): void {
    this.signupSubmitted.set(true);
    this.signupError.set(null);
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const value = this.signupForm.getRawValue();
    this.loading.set(true);
    this.auth
      .signup({
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        email: value.email,
        phone: cleanPhone(value.phone),
        city: value.city,
        password: value.password,
      })
      .subscribe({
        next: (result) => {
          this.loading.set(false);
          if (result === 'email-taken') {
            this.signupError.set('An account already exists with this email. Log in instead.');
            return;
          }
          this.toast.show(`Welcome to REWEAR, ${value.firstName.trim()}!`);
          this.router.navigateByUrl(this.returnUrl() || '/account');
        },
        error: () => {
          this.loading.set(false);
          this.signupError.set('Cannot reach the API. Is json-server running on port 3000?');
        },
      });
  }

  /** "Fill in" button of the demo box: fills in Sarra's e-mail and password (for the presentation). */
  fillDemo(): void {
    this.loginForm.setValue({ email: 'sarra@rewear.tn', password: 'rewear123' });
  }
}
