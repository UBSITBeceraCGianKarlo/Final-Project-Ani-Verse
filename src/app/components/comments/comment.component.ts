import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CommentService, type AnimeComment } from '../../services/comment.service';

@Component({
  selector: 'app-anime-comments',
  imports: [FormsModule],
  templateUrl: './comment.component.html',
  styleUrl: './comment.component.css',
})
/**
 * Scoped CRUD surface for anime notes (backed by the Express `/comments` endpoints).
 */
export class AnimeCommentsComponent {
  private readonly svc = inject(CommentService);

  /** Passed from `/anime/:id` so this widget stays route-agnostic. */
  animeId = input.required<string>();

  readonly comments = signal<AnimeComment[]>([]);
  readonly loading = signal(false);
  readonly apiDown = signal(false);

  draftUser = '';
  draftBody = '';

  readonly editingId = signal<string | null>(null);
  editDraft = '';

  constructor() {
    /** Refetch comments whenever the bound id changes; abort previous HTTP work on cleanup. */
    effect((onCleanup) => {
      const id = this.animeId();
      if (!id) return;

      this.loading.set(true);
      this.apiDown.set(false);

      const sub = this.svc.list(id).subscribe({
        next: (rows) => {
          this.comments.set(rows);
          this.loading.set(false);
        },
        error: () => {
          this.comments.set([]);
          this.apiDown.set(true);
          this.loading.set(false);
        },
      });

      onCleanup(() => sub.unsubscribe());
    });
  }

  submit(): void {
    const username = this.draftUser.trim();
    const content = this.draftBody.trim();
    const id = this.animeId();
    if (!username || !content || !id) return;

    this.svc.create(id, username, content).subscribe({
      next: (row) => {
        this.comments.update((curr) => [row, ...curr]);
        this.draftBody = '';
      },
      error: () => alert('Posting failed — verify the Express API (`npm run server`).'),
    });
  }

  startEdit(c: AnimeComment): void {
    this.editingId.set(c.id);
    this.editDraft = c.content;
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editDraft = '';
  }

  saveEdit(id: string): void {
    const content = this.editDraft.trim();
    if (!content) return;
    this.svc.update(id, content).subscribe({
      next: (updated) => {
        this.comments.update((curr) =>
          curr.map((row) => (row.id === updated.id ? { ...updated } : row)),
        );
        this.cancelEdit();
      },
      error: () => alert('Update failed.'),
    });
  }

  remove(id: string): void {
    if (!confirm('Delete this comment?')) return;
    this.svc.delete(id).subscribe({
      next: () => this.comments.update((curr) => curr.filter((row) => row.id !== id)),
      error: () => alert('Delete failed.'),
    });
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
  }
}
