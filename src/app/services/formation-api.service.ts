import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// API Base URL
const API_BASE_URL = environment.apiUrl;

// Apprenant Interface
export interface Apprenant {
  idApprenant?: number;
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  matricule?: string;
  motDePasse?: string;
  telephone?: string;
  adresse?: string;
  dateNaissance?: string;
  sexe?: string;
  photo?: string;
  dateInscription?: string;
  createdAt?: string;
  statut?: string;
}

export interface CreateApprenantRequest {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  matricule?: string;
  telephone?: string;
  adresse?: string;
  dateNaissance?: string;
  sexe?: string;
}

// Classe Interface
export interface Classe {
  id: number;
  nom: string;
  code: string;
  description?: string;
  capaciteMax?: number;
  isActive?: boolean;
  dateDebutAcces?: string;
  dateFinAcces?: string;
  nombreInscrits?: number;
  formation?: {
    id: number;
    nom: string;
  };
}

// Apprenant Classes Response
export interface ApprenantClassesResponse {
  apprenantId: number;
  totalClasses: number;
  classes: Classe[];
}

// Apprenant Enrollment Check Response
export interface ApprenantEnrollmentResponse {
  apprenantId: number;
  classeId: number;
  enrolled: boolean;
  classe?: {
    nom: string;
    code: string;
    isActive: boolean;
  };
}

// Response Interfaces based on API documentation
export interface FormationResponse {
  idFormation: number;
  titreFormation?: string;
  theme?: string; // Alternative field name
  dureeFormation?: number;
  duree?: number; // Alternative field name
  descriptionFormation?: string;
  descriptionTheme?: string; // Alternative field name
  objectifsFormation?: string;
  prerequisFormation?: string;
  publicCibleFormation?: string;
  prixFormation?: number;
  niveauFormation?: string;
  niveau?: string; // Alternative field name
  idDomaine?: number;
  idFormateur?: number;
  idType?: number;
  idCategorie?: number;
  idSousCategorie?: number;
  nomDomaine?: string;
  nomFormateur?: string;
  prenomFormateur?: string;
  photoFormateur?: string;
  nomType?: string;
  nomCategorie?: string;
  nomSousCategorie?: string;
}

export interface PagedFormationResponse {
  content: FormationResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface FormationStatistics {
  totalFormations: number;
  totalApprenants: number;
  totalCertificats: number;
  averageRating?: number;
}

export interface DomaineResponse {
  idDomaine: number;
  nomDomaine: string;
  descriptionDomaine?: string;
}

export interface TypeResponse {
  idType: number;
  nomType: string;
  descriptionType?: string;
}

export interface CategorieResponse {
  idCategorie: number;
  nomCategorie: string;
  descriptionCategorie?: string;
  idType?: number;
}

export interface SousCategorieResponse {
  idSousCategorie: number;
  nomSousCategorie: string;
  descriptionSousCategorie?: string;
  idCategorie?: number;
}

export interface FormateurResponse {
  idFormateur: number;
  nomFormateur: string;
  prenomFormateur: string;
  emailFormateur?: string;
  telephoneFormateur?: string;
  specialiteFormateur?: string;
  bioFormateur?: string;
  photoFormateur?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FormationApiService {
  private formationsSubject = new BehaviorSubject<FormationResponse[]>([]);
  public formations$ = this.formationsSubject.asObservable();

  private domainesSubject = new BehaviorSubject<DomaineResponse[]>([]);
  public domaines$ = this.domainesSubject.asObservable();

  private typesSubject = new BehaviorSubject<TypeResponse[]>([]);
  public types$ = this.typesSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<CategorieResponse[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  private sousCategoriesSubject = new BehaviorSubject<SousCategorieResponse[]>([]);
  public sousCategories$ = this.sousCategoriesSubject.asObservable();

  private formateursSubject = new BehaviorSubject<FormateurResponse[]>([]);
  public formateurs$ = this.formateursSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    // Load all formations
    this.getAllFormations().subscribe();

    // Load metadata
    this.getAllDomaines().subscribe();
    this.getAllTypes().subscribe();
    this.getAllFormateurs().subscribe();
  }

  // Formations endpoints
  getAllFormations(): Observable<FormationResponse[]> {
    return this.http.get<FormationResponse[]>(`${API_BASE_URL}/formations`).pipe(
      tap(formations => this.formationsSubject.next(formations)),
      catchError(error => {
        console.error('Error fetching formations:', error);
        return of([]);
      })
    );
  }

  getFormationsPaginated(
    page: number = 0,
    size: number = 10,
    sortBy: string = 'idFormation',
    sortDirection: string = 'ASC'
  ): Observable<PagedFormationResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);

    return this.http.get<PagedFormationResponse>(`${API_BASE_URL}/formations/paginated`, { params });
  }

  getFormationById(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/formations/${id}`).pipe(
      catchError(error => {
        console.error('Error fetching formation by ID:', error);
        return of(null);
      })
    );
  }

  getFormationStatistics(): Observable<FormationStatistics> {
    return this.http.get<FormationStatistics>(`${API_BASE_URL}/formations/statistics`);
  }

  // Domaines endpoints
  getAllDomaines(): Observable<DomaineResponse[]> {
    return this.http.get<DomaineResponse[]>(`${API_BASE_URL}/domaines`).pipe(
      tap(domaines => this.domainesSubject.next(domaines)),
      catchError(error => {
        console.error('Error fetching domaines:', error);
        return of([]);
      })
    );
  }

  getDomaineById(id: number): Observable<DomaineResponse> {
    return this.http.get<DomaineResponse>(`${API_BASE_URL}/domaines/${id}`);
  }

  // Types endpoints
  getAllTypes(): Observable<TypeResponse[]> {
    return this.http.get<TypeResponse[]>(`${API_BASE_URL}/types`).pipe(
      tap(types => this.typesSubject.next(types)),
      catchError(error => {
        console.error('Error fetching types:', error);
        return of([]);
      })
    );
  }

  getTypeById(id: number): Observable<TypeResponse> {
    return this.http.get<TypeResponse>(`${API_BASE_URL}/types/${id}`);
  }

  // Categories endpoints
  getAllCategories(): Observable<CategorieResponse[]> {
    return this.http.get<CategorieResponse[]>(`${API_BASE_URL}/categories`).pipe(
      tap(categories => this.categoriesSubject.next(categories)),
      catchError(error => {
        console.error('Error fetching categories:', error);
        return of([]);
      })
    );
  }

  getCategorieById(id: number): Observable<CategorieResponse> {
    return this.http.get<CategorieResponse>(`${API_BASE_URL}/categories/${id}`);
  }

  getCategoriesByType(idType: number): Observable<CategorieResponse[]> {
    return this.http.get<CategorieResponse[]>(`${API_BASE_URL}/categories/by-type/${idType}`);
  }

  // Sous-Categories endpoints
  getAllSousCategories(): Observable<SousCategorieResponse[]> {
    return this.http.get<SousCategorieResponse[]>(`${API_BASE_URL}/souscategories`).pipe(
      tap(sousCategories => this.sousCategoriesSubject.next(sousCategories)),
      catchError(error => {
        console.error('Error fetching sous-categories:', error);
        return of([]);
      })
    );
  }

  getSousCategorieById(id: number): Observable<SousCategorieResponse> {
    return this.http.get<SousCategorieResponse>(`${API_BASE_URL}/souscategories/${id}`);
  }

  getSousCategoriesByCategorie(idCategorie: number): Observable<SousCategorieResponse[]> {
    return this.http.get<SousCategorieResponse[]>(`${API_BASE_URL}/souscategories/by-categorie/${idCategorie}`);
  }

  // Formateurs endpoints
  getAllFormateurs(): Observable<FormateurResponse[]> {
    return this.http.get<FormateurResponse[]>(`${API_BASE_URL}/formateurs`).pipe(
      tap(formateurs => this.formateursSubject.next(formateurs)),
      catchError(error => {
        console.error('Error fetching formateurs:', error);
        return of([]);
      })
    );
  }

  getFormateurById(id: number): Observable<FormateurResponse> {
    return this.http.get<FormateurResponse>(`${API_BASE_URL}/formateurs/${id}`);
  }

  // Content endpoints for course details
  getContenuGlobalByFormation(idFormation: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/contenusglobaux/by-formation/${idFormation}`).pipe(
      catchError(error => {
        console.error('Error fetching global contents:', error);
        return of([]);
      })
    );
  }

  getContenuDetailleByFormation(idFormation: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/contenus-detailles/by-formation/${idFormation}`).pipe(
      catchError(error => {
        console.error('Error fetching detailed contents:', error);
        return of([]);
      })
    );
  }

  getContenuDetailleWithJours(idFormation: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/contenus-detailles/by-formation/${idFormation}/with-jours`).pipe(
      catchError(error => {
        console.error('Error fetching contents with jours:', error);
        return of([]);
      })
    );
  }

  getPlanFormationsByFormation(idFormation: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/planformations/formation/${idFormation}`).pipe(
      catchError(error => {
        console.error('Error fetching plan formations:', error);
        return of([]);
      })
    );
  }

  getObjectifsSpecifiquesByContenu(idContenuGlobal: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/objectifsspecifiques/by-contenu/${idContenuGlobal}`).pipe(
      catchError(error => {
        console.error('Error fetching objectifs spécifiques:', error);
        return of([]);
      })
    );
  }

  getContenuJourByObjectifSpecifique(idObjectifSpecifique: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/contenusjour/objectif/${idObjectifSpecifique}`).pipe(
      catchError(error => {
        console.error('Error fetching contenu jour:', error);
        return of([]);
      })
    );
  }

  getContenuDetailleByJour(idJour: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/contenus-detailles/by-jour/${idJour}`).pipe(
      catchError(error => {
        console.error('Error fetching detailed contents by jour:', error);
        return of([]);
      })
    );
  }

  // ==================== OBJECTIFS GLOBAUX ====================
  getAllObjectifsGlobaux(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/objectifsglobaux`).pipe(
      catchError(error => {
        console.error('Error fetching objectifs globaux:', error);
        return of([]);
      })
    );
  }

  getObjectifGlobalById(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/objectifsglobaux/${id}`);
  }

  getObjectifsGlobauxByFormation(idFormation: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/objectifsglobaux/formation/${idFormation}`).pipe(
      catchError(error => {
        console.error('Error fetching objectifs globaux by formation:', error);
        return of([]);
      })
    );
  }

  searchObjectifsGlobaux(description: string): Observable<any[]> {
    const params = new HttpParams().set('description', description);
    return this.http.get<any[]>(`${API_BASE_URL}/objectifsglobaux/search`, { params });
  }

  getObjectifsGlobauxNotLinked(formationId: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/objectifsglobaux/not-linked/${formationId}`);
  }

  // ==================== OBJECTIFS SPECIFIQUES ====================
  getAllObjectifsSpecifiques(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/objectifsspecifiques`).pipe(
      catchError(error => {
        console.error('Error fetching objectifs spécifiques:', error);
        return of([]);
      })
    );
  }

  getObjectifSpecifiqueById(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/objectifsspecifiques/${id}`);
  }

  searchObjectifsSpecifiques(description: string): Observable<any[]> {
    const params = new HttpParams().set('description', description);
    return this.http.get<any[]>(`${API_BASE_URL}/objectifsspecifiques/search`, { params });
  }

  // ==================== CONTENUS GLOBAUX ====================
  getAllContenusGlobaux(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/contenusglobaux`).pipe(
      catchError(error => {
        console.error('Error fetching contenus globaux:', error);
        return of([]);
      })
    );
  }

  getContenuGlobalById(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/contenusglobaux/${id}`);
  }

  // ==================== CONTENUS JOUR ====================
  getAllContenusJour(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/contenusjour`).pipe(
      catchError(error => {
        console.error('Error fetching contenus jour:', error);
        return of([]);
      })
    );
  }

  getContenuJourById(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/contenusjour/${id}`);
  }

  getContenusJourByObjectif(idObjectifSpec: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/contenusjour/by-objectif/${idObjectifSpec}`).pipe(
      catchError(error => {
        console.error('Error fetching contenus jour by objectif:', error);
        return of([]);
      })
    );
  }

  getAssignedContenus(idContenuJour: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/contenusjour/${idContenuJour}/assigned-contenus`).pipe(
      catchError(error => {
        console.error('Error fetching assigned contenus:', error);
        return of([]);
      })
    );
  }

  searchContenusJour(titre: string): Observable<any[]> {
    const params = new HttpParams().set('titre', titre);
    return this.http.get<any[]>(`${API_BASE_URL}/contenusjour/search`, { params });
  }

  // ==================== CONTENUS DETAILLES ====================
  getAllContenusDetailles(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/contenus-detailles`).pipe(
      catchError(error => {
        console.error('Error fetching contenus detailles:', error);
        return of([]);
      })
    );
  }

  getContenuDetailleById(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/contenus-detailles/${id}`);
  }

  getContenusDetaillesPaginated(
    page: number = 0,
    size: number = 10,
    sortBy: string = 'idContenuDetaille',
    sortDirection: string = 'ASC'
  ): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    return this.http.get<any>(`${API_BASE_URL}/contenus-detailles/paginated`, { params });
  }

  searchContenusDetailles(titre: string): Observable<any[]> {
    const params = new HttpParams().set('titre', titre);
    return this.http.get<any[]>(`${API_BASE_URL}/contenus-detailles/search`, { params });
  }

  // ==================== PLAN FORMATIONS ====================
  getAllPlanFormations(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/planformations`).pipe(
      catchError(error => {
        console.error('Error fetching plan formations:', error);
        return of([]);
      })
    );
  }

  getPlanFormationById(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/planformations/${id}`);
  }

  // ==================== APPRENANTS ====================
  getAllApprenants(): Observable<Apprenant[]> {
    return this.http.get<Apprenant[]>(`${API_BASE_URL}/apprenants`).pipe(
      catchError(error => {
        console.error('Error fetching apprenants:', error);
        return of([]);
      })
    );
  }

  getApprenantById(id: number): Observable<Apprenant> {
    return this.http.get<Apprenant>(`${API_BASE_URL}/apprenants/${id}`);
  }

  getApprenantsByPlanFormation(planFormationId: number): Observable<Apprenant[]> {
    return this.http.get<Apprenant[]>(`${API_BASE_URL}/apprenants/plan/${planFormationId}`).pipe(
      catchError(error => {
        console.error('Error fetching apprenants by plan formation:', error);
        return of([]);
      })
    );
  }

  createApprenant(apprenant: CreateApprenantRequest): Observable<Apprenant> {
    return this.http.post<Apprenant>(`${API_BASE_URL}/apprenants`, apprenant);
  }

  updateApprenant(id: number, apprenant: Partial<CreateApprenantRequest>): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/apprenants/${id}`, apprenant);
  }

  deleteApprenant(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/apprenants/${id}`);
  }

  // Get apprenant's enrolled classes
  getApprenantClasses(apprenantId: number): Observable<ApprenantClassesResponse> {
    return this.http.get<ApprenantClassesResponse>(`${API_BASE_URL}/apprenants/${apprenantId}/classes`).pipe(
      catchError(error => {
        console.error('Error fetching apprenant classes:', error);
        return of({ apprenantId, totalClasses: 0, classes: [] });
      })
    );
  }

  // Check if apprenant is enrolled in a specific class
  checkApprenantEnrollment(apprenantId: number, classeId: number): Observable<ApprenantEnrollmentResponse> {
    return this.http.get<ApprenantEnrollmentResponse>(`${API_BASE_URL}/apprenants/${apprenantId}/enrolled/${classeId}`).pipe(
      catchError(error => {
        console.error('Error checking apprenant enrollment:', error);
        return of({ apprenantId, classeId, enrolled: false });
      })
    );
  }

  // ==================== AUTH / VERIFY ====================

  // Verify apprenant existence by email or matricule using /verify endpoint
  verifyApprenant(params: { email?: string; matricule?: string }): Observable<{ exists: boolean; apprenant?: Apprenant }> {
    let httpParams = new HttpParams();
    if (params.email) {
      httpParams = httpParams.set('email', params.email);
    }
    if (params.matricule) {
      httpParams = httpParams.set('matricule', params.matricule);
    }
    return this.http.get<{ exists: boolean; apprenant?: Apprenant }>(`${API_BASE_URL}/apprenants/verify`, { params: httpParams }).pipe(
      catchError(error => {
        console.error('Error verifying apprenant:', error);
        return of({ exists: false });
      })
    );
  }

  getApprenantByEmail(email: string): Observable<Apprenant | null> {
    return this.verifyApprenant({ email }).pipe(
      map(res => res.exists && res.apprenant ? res.apprenant : null)
    );
  }

  getApprenantByMatricule(matricule: string): Observable<Apprenant | null> {
    return this.verifyApprenant({ matricule }).pipe(
      map(res => res.exists && res.apprenant ? res.apprenant : null)
    );
  }

  // Login by email - verify existence, cache user in localStorage
  loginApprenant(email: string, password: string): Observable<{ success: boolean; apprenant?: Apprenant; error?: string }> {
    return this.verifyApprenant({ email }).pipe(
      map(res => {
        if (res.exists && res.apprenant) {
          return { success: true, apprenant: res.apprenant };
        }
        return { success: false, error: 'Aucun compte trouvé avec cet email' };
      }),
      catchError(error => {
        console.error('Login error:', error);
        return of({ success: false, error: 'Erreur de connexion au serveur' });
      })
    );
  }

  // Login by matricule - verify existence, cache user in localStorage
  loginApprenantByMatricule(matricule: string, password: string): Observable<{ success: boolean; apprenant?: Apprenant; error?: string }> {
    return this.verifyApprenant({ matricule }).pipe(
      map(res => {
        if (res.exists && res.apprenant) {
          return { success: true, apprenant: res.apprenant };
        }
        return { success: false, error: 'Aucun compte trouvé avec ce matricule' };
      }),
      catchError(error => {
        console.error('Login error:', error);
        return of({ success: false, error: 'Erreur de connexion au serveur' });
      })
    );
  }

  // ==================== EXAMENS ====================
  getAllExamens(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/examens`).pipe(
      catchError(error => {
        console.error('Error fetching examens:', error);
        return of([]);
      })
    );
  }

  getExamenById(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/examens/${id}`);
  }

  getExamensByPlanFormation(idPlanFormation: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/examens/plan/${idPlanFormation}`).pipe(
      catchError(error => {
        console.error('Error fetching examens by plan formation:', error);
        return of([]);
      })
    );
  }

  createExamen(examen: any): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/examens`, examen);
  }

  updateExamen(id: number, examen: any): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/examens/${id}`, examen);
  }

  deleteExamen(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/examens/${id}`);
  }

  // ==================== CERTIFICATS ====================
  getAllCertificats(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/certificats`).pipe(
      catchError(error => {
        console.error('Error fetching certificats:', error);
        return of([]);
      })
    );
  }

  getCertificatById(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/certificats/${id}`);
  }

  getCertificatsByExamen(idExamen: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/certificats/by-examen/${idExamen}`).pipe(
      catchError(error => {
        console.error('Error fetching certificats by examen:', error);
        return of([]);
      })
    );
  }

  createCertificat(certificat: any): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/certificats`, certificat);
  }

  deleteCertificat(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/certificats/${id}`);
  }

  // ==================== EVALUATIONS ====================
  getAllEvaluations(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/evaluations`).pipe(
      catchError(error => {
        console.error('Error fetching evaluations:', error);
        return of([]);
      })
    );
  }

  getEvaluationById(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/evaluations/${id}`);
  }

  getEvaluationsByContenuJour(idContenuJour: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/evaluations/contenu/${idContenuJour}`).pipe(
      catchError(error => {
        console.error('Error fetching evaluations by contenu jour:', error);
        return of([]);
      })
    );
  }

  createEvaluation(evaluation: any): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/evaluations`, evaluation);
  }

  updateEvaluation(id: number, evaluation: any): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/evaluations/${id}`, evaluation);
  }

  deleteEvaluation(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/evaluations/${id}`);
  }

  // ==================== FILE UPLOAD ====================
  uploadFileStreaming(file: File): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/streaming-upload/file`, file, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-File-Name': file.name
      }
    });
  }

  uploadFileMultipart(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${API_BASE_URL}/streaming-upload/multipart`, formData);
  }

  getUploadStatus(): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/streaming-upload/status`);
  }

  // Upload file to contenu detaille level
  uploadContenuDetailleFile(
    contenuId: number,
    levelNumber: number,
    file: File
  ): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(
      `${API_BASE_URL}/contenus-detailles/${contenuId}/levels/${levelNumber}/upload`,
      formData
    );
  }

  // Get file from contenu detaille
  getContenuDetailleFileUrl(filename: string): string {
    return `${API_BASE_URL}/contenus-detailles/files/${filename}`;
  }

  // View file (inline) from contenu detaille
  getContenuDetailleViewUrl(filename: string): string {
    return `${API_BASE_URL}/contenus-detailles/view/${filename}`;
  }

  // ==================== FORMATION LINKING ====================
  duplicateFormation(id: number): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/formations/${id}/duplicate`, {});
  }

  linkObjectifGlobalToFormation(formationId: number, objectifGlobalId: number): Observable<void> {
    return this.http.post<void>(
      `${API_BASE_URL}/formations/${formationId}/link-objectif-global/${objectifGlobalId}`,
      {}
    );
  }

  unlinkObjectifGlobalFromFormation(formationId: number, objectifGlobalId: number): Observable<void> {
    return this.http.delete<void>(
      `${API_BASE_URL}/formations/${formationId}/unlink-objectif-global/${objectifGlobalId}`
    );
  }

  linkObjectifSpecifiqueToFormation(formationId: number, objectifSpecifiqueId: number): Observable<void> {
    return this.http.post<void>(
      `${API_BASE_URL}/formations/${formationId}/link-objectif-specifique/${objectifSpecifiqueId}`,
      {}
    );
  }

  unlinkObjectifSpecifiqueFromFormation(formationId: number, objectifSpecifiqueId: number): Observable<void> {
    return this.http.delete<void>(
      `${API_BASE_URL}/formations/${formationId}/unlink-objectif-specifique/${objectifSpecifiqueId}`
    );
  }

  // ==================== CRUD OPERATIONS ====================

  // Create Formation
  createFormation(formation: any): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/formations`, formation);
  }

  // Update Formation
  updateFormation(id: number, formation: any): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/formations/${id}`, formation);
  }

  // Delete Formation
  deleteFormation(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/formations/${id}`);
  }

  // Create Domaine
  createDomaine(domaine: any): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/domaines`, domaine);
  }

  // Update Domaine
  updateDomaine(id: number, domaine: any): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/domaines/${id}`, domaine);
  }

  // Delete Domaine
  deleteDomaine(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/domaines/${id}`);
  }

  // Create Type
  createType(type: any): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/types`, type);
  }

  // Update Type
  updateType(id: number, type: any): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/types/${id}`, type);
  }

  // Delete Type
  deleteType(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/types/${id}`);
  }

  // Create Categorie
  createCategorie(categorie: any): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/categories`, categorie);
  }

  // Update Categorie
  updateCategorie(id: number, categorie: any): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/categories/${id}`, categorie);
  }

  // Delete Categorie
  deleteCategorie(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/categories/${id}`);
  }

  // Create SousCategorie
  createSousCategorie(sousCategorie: any): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/souscategories`, sousCategorie);
  }

  // Update SousCategorie
  updateSousCategorie(id: number, sousCategorie: any): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/souscategories/${id}`, sousCategorie);
  }

  // Delete SousCategorie
  deleteSousCategorie(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/souscategories/${id}`);
  }

  // Create Formateur
  createFormateur(formateur: any): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/formateurs`, formateur);
  }

  // Create Formateur with file (photo)
  createFormateurWithFile(formateur: any, photo?: File): Observable<any> {
    const formData = new FormData();
    formData.append('formateur', new Blob([JSON.stringify(formateur)], { type: 'application/json' }));
    if (photo) {
      formData.append('photo', photo);
    }
    return this.http.post<any>(`${API_BASE_URL}/formateurs`, formData);
  }

  // Update Formateur with file
  updateFormateurWithFile(id: number, formateur: any, photo?: File): Observable<void> {
    const formData = new FormData();
    formData.append('formateur', new Blob([JSON.stringify(formateur)], { type: 'application/json' }));
    if (photo) {
      formData.append('photo', photo);
    }
    return this.http.put<void>(`${API_BASE_URL}/formateurs/${id}/with-file`, formData);
  }

  // Delete Formateur
  deleteFormateur(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/formateurs/${id}`);
  }

  // Create Plan Formation
  createPlanFormation(planFormation: any): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/planformations`, planFormation);
  }

  // Update Plan Formation
  updatePlanFormation(id: number, planFormation: any): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/planformations/${id}`, planFormation);
  }

  // Delete Plan Formation
  deletePlanFormation(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/planformations/${id}`);
  }

  // Create Objectif Global
  createObjectifGlobal(objectif: any): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/objectifsglobaux`, objectif);
  }

  // Update Objectif Global
  updateObjectifGlobal(id: number, objectif: any): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/objectifsglobaux/${id}`, objectif);
  }

  // Delete Objectif Global
  deleteObjectifGlobal(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/objectifsglobaux/${id}`);
  }

  // Create Objectif Specifique
  createObjectifSpecifique(objectif: any): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/objectifsspecifiques`, objectif);
  }

  // Update Objectif Specifique
  updateObjectifSpecifique(id: number, objectif: any): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/objectifsspecifiques/${id}`, objectif);
  }

  // Delete Objectif Specifique
  deleteObjectifSpecifique(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/objectifsspecifiques/${id}`);
  }

  // Copy and Link Objectif Specifique
  copyAndLinkObjectifSpecifique(command: any): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/objectifsspecifiques/copy-and-link`, command);
  }

  // Create Contenu Global
  createContenuGlobal(contenu: any): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/contenusglobaux`, contenu);
  }

  // Update Contenu Global
  updateContenuGlobal(id: number, contenu: any): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/contenusglobaux/${id}`, contenu);
  }

  // Delete Contenu Global
  deleteContenuGlobal(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/contenusglobaux/${id}`);
  }

  // Create Contenu Jour
  createContenuJour(contenu: any): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/contenusjour`, contenu);
  }

  // Update Contenu Jour
  updateContenuJour(id: number, contenu: any): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/contenusjour/${id}`, contenu);
  }

  // Update Contenu Jour Order
  updateContenuJourOrdre(id: number, ordre: number): Observable<void> {
    return this.http.patch<void>(`${API_BASE_URL}/contenusjour/${id}/ordre`, { ordre });
  }

  // Delete Contenu Jour
  deleteContenuJour(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/contenusjour/${id}`);
  }

  // Copy and Link Contenu Jour
  copyAndLinkContenuJour(command: any): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/contenusjour/copy-and-link`, command);
  }

  // Assign Contenus to Contenu Jour
  assignContenusToContenuJour(idContenuJour: number, contenuDetailleIds: number[]): Observable<void> {
    return this.http.post<void>(
      `${API_BASE_URL}/contenusjour/${idContenuJour}/assign-contenus`,
      contenuDetailleIds
    );
  }

  // Create Contenu Detaille
  createContenuDetaille(contenu: any): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/contenus-detailles`, contenu);
  }

  // Update Contenu Detaille
  updateContenuDetaille(id: number, contenu: any): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/contenus-detailles/${id}`, contenu);
  }

  // Delete Contenu Detaille
  deleteContenuDetaille(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/contenus-detailles/${id}`);
  }

  // Delete file from Contenu Detaille level
  deleteContenuDetailleFile(contenuId: number, levelNumber: number, filePath: string): Observable<void> {
    return this.http.delete<void>(
      `${API_BASE_URL}/contenus-detailles/${contenuId}/levels/${levelNumber}/files/${filePath}`
    );
  }

  // Helper method to get formateur photo URL
  getFormateurPhotoUrl(photoPath: string | undefined): string {
    if (!photoPath) {
      return 'assets/images/default-instructor.jpg';
    }
    // If the photo path is relative, prepend the base URL
    if (photoPath.startsWith('http')) {
      return photoPath;
    }
    return `${API_BASE_URL}/files/${photoPath}`;
  }

  // Helper method to map API formation to local Course interface
  mapFormationToCourse(formation: any): any {
    // Handle both possible field name variations and nested objects
    const title = formation.titreFormation || formation.theme || 'Formation sans titre';
    const description = formation.descriptionFormation || formation.descriptionTheme || 'Description non disponible';
    const duration = formation.dureeFormation || formation.duree || formation.nombreHeures || 0;
    const level = formation.niveauFormation || formation.niveau || 'Tous niveaux';

    // Extract type name from nested object or direct field
    const typeName = formation.nomType || formation.type?.nom || null;
    const categorieName = formation.nomCategorie || formation.categorie?.nom || null;
    const sousCategorieName = formation.nomSousCategorie || formation.sousCategorie?.nom || null;

    return {
      id: formation.idFormation.toString(),
      title: title,
      category: categorieName || typeName || '',
      subcategory: sousCategorieName?.toLowerCase(),
      description: description,
      objectives: formation.objectifsFormation || formation.objectifsGlobaux?.join(', '),
      level: level,
      total_duration: duration,
      image: this.getDefaultImageByCategory(typeName),
      access_key: 'open',
      instructor: formation.nomFormateur && formation.prenomFormateur
        ? `${formation.prenomFormateur} ${formation.nomFormateur}`
        : undefined,
      instructorPhoto: this.getFormateurPhotoUrl(formation.photoFormateur),
      domaine: formation.nomDomaine || formation.domaine?.nom,
      type: typeName,
      categorie: categorieName,
      sousCategorie: sousCategorieName,
      idCategorie: formation.idCategorie,
      idSousCategorie: formation.idSousCategorie,
      prix: formation.prixFormation || formation.prix
    };
  }

  private mapCategoryToLocal(nomType: string | undefined): string {
    if (!nomType) return 'process';

    const typeMap: { [key: string]: string } = {
      'thermo': 'thermo',
      'automatisme': 'automatisme',
      'process': 'process'
    };

    const normalizedType = nomType.toLowerCase();
    return typeMap[normalizedType] || 'process';
  }

  private getDefaultImageByCategory(nomType: string | undefined): string {
    const typeMap: { [key: string]: string } = {
      'thermo': 'https://images.unsplash.com/photo-1577935749442-8356391d8487?q=80&w=2000&auto=format&fit=crop',
      'automatisme': 'https://images.unsplash.com/photo-1531297461136-82lw8e4a9075?q=80&w=2000&auto=format&fit=crop',
      'process': 'https://images.unsplash.com/photo-1581092497914-874936d52d9a?q=80&w=2000&auto=format&fit=crop'
    };

    return typeMap[nomType?.toLowerCase() || 'process'] || typeMap['process'];
  }
}
