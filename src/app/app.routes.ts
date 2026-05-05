import { Routes } from '@angular/router';

import { AnimeDetailsPageComponent } from './components/anime-details/anime-details';
import { AnimeListPageComponent } from './components/anime-list/anime-list';
import { BookmarksPageComponent } from './components/bookmarks/bookmarks';
import { HomePageComponent } from './components/home/home';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomePageComponent },
  { path: 'anime', component: AnimeListPageComponent },
  { path: 'anime/:id', component: AnimeDetailsPageComponent },
  { path: 'bookmarks', component: BookmarksPageComponent },
  { path: '**', redirectTo: '' },
];
