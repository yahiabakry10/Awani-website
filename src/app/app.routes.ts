import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then((c) => c.HomeComponent),
    title: 'Awani - Home',
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./features/products/products.component').then((c) => c.ProductsComponent),
    title: 'Awani - Products',
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./features/product-details/product-details.component').then(
        (c) => c.ProductDetailsComponent,
      ),
    title: 'Product Details - Awani',
  },

  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component').then((c) => c.AboutComponent),
    title: 'About Awani',
  },
  {
    path: 'policies',
    loadComponent: () =>
      import('./features/policies/policies.component').then((c) => c.PoliciesComponent),
    title: 'Policies',
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/checkout/checkout.component').then((c) => c.CheckoutComponent),
    title: 'Checkout - Awani',
  },
  {
    path: 'wishlist',
    loadComponent: () =>
      import('./features/wishlist/wishlist.component').then((c) => c.WishlistComponent),
    title: 'Wishlist - Awani',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((c) => c.NotFoundComponent),
    title: '404 - Not Found',
  },
];
