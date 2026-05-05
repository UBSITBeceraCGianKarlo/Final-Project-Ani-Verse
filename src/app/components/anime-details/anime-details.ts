import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { AnimeCommentsComponent } from '../comments/comment.component';
import { AnimeService, type JikanAnimeFull } from '../../services/anime.service';
import { BookmarkService } from '../../services/bookmark.service';

@Component({
  selector: 'app-anime-details-page',
  imports: [RouterLink, AnimeCommentsComponent],
  templateUrl: './anime-details.html',
  styleUrl: './anime-details.css',
})
/** Detail page hydrated from `/anime/:id`, including bookmark + comments CRUD panel. */
export class AnimeDetailsPageComponent {
  private readonly animeSvc = inject(AnimeService);
  private readonly bookmarks = inject(BookmarkService);
  private readonly route = inject(ActivatedRoute);

  /** Stable string id for `[animeId]` binding — MyAnimeList ids fit JS numbers but we keep strings for URLs. */
  readonly routeAnimeId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: '' },
  );

  readonly anime = signal<JikanAnimeFull | null>(null);
  readonly loading = signal(true);
  readonly missing = signal(false);

  constructor() {
    this.bookmarks.loadAll().subscribe();
    this.route.paramMap.subscribe((params) => {
      const rawId = params.get('id');
      const malIdNum = Number(rawId ?? '');
      this.loading.set(true);
      this.missing.set(false);
      this.anime.set(null);

      if (!rawId || Number.isNaN(malIdNum)) {
        this.loading.set(false);
        this.missing.set(true);
        return;
      }

      this.animeSvc.getAnimeById(malIdNum).subscribe((row) => {
        if (!row) this.missing.set(true);
        this.anime.set(row);
        this.loading.set(false);
      });
    });
  }

  poster(a: JikanAnimeFull): string {
    return a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || '';
  }

  displayTitle(a: JikanAnimeFull): string {
    return a.title || a.title_english || `#${a.mal_id}`;
  }

  toggleBookmark(a: JikanAnimeFull): void {
    if (this.bookmarks.isBookmarked(a.mal_id)) return;
    this.bookmarks
      .add({
        animeId: String(a.mal_id),
        title: this.displayTitle(a),
        image: this.poster(a),
      })
      .subscribe({
        error: () => alert('Bookmarks API unavailable. Run npm run server.'),
      });
  }

  isBookmarked(a: JikanAnimeFull): boolean {
    return this.bookmarks.isBookmarked(a.mal_id);
  }
}
