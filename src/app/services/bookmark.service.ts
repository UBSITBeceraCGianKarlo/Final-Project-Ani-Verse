import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { catchError, of, tap } from 'rxjs';

import { environment } from '../../environments/environment';

/** Bookmark persisted on the backend. */
export interface AnimeBookmark {
  id: string;
  animeId: string;
  title: string;
  image: string;
}

@Injectable({
  providedIn: 'root',
})
export class BookmarkService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/bookmarks`;

  /** Client-side snapshot for quick lookups (bookmark button state). */
  readonly bookmarkIds = signal<Set<number>>(new Set());

  refreshIdsFromList(rows: AnimeBookmark[]): void {
    const next = new Set<number>();
    for (const row of rows) {
      const n = Number(row.animeId);
      if (!Number.isNaN(n)) next.add(n);
    }
    this.bookmarkIds.set(next);
  }

  loadAll(): Observable<AnimeBookmark[]> {
    return this.http.get<AnimeBookmark[]>(this.base).pipe(
      tap((rows) => this.refreshIdsFromList(rows)),
      catchError(() => of([])),
    );
  }

  isBookmarked(malId: number): boolean {
    return this.bookmarkIds().has(malId);
  }

  /** Save a favorite; backend rejects duplicates per anime id. */
  add(entry: Pick<AnimeBookmark, 'animeId' | 'title' | 'image'>): Observable<AnimeBookmark> {
    return this.http.post<AnimeBookmark>(this.base, entry).pipe(
      tap(() => {
        const n = Number(entry.animeId);
        if (!Number.isNaN(n)) this.bookmarkIds.update((s) => new Set([...s, n]));
      }),
    );
  }

  /** Remove bookmark by backend row id (not mal_id). */
  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${encodeURIComponent(id)}`).pipe(
      tap(() => {
        /** Caller should refresh ids or reload list — optional full refresh on bookmarks page */
      }),
    );
  }
}
