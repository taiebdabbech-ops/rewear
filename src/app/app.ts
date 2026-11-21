import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ListingService } from './core/listing.service';
import { UserService } from './core/user.service';
import { BottomNav } from './shared/bottom-nav/bottom-nav';
import { Footer } from './shared/footer/footer';
import { Header } from './shared/header/header';
import { ToastContainer } from './shared/toast-container/toast-container';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, BottomNav, ToastContainer],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly listings = inject(ListingService);
  private readonly users = inject(UserService);

  ngOnInit(): void {
    // Load the shared data once; every page then reads it through signals.
    this.listings.load();
    this.users.load();
  }
}
