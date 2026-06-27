import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart-service/cart.service';
import { OrderService, OrderData } from '../../core/services/order-service/order.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent {
  // Services injection using the modern 'inject' function for cleaner DI
  private readonly fb = inject(FormBuilder);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);

  /**
   * UI State Signals
   * We use signals for fine-grained reactivity and better performance.
   */
  readonly orderPlaced = signal(false);
  readonly isSubmitting = signal(false);
  readonly shippingFee = signal(100);

  /**
   * PERSISTENCE BUG FIX:
   * We capture the final total here because 'totalAmount' is a computed signal
   * that resets to 0 when the cart is cleared. This ensures the WhatsApp link
   * remains accurate after the order is finalized.
   */
  readonly capturedTotal = signal(0);

  // Exposing signals from CartService for template binding
  readonly cartItems = this.cartService.items;
  readonly cartTotal = this.cartService.cartTotal;

  /**
   * Reactive Form Configuration
   * 'nonNullable' ensures the form values always fall back to their initial state
   * rather than 'null', providing better type safety throughout the component.
   */
  readonly checkoutForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
    address: ['', [Validators.required]],
    location: [''],
    paymentMethod: ['cash' as 'cash' | 'instapay', [Validators.required]],
  });

  /**
   * Computed logic for the grand total.
   * Business Rule: Shipping is only applied if the cart is not empty.
   */
  readonly totalAmount = computed(() => {
    const subtotal = this.cartTotal();
    return subtotal > 0 ? subtotal + this.shippingFee() : 0;
  });

  constructor() {
    /**
     * RECOVERY LOGIC / NAVIGATION GUARD:
     * We use an effect to reactively monitor the cart state. If the user
     * empties their cart (e.g., via a global drawer) while on the checkout page,
     * we gently redirect them back to the products.
     *
     * Note: 'setTimeout' is used to push the navigation to the next macro-task,
     * preventing 'ExpressionChangedAfterItHasBeenCheckedError' during initialization.
     */
    effect(() => {
      const items = this.cartItems();
      const placed = this.orderPlaced();

      if (items.length === 0 && !placed) {
        setTimeout(() => {
          if (this.cartItems().length === 0 && !this.orderPlaced()) {
            this.router.navigate(['/products']);
          }
        }, 0);
      }
    });
  }

  /**
   * Generates a deep-link for WhatsApp with a pre-filled message.
   * This is used for InstaPay orders where manual screenshot verification is required.
   */
  getWhatsAppLink(): string {
    const formValues = this.checkoutForm.getRawValue();
    const ownerPhoneNumber = '201148483939';

    const message =
      `Hello, I have placed an order via InstaPay.\n\n` +
      `• Name: ${formValues.name}\n` +
      `• Phone: ${formValues.phone}\n` +
      `• Total Amount: ${this.capturedTotal()} EGP\n\n` +
      `Attached is the transfer confirmation screenshot.`;

    return `https://wa.me/${ownerPhoneNumber}?text=${encodeURIComponent(message)}`;
  }

  /**
   * Primary form submission handler.
   * Orchestrates validation, state management, and the external API call.
   */
  handleSubmit(): void {
    // Prevent submission if form is invalid or already processing
    if (this.checkoutForm.invalid || this.isSubmitting()) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    /**
     * Data Mapping: Transforming internal form state into the format
     * expected by the OrderService (Google Apps Script / Sheet).
     */
    const orderData: OrderData = {
      ...this.checkoutForm.getRawValue(),
      total: this.totalAmount(),
      items: this.cartItems()
        .map((item) => `• ${item.product.name} (x${item.quantity})`)
        .join('\n'),
      screenshot: '', // Placeholder for now, verification happens via WhatsApp
    };

    this.orderService.placeOrder(orderData).subscribe({
      next: () => this.handleSuccess(),
      error: (err) => {
        /**
         * SPECIAL CASE HANDLING:
         * Google Apps Script often returns a CORS error or a redirect (302)
         * that the browser treats as a status 0 or 200. If we get here but
         * the status is 'success-like', we proceed with the success flow.
         */
        if (err.status === 200 || err.status === 0) {
          this.handleSuccess();
        } else {
          console.error('Submission failed:', err);
          alert('We encountered an issue placing your order. Please try again or contact support.');
          this.isSubmitting.set(false);
        }
      },
    });
  }

  /**
   * Post-submission success flow.
   * Cleans up local state and sets up the redirection timer.
   */
  private handleSuccess(): void {
    // 1. Capture final state for the summary/WhatsApp
    this.capturedTotal.set(this.totalAmount());

    // 2. Transition UI to success view
    this.orderPlaced.set(true);

    // 3. Purge the cart now that the order is confirmed
    this.cartService.clearCart();
  }
}
