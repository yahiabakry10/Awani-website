import {
  Component,
  computed,
  inject,
  OnInit,
  OnDestroy,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { ProductsService } from '../../core/services/products-service/products.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductsCardComponent } from '../../shared/components/products-card/products-card.component';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { Product } from '../../core/models/product.model';
import { Subscription } from 'rxjs';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [ProductsCardComponent, ScrollRevealDirective, CurrencyPipe],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent implements OnInit, OnDestroy {
  /**
   * INJECTION: Leveraging 'inject' for cleaner dependency management.
   */
  private readonly productsService = inject(ProductsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private queryParamsSub!: Subscription;

  // mobile drawer
  readonly showMobileFilters: WritableSignal<boolean> = signal<boolean>(false);

  /**
   * Loading state
   */
  readonly isLoading = this.productsService.loading;

  /**
   * Pagination Logic
   * This component acts as a high-level container for the product catalog.
   * Get all products from products service
   */
  readonly allProducts = this.productsService.products;
  readonly categories = this.productsService.categories; // get categories from products service

  /* Pagination settings */
  readonly selectedCategory: WritableSignal<string> = signal<string>('ALL'); // default selected category
  readonly currentPage: WritableSignal<number> = signal<number>(1); // current active page
  readonly itemsPerPage: WritableSignal<number> = signal<number>(12); // max products per page
  readonly isFiltering: WritableSignal<boolean> = signal<boolean>(false);

  /**
   * Settings for price and sort
   */
  readonly minPrice: WritableSignal<number> = signal<number>(0);

  /* Get absolute max price - used to set the max value of the price slider */
  readonly absoluteMaxPrice: Signal<number> = computed(() => {
    const products = this.allProducts();
    const category = this.selectedCategory();

    if (products.length === 0) return 1500; // default value if data is still loading

    const currentCategoryProducts =
      category === 'ALL'
        ? products
        : products.filter((p) => p.category?.trim() === category.trim());

    if (currentCategoryProducts.length === 0) return 1500; // default value if data is still loading

    return Math.max(...currentCategoryProducts.map((p) => p.price));
  });

  readonly maxPrice: WritableSignal<number> = signal<number>(2000); // setting high initial value to make sure all products are shown initially
  readonly sortBy: WritableSignal<string> = signal<string>('default');
  readonly navbarSearchQuery = this.productsService.debouncedSearchQuery;

  /**
   * Filtering products by category
   * Advanced filtering: A computed signal that filters products based on category, search, min price, max price and sort.
   */
  readonly filteredProducts: Signal<Product[]> = computed(() => {
    let products = this.allProducts();
    const category = this.selectedCategory();
    const min = this.minPrice();
    const max = this.maxPrice();
    const sortOption = this.sortBy();
    const searchStr = this.navbarSearchQuery().toLowerCase().trim();

    if (category !== 'ALL') {
      products = products.filter((p) => p.category?.trim() === category.trim());
    }

    // filter by search
    if (searchStr) {
      products = products.filter((p) => p.name.toLowerCase().includes(searchStr));
    }

    // filter by price
    products = products.filter((p) => p.price >= min && p.price <= max);

    // sorting products
    products = [...products];
    if (sortOption === 'priceLowHigh') {
      products.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'priceHighLow') {
      products.sort((a, b) => b.price - a.price);
    }

    return products;
  });

  /* Compute paginated products */
  readonly paginatedProducts: Signal<Product[]> = computed(() => {
    const products = this.filteredProducts();
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    const endIndex = startIndex + this.itemsPerPage();
    return products.slice(startIndex, endIndex);
  });

  /* Get Total pages */
  readonly totalPages: Signal<number> = computed(() => {
    return Math.ceil(this.filteredProducts().length / this.itemsPerPage());
  });

  /* Get page numbers */
  readonly pageNumbers: Signal<number[]> = computed(() => {
    const pages = this.totalPages();
    return Array.from({ length: pages }, (_, i) => i + 1); // create array of page numbers starting from 1 to 4
  });

  ngOnInit(): void {
    this.queryParamsSub = this.route.queryParams.subscribe((params) => {
      const category = params['category'] || 'ALL';
      this.selectedCategory.set(category);
      this.currentPage.set(1);

      this.isFiltering.set(true);
      setTimeout(() => {
        this.isFiltering.set(false);
      }, 0);
    });
  }

  /* Select Category function */
  changeCategory(category: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: category === 'ALL' ? null : category },
      queryParamsHandling: 'merge',
    });
  }

  /* Create function to handle page change when user click on page number */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.scrollToTop();
    }
  }

  /* Create function to go to next page */
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((page) => page + 1);
      this.scrollToTop();
    }
  }

  /* Create function to go to previous page */
  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((page) => page - 1);
      this.scrollToTop();
    }
  }

  /**
   * Scroll to top of the page when page is changed
   */
  scrollToTop(): void {
    window.scrollTo({ top: 250, behavior: 'smooth' });
  }

  /**
   * Getting start and end index
   */
  readonly startIndex = computed(() => {
    return (this.currentPage() - 1) * this.itemsPerPage() + 1;
  });

  readonly endIndex = computed(() => {
    return Math.min(this.currentPage() * this.itemsPerPage(), this.filteredProducts().length);
  });

  /**
   * Handling price change slider
   */
  onPriceChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement) {
      this.maxPrice.set(Number(inputElement.value)); // converting event value from string into number
      this.currentPage.set(1);
    }
  }

  /* Unsubscribe from the query params subscription */
  ngOnDestroy(): void {
    if (this.queryParamsSub) {
      this.queryParamsSub.unsubscribe();
    }
  }
}
