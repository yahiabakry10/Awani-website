import { isPlatformBrowser } from '@angular/common';
import {
  Directive,
  ElementRef,
  OnInit,
  NgZone,
  OnDestroy,
  inject,
  input,
  PLATFORM_ID,
} from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  // Safe Signal inputs
  delay = input<number>(0);

  // Functional Injector Architecture
  private readonly elRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);
  private observer?: IntersectionObserver;
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const nativeElement = this.elRef.nativeElement as HTMLElement;

    // Apply baseline unrevealed styling setup
    nativeElement.classList.add('reveal-init');

    // Run completely outside of Angular's cycle engine to avoid layout performance penalties
    this.ngZone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            this.ngZone.run(() => {
              // Apply delay calculation perfectly tailored per component element loop index
              setTimeout(() => {
                nativeElement.classList.add('reveal-visible');
              }, this.delay());

              this.disconnect();
            });
          }
        },
        {
          threshold: 0.05, // Triggers immediately as the header cap hits the user's focus view boundary
          rootMargin: '0px 0px -40px 0px',
        },
      );

      this.observer.observe(nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
  }
}
