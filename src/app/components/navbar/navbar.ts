import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Sticky top navigation for Ani-Verse routes. */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent {}
