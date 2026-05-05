import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AnimeService, type JikanAnimeBrief } from '../../services/anime.service';
import { BookmarkService } from '../../services/bookmark.service';

@Component({
  selector: 'app-anime-list-page',
  imports: [RouterLink, FormsModule],
  templateUrl: './anime-list.html',
  styleUrl: './anime-list.css',
})
/** Anime catalog grid with genre filter, server-side-ish search via Jikan, and pagination. */
export class AnimeListPageComponent {
  private readonly anime = inject(AnimeService);
  readonly bookmarksApi = inject(BookmarkService);

  readonly genreOptions = toSignal(this.anime.getAnimeGenres(), {
    initialValue: [] as { mal_id: number; name: string }[],
  });
  readonly items = signal<JikanAnimeBrief[]>([]);
  readonly loading = signal(true);
  readonly errorHint = signal<string | null>(null);

  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly hasNext = signal(false);
  /** Dropdown uses string `<option>` values — empty string means “All genres”. */
  genreMalIdSelection = '';
  /** Bound to template input; applied on Apply / Enter via `applySearch()` */
  searchDraft = '';

  readonly limit = 24;

  constructor() {
    /** Warm bookmark IDs so hearts reflect saved state immediately. */
    this.bookmarksApi.loadAll().subscribe();
    this.load();
  }

  poster(a: JikanAnimeBrief): string {
    return a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || '';
  }

  titleOf(a: JikanAnimeBrief): string {
    return a.title || (a.title_english ?? '') || `#${a.mal_id}`;
  }

  toggleBookmark(anime: JikanAnimeBrief, evt: MouseEvent): void {
    evt.preventDefault();
    evt.stopPropagation();
    if (this.bookmarksApi.isBookmarked(anime.mal_id)) return;
    this.bookmarksApi
      .add({
        animeId: String(anime.mal_id),
        title: this.titleOf(anime),
        image: this.poster(anime),
      })
      .subscribe({
        error: () => alert('Bookmarks API unavailable. Run npm run server in another terminal.'),
      });
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  prevPage(): void {
    const p = this.page();
    if (p <= 1) return;
    this.page.set(p - 1);
    this.load();
  }

  nextPage(): void {
    if (!this.hasNext()) return;
    this.page.update((p) => p + 1);
    this.load();
  }

  private appliedQuery = '';

  applySearch(): void {
    this.appliedQuery = (this.searchDraft || '').trim();
    this.page.set(1);
    this.load();
  }

  /** Internal fetch assembling Jikan query params including optional genre + q. */
  private load(): void {
    this.loading.set(true);
    this.errorHint.set(null);
    const sel = this.genreMalIdSelection.trim();
    const gid = sel === '' ? null : Number(sel);
    this.anime
      .getAnimePage({
        page: this.page(),
        limit: this.limit,
        genreMalId: gid != null && !Number.isNaN(gid) ? gid : null,
        query: this.appliedQuery,
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.data ?? []);
          const pag = res.pagination;
          if (pag) {
            this.hasNext.set(Boolean(pag.has_next_page));
            this.totalPages.set(Math.max(pag.last_visible_page, pag.current_page));
          }
          if (!(res.data?.length)) {
            this.errorHint.set('No results. Try clearing filters — Jikan rate limits sometimes return empty payloads.');
          }
          this.loading.set(false);
        },
        error: () => {
          this.items.set([]);
          this.errorHint.set('Network error while fetching anime.');
          this.loading.set(false);
        },
      });
  }

  bookmarked(anime: JikanAnimeBrief): boolean {
    return this.bookmarksApi.isBookmarked(anime.mal_id);
  }
}
