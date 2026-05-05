import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

/** Comment row stored by the Express API. */
export interface AnimeComment {
  id: string;
  animeId: string;
  username: string;
  content: string;
  date: string;
}

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/comments`;

  /** Load every comment for a given MyAnimeList anime id. */
  list(animeId: string | number): Observable<AnimeComment[]> {
    const params = new HttpParams().set('animeId', String(animeId));
    return this.http.get<AnimeComment[]>(this.base, { params });
  }

  /** Create a new comment for an anime detail page. */
  create(animeId: string | number, username: string, content: string): Observable<AnimeComment> {
    return this.http.post<AnimeComment>(this.base, {
      animeId: String(animeId),
      username,
      content,
    });
  }

  /** Update comment text after inline edit. */
  update(commentId: string, content: string): Observable<AnimeComment> {
    return this.http.put<AnimeComment>(`${this.base}/${encodeURIComponent(commentId)}`, {
      content,
    });
  }

  delete(commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${encodeURIComponent(commentId)}`);
  }
}
