import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon/icon';

type AuthMode = 'login' | 'signup';

/** Group validator: the two passwords must be identical. */
const passwordsMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
};

/** Tunisian mobile number: 8 digits, optionally preceded by +216. */
const TN_PHONE = /^(\+216\s?)?[2-9]\d{1}\s?\d{3}\s?\d{3}$/;

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

  private readonly chosenMode = signal<AuthMode | null>(null);
  readonly currentMode = computed<AuthMode>(
    () => this.chosenMode() ?? (this.mode() === 'signup' ? 'signup' : 'login'),
  );

  readonly loading = signal(false);
  readonly loginError = signal<string | null>(null);
  readonly signupError = signal<string | null>(null);
  readonly loginSubmitted = signal(false);
  readonly signupSubmitted = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

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

  readonly cities = ['Tunis', 'Ariana', 'Ben Arous', 'Sfax', 'Sousse', 'Monastir', 'Nabeul', 'Bizerte', 'Gabès', 'Kairouan'];

  setMode(mode: AuthMode): void {
    this.chosenMode.set(mode);
    this.loginError.set(null);
    this.signupError.set(null);
  }

  loginInvalid(name: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[name];
    return control.invalid && (control.touched || this.loginSubmitted());
  }

  signupInvalid(name: string): boolean {
    const control = this.signupForm.get(name);
    return !!control && control.invalid && (control.touched || this.signupSubmitted());
  }

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
        phone: value.phone.replace(/\s/g, ''),
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

  fillDemo(): void {
    this.loginForm.setValue({ email: 'sarra@rewear.tn', password: 'rewear123' });
  }
}
