import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormationApiService } from '../../services/formation-api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  identifier: string = ''; // Can be email or matricule
  password: string = '';
  rememberMe: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  loginType: 'email' | 'matricule' = 'email';
  private returnUrl: string = '/dashboard';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formationApi: FormationApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Get return url from route parameters or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Check if already authenticated
    if (localStorage.getItem('isAuthenticated') === 'true') {
      this.router.navigate([this.returnUrl]);
    }
  }

  toggleLoginType() {
    this.loginType = this.loginType === 'email' ? 'matricule' : 'email';
    this.identifier = '';
    this.errorMessage = '';
  }

  onSubmit() {
    if (!this.identifier || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    // Validate based on login type
    if (this.loginType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.identifier)) {
        this.errorMessage = 'Veuillez entrer une adresse email valide';
        return;
      }
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Authenticate against the API using verify endpoint
    const loginObservable = this.loginType === 'email'
      ? this.formationApi.loginApprenant(this.identifier, this.password)
      : this.formationApi.loginApprenantByMatricule(this.identifier, this.password);

    loginObservable.subscribe({
      next: (result) => {
        this.isLoading = false;
        this.cdr.markForCheck();

        if (result.success && result.apprenant) {
          // Cache full user data in localStorage
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userEmail', result.apprenant.email);
          localStorage.setItem('userName', `${result.apprenant.prenom} ${result.apprenant.nom}`);
          localStorage.setItem('userId', String(result.apprenant.id || ''));
          localStorage.setItem('isAdmin', 'false');
          localStorage.setItem('userType', 'apprenant');
          localStorage.setItem('apprenant', JSON.stringify(result.apprenant));
          if (result.apprenant.matricule) {
            localStorage.setItem('userMatricule', result.apprenant.matricule);
          }

          if (this.rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          }

          // Redirect to dashboard
          this.router.navigate([this.returnUrl]);
        } else {
          this.errorMessage = result.error || 'Identifiants incorrects';
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login error:', error);
        this.errorMessage = 'Erreur de connexion au serveur. Veuillez réessayer.';
        this.cdr.markForCheck();
      }
    });
  }
}
