import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AnimeService, type JikanAnimeBrief } from '../../services/anime.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
/** Landing page with branding and Top anime strip from Jikan. */
export class HomePageComponent {
  private readonly anime = inject(AnimeService);

  readonly loading = signal(true);
  readonly top = signal<JikanAnimeBrief[]>([]);

  constructor() {
    this.anime.getTopAnime(5).subscribe((rows) => {
      this.top.set(rows);
      this.loading.set(false);
    });
  }

  poster(a: JikanAnimeBrief): string {
    return a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || '';
  }

  titleOf(a: JikanAnimeBrief): string {
    return a.title || a.title_english || `#${a.mal_id}`;
  }
}
