import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

// Every page is lazy-loaded: its code is downloaded only when the user opens it.
export const routes: Routes = [
  {
    path: '',
    title: 'REWEAR — Buy better. Wear better.',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'shop',
    title: 'Shop — REWEAR',
    loadComponent: () => import('./pages/shop/shop').then((m) => m.Shop),
  },
  {
    path: 'shop/:category',
    title: 'Shop — REWEAR',
    loadComponent: () => import('./pages/shop/shop').then((m) => m.Shop),
  },
  {
    path: 'product/:id',
    title: 'Product — REWEAR',
    loadComponent: () => import('./pages/product-detail/product-detail').then((m) => m.ProductDetail),
  },
  {
    path: 'seller/:id',
    title: 'Seller — REWEAR',
    loadComponent: () => import('./pages/seller-profile/seller-profile').then((m) => m.SellerProfile),
  },
  {
    path: 'sell',
    title: 'Sell an item — REWEAR',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/sell/sell').then((m) => m.Sell),
  },
  {
    path: 'account',
    title: 'My account — REWEAR',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/account/account').then((m) => m.Account),
  },
  {
    path: 'login',
    title: 'Log in — REWEAR',
    loadComponent: () => import('./pages/auth/auth').then((m) => m.Auth),
  },
  {
    path: 'how-it-works',
    title: 'How it works — REWEAR',
    loadComponent: () => import('./pages/how-it-works/how-it-works').then((m) => m.HowItWorks),
  },
  {
    path: '**',
    title: 'Page not found — REWEAR',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
  },
];
