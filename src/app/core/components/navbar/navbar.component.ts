import { Component, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { CartService } from '../../services/cart-service/cart.service';
import { ProductsService } from '../../services/products-service/products.service';
import { WishlistService } from '../../services/wishlist-service/wishlist.service';
import { NavLinks } from './models/navlinks/links.interface';

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

  private routerSubscription!: Subscription;

  isMobileMenuOpened: WritableSignal<boolean> = signal<boolean>(false);
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
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
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
