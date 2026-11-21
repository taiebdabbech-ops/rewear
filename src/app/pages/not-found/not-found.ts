import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Page shown for any unknown address (route "**"). */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="container page state">
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist or has moved.</p>
      <a routerLink="/" class="btn btn-primary">Back to the home page</a>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {}
