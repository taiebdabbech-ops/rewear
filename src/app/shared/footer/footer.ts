import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Site footer: links to the categories and to the sections of "How it works" (FAQ, contact, terms…). */
@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  /** Current year for the copyright line. */
  readonly year = new Date().getFullYear();
}
