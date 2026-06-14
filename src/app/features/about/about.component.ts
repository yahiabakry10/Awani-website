import { Component, signal, WritableSignal } from '@angular/core';

@Component({
  selector: 'app-about',
  imports: [],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutComponent {
  galleryImages: WritableSignal<string[]> = signal<string[]>([
    'https://images.unsplash.com/photo-1772485718354-6966d953be57?w=400',
    'https://images.unsplash.com/photo-1695740633675-d060b607f5c4?w=400',
    'https://images.unsplash.com/photo-1629380321590-3b3f75d66dec?w=400',
    'https://images.unsplash.com/photo-1699371830460-62f0c16ebdea?w=400',
    'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?w=400',
    'https://images.unsplash.com/photo-1695740639466-7baecca4224d?w=400',
  ]);
}
