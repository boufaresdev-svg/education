import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormationApiService, CreateApprenantRequest } from '../../services/formation-api.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  // Form fields
  nom: string = '';
  prenom: string = '';
  email: string = '';
  telephone: string = '';
  password: string = '';
  confirmPassword: string = '';
  agreeTerms: boolean = false;

  // UI state
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private router: Router,
    private formationApi: FormationApiService
  ) {}

  onSubmit() {
    // Validate required fields
    if (!this.nom || !this.prenom || !this.email || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    // Validate terms acceptance
    if (!this.agreeTerms) {
      this.errorMessage = 'Veuillez accepter les conditions d\'utilisation';
      return;
    }

    // Validate password match
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }

    // Validate password strength
    if (this.password.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Veuillez entrer une adresse email valide';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // First check if email already exists
    this.formationApi.getApprenantByEmail(this.email).subscribe({
      next: (existingApprenant) => {
        if (existingApprenant) {
          this.isLoading = false;
          this.errorMessage = 'Cette adresse email est déjà utilisée';
          return;
        }

        // Create the apprenant
        const apprenantData: CreateApprenantRequest = {
          nom: this.nom,
          prenom: this.prenom,
          email: this.email,
          motDePasse: this.password,
          telephone: this.telephone || undefined
        };

        this.formationApi.createApprenant(apprenantData).subscribe({
          next: (createdApprenant) => {
            this.isLoading = false;
            this.successMessage = 'Inscription réussie ! Redirection...';

            // Store authentication state
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userEmail', this.email);
            localStorage.setItem('userName', `${this.prenom} ${this.nom}`);
            localStorage.setItem('userId', String(createdApprenant.idApprenant || createdApprenant.id || ''));
            localStorage.setItem('isAdmin', 'false');
            localStorage.setItem('userType', 'apprenant');

            // Redirect to dashboard after a short delay
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 1500);
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Signup error:', error);

            if (error.status === 409) {
              this.errorMessage = 'Cette adresse email est déjà utilisée';
            } else if (error.status === 400) {
              this.errorMessage = 'Données invalides. Veuillez vérifier vos informations.';
            } else {
              this.errorMessage = 'Erreur lors de l\'inscription. Veuillez réessayer.';
            }
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error checking email:', error);
        this.errorMessage = 'Erreur de connexion au serveur. Veuillez réessayer.';
      }
    });
  }
}
