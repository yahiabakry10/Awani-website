import { computed, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  from, // Converts Supabase Promise into an RxJS Observable
  map,
  Observable,
  of,
  shareReplay,
  tap,
} from 'rxjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product } from '../../models/product.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  // Supabase client instance
  private readonly supabase: SupabaseClient;

  /**
   * Loading State
   */
  readonly loading: WritableSignal<boolean> = signal<boolean>(true);

  /**
   * DATA ACCESS LAYER:
   * Fetches live data from Supabase instead of HttpClient and local JSON file.
   */
  private readonly productsCache$: Observable<Product[]>;

  /**
   * REACTIVE STATE:
   * The core read-only signal that components consume.
   */
  readonly products: Signal<Product[]>;

  constructor() {
    // Initialize Supabase client using environment variables
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    // Build the reactive stream to fetch and cache products from Supabase
    this.productsCache$ = from(
      this.supabase.from('products').select('*').order('id', { ascending: true }), // Keeps products sorted consistently by ID
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data as Product[]) || [];
      }),
      tap(() => this.loading.set(false)), // Turn off loading state once data is successfully fetched
      catchError((error) => {
        console.error('Supabase Fetching Error:', error);
        this.loading.set(false);
        return of([]); // Returns an empty array to prevent application crash on network error
      }),
      shareReplay(1), // Caches the result to avoid redundant network requests during navigation
    );

    // Connect the cached observable to the UI signal
    this.products = toSignal(this.productsCache$, { initialValue: [] as Product[] });
  }

  /**
   * DERIVED STATE: Categories
   * Dynamically extracts unique categories and counts from the fetched products.
   */
  readonly categories = computed(() => {
    const allProducts = this.products();
    if (!allProducts.length) return [];

    // clean  the extra spaces in category names
    const uniqueCategoryNames = [
      ...new Set(
        allProducts.map((p) => p.category?.trim()).filter((cat): cat is string => !!cat), // filtering null or undefined values
      ),
    ];

    const categoryImages: Record<string, string> = {
      'Mugs & Cups': '/images/Mugs&CupsCat.webp',
      'Serving Plates': '/images/ServingPlatesCat.webp',
      Vases: '/images/VasesCat.webp',
    };

    return uniqueCategoryNames.map((name) => ({
      name,
      // to ensure accuracy in counting products inside category, we trim the category name
      count: allProducts.filter((p) => p.category?.trim() === name).length,
      image: categoryImages[name] || '/images/Mugs&CupsCat.webp',
    }));
  });

  /**
   * Retrieves a single product from the cache to avoid extra API calls.
   */
  getProduct(id: number): Observable<Product | undefined> {
    return this.productsCache$.pipe(map((products) => products.find((p) => p.id === id)));
  }

  /**
   * Filters products by category using the cached stream.
   */
  getProductsByCategory(category: string): Observable<Product[]> {
    return this.productsCache$.pipe(
      map((products) => products.filter((p) => p.category?.trim() === category.trim())),
    );
  }

  /**
   * Reactive Search Logic (Debounced to optimize performance)
   */
  readonly searchQuery: WritableSignal<string> = signal<string>('');

  // Transform signal into observable to apply RxJS operators
  readonly debouncedQuery$ = toObservable(this.searchQuery).pipe(
    debounceTime(300), // Wait for 300ms pause in typing
    distinctUntilChanged(), // Only emit if the search term changed
  );

  // Transform back to signal for template usage
  readonly debouncedSearchQuery = toSignal(this.debouncedQuery$, { initialValue: '' });

  // Computed results based on search input
  readonly searchResults: Signal<Product[]> = computed(() => {
    const query = this.debouncedSearchQuery().toLowerCase().trim();
    if (!query) {
      return [];
    }

    return this.products().filter((product) => product.name.toLowerCase().includes(query));
  });
}
