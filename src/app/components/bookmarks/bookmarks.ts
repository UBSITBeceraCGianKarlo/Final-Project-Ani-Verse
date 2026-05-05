import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { AnimeBookmark } from '../../services/bookmark.service';
import { BookmarkService } from '../../services/bookmark.service';

@Component({
  selector: 'app-bookmarks-page',
  imports: [RouterLink],
  templateUrl: './bookmarks.html',
  styleUrl: './bookmarks.css',
})
/** Read-only mosaic of saved bookmarks with delete wired to DELETE /bookmarks/:id. */
export class BookmarksPageComponent {
  private readonly bookmarks = inject(BookmarkService);

  readonly rows = signal<AnimeBookmark[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.bookmarks.loadAll().subscribe({
      next: (list) => {
        this.rows.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.loading.set(false);
      },
    });
  }

  deleteRow(id: string): void {
    if (!confirm('Remove this bookmark?')) return;
    this.bookmarks.remove(id).subscribe({
      next: () => this.refresh(),
      error: () => alert('Delete failed — is the Node API running?'),
    });
  }
}
