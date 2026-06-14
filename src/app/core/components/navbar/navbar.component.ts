import {
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
  WritableSignal,
  NgZone,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../services/cart-service/cart.service';
import { NavLinks } from './models/navlinks/links.interface';
import { filter, Subscription } from 'rxjs';
import { ProductsService } from '../../services/products-service/products.service';
import { WishlistService } from '../../services/wishlist-service/wishlist.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit, OnDestroy {
  readonly cartService = inject(CartService);
  readonly wishlistService = inject(WishlistService);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  private scrollListener?: () => void;

  private routerSubscription!: Subscription;

  isMobileMenuOpened: WritableSignal<boolean> = signal<boolean>(false);
  isScrolled: WritableSignal<boolean> = signal<boolean>(false);
  isMobileSearchOpened: WritableSignal<boolean> = signal<boolean>(false); // to toggle search bar on mobile

  /* Search state */
  readonly searchQuery = this.productsService.searchQuery;
  readonly searchResults = this.productsService.searchResults;

  navLinks: WritableSignal<NavLinks[]> = signal<NavLinks[]>([
    { id: 1, name: 'Home', path: '/' },
    { id: 2, name: 'Shop', path: '/products' },
    { id: 3, name: 'Our Story', path: '/about' },
    { id: 4, name: 'Policies', path: '/policies' },
  ]);

  // lifecycle methods
  ngOnInit(): void {
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.isMobileMenuOpened.set(false);
        this.closeSearch();
      });

    if (isPlatformBrowser(this.platformId)) {
      this.ngZone.runOutsideAngular(() => {
        this.scrollListener = () => {
          const scrolled = window.scrollY > 20;
          if (scrolled !== this.isScrolled()) {
            this.ngZone.run(() => {
              this.isScrolled.set(scrolled);
            });
          }
        };
        window.addEventListener('scroll', this.scrollListener, { passive: true });
      });
    }
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.scrollListener && isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.scrollListener);
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpened.update((val) => !val);
    if (this.isMobileMenuOpened()) {
      this.isMobileSearchOpened.set(false);
    }
  }

  toggleMobileSearch(): void {
    this.isMobileSearchOpened.update((val) => !val);
    if (this.isMobileSearchOpened()) {
      this.isMobileMenuOpened.set(false);
    }
  }

  /* Search handler */
  onSearchChange(event: Event): void {
    const searchInput = event.target as HTMLInputElement;
    this.searchQuery.set(searchInput.value);
  }

  closeSearch(): void {
    this.searchQuery.set('');
    this.isMobileSearchOpened.set(false);
  }
}
