import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EMPTY, timer } from 'rxjs';
import { map } from 'rxjs/operators';

interface HeroSlide {
  url: string;
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-hero',
  imports: [RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent {
  private platformId = inject(PLATFORM_ID);

  readonly SLIDE_DURATION = 5000;

  readonly heroImages = signal<HeroSlide[]>([
    {
      url: '/images/Hero-1.webp',
      title: 'Elevate Your Living Space',
      subtitle: 'New Autumn Collection',
    },
    {
      url: '/images/Hero-2.webp',
      title: 'Simplicity Meets Comfort',
      subtitle: 'Minimalist Furniture Design',
    },
    {
      url: '/images/Hero-3.webp',
      title: 'Crafted For Modern Homes',
      subtitle: 'Handmade Artifacts & Decor',
    },
  ]);

  readonly currentSlideIndex = toSignal(
    isPlatformBrowser(this.platformId)
      ? timer(this.SLIDE_DURATION, this.SLIDE_DURATION).pipe(
          map((tick) => (tick + 1) % this.heroImages().length),
        )
      : EMPTY, // Much cleaner SSR fallback
    { initialValue: 0 },
  );
}
