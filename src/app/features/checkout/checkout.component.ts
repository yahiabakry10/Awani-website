import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart-service/cart.service';
import { OrderService, OrderData } from '../../core/services/order-service/order.service';
import { CommonModule, DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  readonly orderPlaced = signal(false);
  readonly isSubmitting = signal(false);
  readonly shippingFee = signal(100);

  readonly capturedTotal = signal(0);

  readonly cartItems = this.cartService.items;
  readonly cartTotal = this.cartService.cartTotal;

  readonly checkoutForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: [
      '',
      [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/)],
    ],
    phone: ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
    address: ['', [Validators.required]],
    paymentMethod: ['cash' as 'cash' | 'instapay', [Validators.required]],
  });

  readonly totalAmount = computed(() => {
    const subtotal = this.cartTotal();
    return subtotal > 0 ? subtotal + this.shippingFee() : 0;
  });

  constructor() {
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

  getWhatsAppLink(): string {
    const formValues = this.checkoutForm.getRawValue();
    const ownerPhoneNumber = '201148483939';

    const message =
      `Hello, I have placed an order via InstaPay.\n\n` +
      `\u2022 Name: ${formValues.name}\n` +
      `\u2022 Phone: ${formValues.phone}\n` +
      `\u2022 Total Amount: ${this.capturedTotal()} EGP\n\n` +
      `Attached is the transfer confirmation screenshot.`;

    return `https://wa.me/${ownerPhoneNumber}?text=${encodeURIComponent(message)}`;
  }

  handleSubmit(): void {
    if (this.checkoutForm.invalid || this.isSubmitting()) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const orderData: OrderData = {
      ...this.checkoutForm.getRawValue(),
      total: this.totalAmount(),
      items: this.cartItems()
        .map((item) => `\u2022 ${item.product.name} (x${item.quantity})`)
        .join('\n'),
      screenshot: '',
    };

    this.orderService.placeOrder(orderData).subscribe({
      next: () => this.handleSuccess(),
      error: (err) => {
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

  private handleSuccess(): void {
    this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
    this.capturedTotal.set(this.totalAmount());
    this.orderPlaced.set(true);
    this.cartService.clearCart();
  }
}
