import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { catchError, map, of } from 'rxjs';

/** Base URL for the public Jikan v4 REST API (MyAnimeList data). */
const JIKAN = 'https://api.jikan.moe/v4';

/** Minimal shapes we read from Jikan JSON (see https://docs.api.jikan.moe/). */

export interface JikanGenreEntry {
  mal_id: number;
  name: string;
}

export interface JikanAnimeBrief {
  mal_id: number;
  title?: string;
  title_english?: string | null;
  images?: {
    jpg?: { image_url?: string; large_image_url?: string };
    webp?: { image_url?: string; large_image_url?: string };
  };
  score?: number | null;
  genres?: { mal_id: number; name: string }[];
}

export interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
  items?: { count: number; total: number; per_page: number };
}

export interface JikanAnimeListResponse {
  data: JikanAnimeBrief[];
  pagination: JikanPagination;
}

export interface JikanAnimeFull extends JikanAnimeBrief {
  synopsis?: string | null;
  episodes?: number | null;
  rating?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AnimeService {
  private readonly http = inject(HttpClient);

  /** Featured titles for the home hero (top airing / popular list). */
  getTopAnime(limit = 5): Observable<JikanAnimeBrief[]> {
    const params = new HttpParams().set('limit', String(limit)).set('filter', 'bypopularity');
    return this.http.get<{ data: JikanAnimeBrief[] }>(`${JIKAN}/top/anime`, { params }).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([])),
    );
  }

  /** All anime genres for filter dropdowns. */
  getAnimeGenres(): Observable<JikanGenreEntry[]> {
    return this.http.get<{ data: JikanGenreEntry[] }>(`${JIKAN}/genres/anime`).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([])),
    );
  }

  /**
   * Paginated anime catalog with optional genre + title search.
   * Jikan accepts `q` (search) and `genres` (MAL id) query params.
   */
  getAnimePage(options: {
    page?: number;
    limit?: number;
    genreMalId?: number | null;
    query?: string;
  }): Observable<JikanAnimeListResponse> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 24;
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit)).set('order_by', 'popularity');
    const q = (options.query ?? '').trim();
    if (q) params = params.set('q', q);
    const gid = options.genreMalId;
    if (gid != null && gid > 0) params = params.set('genres', String(gid));

    return this.http.get<JikanAnimeListResponse>(`${JIKAN}/anime`, { params }).pipe(
      catchError(() =>
        of({
          data: [],
          pagination: {
            last_visible_page: 1,
            has_next_page: false,
            current_page: page,
          },
        }),
      ),
    );
  }

  /** Single anime for the details route. */
  getAnimeById(id: number | string): Observable<JikanAnimeFull | null> {
    return this.http.get<{ data: JikanAnimeFull }>(`${JIKAN}/anime/${encodeURIComponent(String(id))}`).pipe(
      map((res) => res.data ?? null),
      catchError(() => of(null)),
    );
  }
}
