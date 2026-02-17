import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isAuthenticated = false;
  private storageListener?: () => void;

  constructor(private router: Router) {}

  ngOnInit() {
    // Check initial authentication state
    this.checkAuthState();

    // Listen for storage changes (when user logs in/out in another tab)
    this.storageListener = () => this.checkAuthState();
    window.addEventListener('storage', this.storageListener);

    // Also check periodically for auth state changes in same tab
    setInterval(() => this.checkAuthState(), 1000);
  }

  ngOnDestroy() {
    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener);
    }
  }

  private checkAuthState() {
    this.isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  logout() {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('rememberMe');
    this.isAuthenticated = false;
    this.closeMenu();
    this.router.navigate(['/']);
  }
}
