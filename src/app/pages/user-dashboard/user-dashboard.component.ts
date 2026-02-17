import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormationApiService, Classe, Apprenant } from '../../services/formation-api.service';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

interface EnrolledCourse {
  classeId: number;
  classeName: string;
  classeCode: string;
  formationId: number | null;
  formationTitle: string;
  formationDescription: string;
  formationImage: string;
  isActive: boolean;
  nombreInscrits: number;
  planFormation?: { id: number; nom: string };
}

interface Certificate {
  id: number;
  courseName: string;
  issueDate: string;
  certificateId: string;
  status: 'completed' | 'in-progress';
  downloadUrl?: string;
}

interface UserProfile {
  name: string;
  email: string;
  matricule: string;
  memberSince: string;
  totalClasses: number;
  avatar: string;
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent implements OnInit {
  activeTab: string = 'courses';
  isLoading: boolean = true;
  errorMessage: string = '';

  userProfile: UserProfile = {
    name: '',
    email: '',
    matricule: '',
    memberSince: '',
    totalClasses: 0,
    avatar: ''
  };

  enrolledCourses: EnrolledCourse[] = [];
  certificates: Certificate[] = [];

  constructor(
    private formationApi: FormationApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Load user data from localStorage
    const userName = localStorage.getItem('userName') || '';
    const userEmail = localStorage.getItem('userEmail') || '';
    const userMatricule = localStorage.getItem('userMatricule') || '';
    const userId = localStorage.getItem('userId');
    const apprenantData = localStorage.getItem('apprenant');

    this.userProfile.name = userName;
    this.userProfile.email = userEmail;
    this.userProfile.matricule = userMatricule;
    this.userProfile.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0066cc&color=fff&size=200`;

    if (apprenantData) {
      try {
        const apprenant: Apprenant = JSON.parse(apprenantData);
        if (apprenant.dateInscription || apprenant.createdAt) {
          const date = new Date(apprenant.dateInscription || apprenant.createdAt || '');
          this.userProfile.memberSince = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        }
      } catch (e) {}
    }

    // Fetch enrolled classes
    if (userId) {
      this.loadEnrolledCourses(Number(userId));
    } else {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  loadEnrolledCourses(apprenantId: number) {
    this.isLoading = true;
    this.formationApi.getApprenantClasses(apprenantId).pipe(
      switchMap(response => {
        this.userProfile.totalClasses = response.totalClasses;

        if (!response.classes || response.classes.length === 0) {
          return of([]);
        }

        // For each class that has a formation, fetch formation details
        const formationRequests = response.classes.map(classe => {
          if (classe.formation && classe.formation.id) {
            return this.formationApi.getFormationById(classe.formation.id).pipe(
              catchError(() => of(null))
            );
          }
          return of(null);
        });

        return forkJoin(formationRequests).pipe(
          catchError(() => of(response.classes.map(() => null))),
          switchMap(formations => {
            const courses: EnrolledCourse[] = response.classes.map((classe, index) => {
              const formation = formations[index];
              // Handle nested array response [[{...}]]
              const formationData = Array.isArray(formation)
                ? (Array.isArray(formation[0]) ? formation[0][0] : formation[0])
                : formation;

              return {
                classeId: classe.id,
                classeName: classe.nom,
                classeCode: classe.code,
                formationId: formationData?.idFormation || classe.formation?.id || null,
                formationTitle: formationData?.theme || formationData?.titreFormation || classe.formation?.nom || classe.nom,
                formationDescription: formationData?.descriptionTheme || formationData?.descriptionFormation || classe.description || '',
                formationImage: this.getFormationImage(formationData?.theme || classe.formation?.nom || classe.nom),
                isActive: classe.isActive ?? true,
                nombreInscrits: classe.nombreInscrits ?? 0,
                planFormation: (classe as any).planFormation || undefined
              };
            });
            return of(courses);
          })
        );
      })
    ).subscribe({
      next: (courses) => {
        this.enrolledCourses = courses;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading enrolled courses:', error);
        this.errorMessage = 'Erreur lors du chargement de vos cours';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getFormationImage(title: string): string {
    // Generate a relevant image based on formation title keywords
    const lower = title?.toLowerCase() || '';
    if (lower.includes('automat')) return 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop';
    if (lower.includes('supervis') || lower.includes('scada')) return 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop';
    if (lower.includes('mainten')) return 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=400&fit=crop';
    if (lower.includes('thermo') || lower.includes('plastiq')) return 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&h=400&fit=crop';
    if (lower.includes('iot') || lower.includes('4.0')) return 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=800&h=400&fit=crop';
    if (lower.includes('pasteur') || lower.includes('aliment')) return 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=400&fit=crop';
    if (lower.includes('securit') || lower.includes('sécurit')) return 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop';
    return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop';
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  openCourse(course: EnrolledCourse) {
    if (course.formationId) {
      this.router.navigate(['/course', course.formationId]);
    }
  }

  downloadCertificate(certificate: Certificate) {
    if (certificate.downloadUrl) {
      alert(`Téléchargement du certificat ${certificate.certificateId}`);
    }
  }
}
