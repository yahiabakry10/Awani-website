import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  delay,
  distinctUntilChanged,
  map,
  Observable,
  of,
  shareReplay,
  tap,
} from 'rxjs';
import { Product } from '../../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly http = inject(HttpClient);

  /**
   * Loading State
   */
  readonly loading: WritableSignal<boolean> = signal<boolean>(true);

  /**
   * DATA ACCESS LAYER:
   * We fetch products from a static JSON file. In a real-world scenario,
   * this would be a REST API endpoint.
   *
   * 'shareReplay(1)' is a critical optimization: it ensures that the HTTP request
   * is made only once and the result is cached for all subsequent subscribers.
   */
  private readonly productsCache$: Observable<Product[]> = this.http
    .get<Product[]>('/assets/products.json')
    .pipe(
      delay(500), // Added delay to simulate network delay
      tap(() => this.loading.set(false)), // canceling loading state after successfull fetch
      catchError((error) => {
        console.error('Data Fetching Error:', error);
        this.loading.set(false); // canceling loading state in case of error
        return of([]); // return empty array in case of error
      }),
      shareReplay(1), // caches the last emitted value so all subscribers get it immediately
    );

  /**
   * REACTIVE STATE:
   * Converting the Observable to a Signal for a more modern, synchronous-like
   * developer experience in templates and other signals.
   */
  readonly products = toSignal(this.productsCache$, { initialValue: [] as Product[] });

  /**
   * DERIVED STATE: Categories
   * We derive unique categories and their metadata directly from the product list.
   * This ensures that the category list is always in sync with the available products.
   */
  readonly categories = computed(() => {
    const allProducts = this.products();
    if (!allProducts.length) return [];

    const uniqueCategoryNames = [...new Set(allProducts.map((p) => p.category))];

    const categoryImages: Record<string, string> = {
      'Mugs & Cups': '/images/Mugs&CupsCat.webp',
      'Serving Plates': '/images/ServingPlatesCat.webp',
      Vases: '/images/VasesCat.webp',
    };

    return uniqueCategoryNames.map((name) => ({
      name,
      count: allProducts.filter((p) => p.category === name).length,
      // Fallback image
      image: categoryImages[name] || '/images/Mugs&CupsCat.webp',
    }));
  });

  /**
   * Retrieval logic for a single product.
   * Leverages the cached observable to avoid redundant HTTP calls.
   */
  getProduct(id: number): Observable<Product | undefined> {
    return this.productsCache$.pipe(map((products) => products.find((p) => p.id === id)));
  }

  /**
   * Filtering logic for category-specific views.
   */
  getProductsByCategory(category: string): Observable<Product[]> {
    return this.productsCache$.pipe(
      map((products) => products.filter((p) => p.category === category)),
    );
  }

  /**
   * Products search logic
   */
  readonly searchQuery: WritableSignal<string> = signal<string>('');

  /* Transforming searchQuery signal into observable to apply RXJS methods - debounce */
  readonly debouncedQuery$ = toObservable(this.searchQuery).pipe(
    debounceTime(300), // wait for 300ms before emitting
    distinctUntilChanged(), // dont emit if the value is same as previous
  );

  /* Transforming searchQuery again into computed signal to use it */
  readonly debouncedSearchQuery = toSignal(this.debouncedQuery$, { initialValue: '' });

  /* Get filtered search results */
  readonly searchResults: Signal<Product[]> = computed(() => {
    const query = this.debouncedSearchQuery().toLowerCase().trim();
    if (!query) {
      return [];
    }

    return this.products().filter((product) => product.name.toLowerCase().includes(query));
  });
}
