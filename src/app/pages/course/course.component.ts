import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { SupabaseService, Course, CourseContent, Quiz, QuizQuestion, DiscussionQuestion, DiscussionReply } from '../../services/supabase.service';
import { FormationApiService } from '../../services/formation-api.service';
import { environment } from '../../../environments/environment';
import { takeUntil, switchMap, of, forkJoin } from 'rxjs';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';

// Interface for grouped content structure
export interface ContentGroup {
  objectifSpecifiqueId: string;
  objectifSpecifiqueTitle: string;
  objectifSpecifiqueDescription?: string;
  contents: CourseContent[];
  expanded: boolean;
}

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course.component.html',
  styleUrl: './course.component.css'
})
export class CourseComponent implements OnInit, OnDestroy {
  course: Course | null = null;
  currentModule: CourseContent | null = null;
  currentModuleIndex: number = 0;
  accessKey: string = '';
  isAccessGranted: boolean = false;
  showAccessKeyInput: boolean = false;
  showDetails: boolean = true;
  isLoading: boolean = false;
  errorMessage: string = '';

  // Grouped content by objectif spécifique
  contentGroups: ContentGroup[] = [];
  groupedView: boolean = true; // Toggle for grouped vs flat view

  // Raw formation data from API (contains objectifsSpecifiques)
  private rawFormation: any = null;
  private readonly API_BASE = environment.apiUrl;

  // Media handling
  currentVideoUrl: SafeResourceUrl | null = null;
  currentPdfUrl: SafeResourceUrl | null = null;
  rawPdfUrl: string | null = null;
  currentImageUrl: string | null = null;
  currentPresentationUrl: SafeResourceUrl | null = null;
  rawPresentationUrl: string | null = null;
  showVideo: boolean = false;
  showPdf: boolean = false;
  showImage: boolean = false;
  showPresentation: boolean = false;
  videoError: boolean = false;

  // Quiz handling
  isQuizActive: boolean = false;
  currentQuiz: Quiz | null = null;
  quizAnswers: { [questionId: string]: string | string[] } = {};
  quizStartTime: Date | null = null;
  quizTimeRemaining: number = 0;
  quizTimerInterval: any = null;
  showQuizResults: boolean = false;
  quizScore: number = 0;
  quizTotalPoints: number = 0;
  quizPassed: boolean = false;

  activeTab: 'overview' | 'qa' | 'notes' = 'overview';

  // Discussion Forum
  discussions: DiscussionQuestion[] = [];
  newQuestion: string = '';
  replyText: { [key: string]: string } = {};
  showReplyBox: { [key: string]: boolean } = {};
  currentUserId: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService,
    private formationApiService: FormationApiService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('CourseComponent initialized');
    this.isLoading = true;
    this.currentUserId = localStorage.getItem('userEmail') || '';

    // Default to not granted - user must be enrolled
    this.isAccessGranted = false;

    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          const courseId = params['id'];
          console.log('Course ID from route:', courseId);
          if (!courseId) {
            this.router.navigate(['/formations']);
            return of(null);
          }
          // Fetch from Formation API instead of Supabase
          return this.formationApiService.getFormationById(+courseId).pipe(
            map(formationResponse => {
              console.log('Formation API response:', formationResponse);

              // Handle case where API returns array instead of single object
              let formation = formationResponse;
              if (Array.isArray(formationResponse)) {
                if (formationResponse.length === 0) {
                  return null;
                }
                // If nested array like [[{...}]]
                if (Array.isArray(formationResponse[0])) {
                  formation = formationResponse[0][0];
                } else {
                  formation = formationResponse[0];
                }
              }

              if (!formation) {
                return null;
              }

              // Store raw formation for later use (objectifsSpecifiques, etc.)
              this.rawFormation = formation;

              // Convert formation to Course format
              const mappedCourse = this.formationApiService.mapFormationToCourse(formation);
              return {
                ...mappedCourse,
                contents: [] // Will be populated from API later
              } as Course;
            })
          );
        })
      )
      .subscribe({
        next: (course) => {
          console.log('Course received:', course);
          console.log('Setting isLoading to false');
          this.isLoading = false;

          if (course) {
            this.course = course;
            console.log('Course assigned. Has access_key:', !!course.access_key);
            console.log('Contents length:', course.contents?.length || 0);

            // Fetch course contents from API
            if (course.id) {
              this.loadCourseContents(+course.id);
            }

            // Check user enrollment in this course
            this.checkUserEnrollment(+course.id!);
          } else {
            console.log('Course is null/undefined');
            this.errorMessage = 'Cours introuvable';
          }

          // Manually trigger change detection
          this.cdr.detectChanges();
          console.log('Change detection triggered');
        },
        error: (err) => {
          console.error('Error in subscription:', err);
          this.isLoading = false;
          this.errorMessage = 'Erreur lors du chargement du cours';
        }
      });
  }

  /**
   * Check if the current user is enrolled in a class that has access to this formation
   */
  private checkUserEnrollment(formationId: number): void {
    const userId = localStorage.getItem('userId');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    // Admins always have access
    if (isAdmin) {
      console.log('User is admin - granting access');
      this.isAccessGranted = true;
      this.cdr.detectChanges();
      return;
    }

    // If no user logged in, deny access
    if (!userId) {
      console.log('No user logged in - denying access');
      this.isAccessGranted = false;
      this.cdr.detectChanges();
      return;
    }

    console.log('Checking enrollment for user:', userId, 'formation:', formationId);

    // Get user's enrolled classes and check if any match this formation
    this.formationApiService.getApprenantClasses(+userId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log('User classes response:', response);

        if (response && response.classes && response.classes.length > 0) {
          // Check if any of the user's classes have this formation
          const hasAccess = response.classes.some(classe => {
            const classeFormationId = classe.formation?.id;
            console.log('Checking classe:', classe.nom, 'formation id:', classeFormationId);
            return classeFormationId === formationId;
          });

          console.log('User has access to this formation:', hasAccess);
          this.isAccessGranted = hasAccess;
        } else {
          console.log('User has no enrolled classes');
          this.isAccessGranted = false;
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error checking enrollment:', err);
        this.isAccessGranted = false;
        this.cdr.detectChanges();
      }
    });
  }

  private blobUrl: string | null = null;

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopQuizTimer();
    this.revokeBlobUrl();
  }

  private revokeBlobUrl() {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
  }

  // Load course contents from API
  loadCourseContents(formationId: number): void {
    console.log('Loading course contents for formation:', formationId);

    // Check if formation has objectifsSpecifiques (already in formation response)
    const objectifsSpecifiques = this.rawFormation?.objectifsSpecifiques;

    if (objectifsSpecifiques && objectifsSpecifiques.length > 0) {
      console.log('Found objectifsSpecifiques in formation:', objectifsSpecifiques);
      this.buildGroupedContentsFromObjectifs(objectifsSpecifiques, formationId);
    } else {
      console.log('No objectifsSpecifiques, loading flat contents...');
      this.loadFlatContents(formationId);
    }
  }

  // Build grouped contents from objectifsSpecifiques already in formation response
  private buildGroupedContentsFromObjectifs(objectifsSpecifiques: any[], formationId: number): void {
    // Collect all assignedContenuDetailleIds from all objectifs
    const allDetailIds: number[] = [];
    const objectifToDetailIds: Map<number, number[]> = new Map();

    objectifsSpecifiques.forEach((objectif: any) => {
      const detailIds: number[] = [];
      if (objectif.contenus && objectif.contenus.length > 0) {
        objectif.contenus.forEach((contenuJour: any) => {
          if (contenuJour.assignedContenuDetailleIds) {
            detailIds.push(...contenuJour.assignedContenuDetailleIds);
            allDetailIds.push(...contenuJour.assignedContenuDetailleIds);
          }
        });
      }
      objectifToDetailIds.set(objectif.idObjectifSpec, detailIds);
    });

    console.log('All detail IDs to fetch:', allDetailIds);

    if (allDetailIds.length === 0) {
      // No detailed content IDs, fall back to flat loading
      this.loadFlatContents(formationId);
      return;
    }

    // Fetch all detailed contents at once
    this.formationApiService.getContenuDetailleByFormation(formationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (allDetails) => {
          console.log('All detailed contents fetched:', allDetails);

          // Build a map of id -> detail for quick lookup
          const detailMap = new Map<number, any>();
          allDetails.forEach((detail: any) => {
            detailMap.set(detail.idContenuDetaille, detail);
          });

          // Build content groups
          const groups: ContentGroup[] = [];

          objectifsSpecifiques.forEach((objectif: any) => {
            const detailIds = objectifToDetailIds.get(objectif.idObjectifSpec) || [];
            const contents: CourseContent[] = [];

            detailIds.forEach(id => {
              const detail = detailMap.get(id);
              if (detail) {
                contents.push(this.mapDetailToCourseContent(detail));
              }
            });

            if (contents.length > 0) {
              groups.push({
                objectifSpecifiqueId: objectif.idObjectifSpec?.toString(),
                objectifSpecifiqueTitle: objectif.titre || 'Objectif',
                objectifSpecifiqueDescription: objectif.description || '',
                contents,
                expanded: true
              });
            }
          });

          this.contentGroups = groups;
          this.groupedView = groups.length > 0;
          console.log('Content groups built:', this.contentGroups);

          // Build flat list for compatibility
          if (this.course) {
            this.course.contents = groups.flatMap(g => g.contents);
            if (this.course.contents.length > 0) {
              this.loadModule(0);
            }
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('Error fetching detailed contents:', error);
          this.loadFlatContents(formationId);
        }
      });
  }

  // Extract media files from a detailed content's levels
  private mapDetailToCourseContent(detail: any): CourseContent {
    let videoUrl: string | undefined;
    let pdfUrl: string | undefined;
    let imageUrl: string | undefined;
    let pptxUrl: string | undefined;

    // Scan levels for files
    if (detail.levels && detail.levels.length > 0) {
      for (const level of detail.levels) {
        if (level.files && level.files.length > 0) {
          for (const file of level.files) {
            const fileType = (file.fileType || '').toLowerCase();
            const filePath = file.filePath || '';
            const fileUrl = `${this.API_BASE}/contenus-detailles/files/${filePath}`;

            console.log('File found:', filePath, 'type:', fileType);

            if (fileType.startsWith('video/') || filePath.endsWith('.mp4') || filePath.endsWith('.webm')) {
              if (!videoUrl) videoUrl = fileUrl;
            } else if (fileType === 'application/pdf' || filePath.endsWith('.pdf')) {
              if (!pdfUrl) pdfUrl = fileUrl;
            } else if (
              fileType === 'application/vnd.ms-powerpoint' ||
              fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
              filePath.endsWith('.ppt') || filePath.endsWith('.pptx')
            ) {
              if (!pptxUrl) pptxUrl = fileUrl;
            } else if (fileType.startsWith('image/') || filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.gif') || filePath.endsWith('.webp')) {
              if (!imageUrl) imageUrl = fileUrl;
            }
          }
        }
      }
    }

    const duration = detail.dureeTheorique || detail.dureePratique;

    return {
      id: detail.idContenuDetaille?.toString() || `detail-${Math.random()}`,
      title: detail.titre || 'Contenu',
      description: detail.methodesPedagogiques || '',
      video_url: videoUrl,
      pdf_url: pdfUrl,
      image_url: imageUrl,
      pptx_url: pptxUrl,
      duration: duration ? `${duration} min` : undefined,
      quiz: undefined
    };
  }

  private loadFlatContents(formationId: number): void {
    // Fallback to flat structure using /by-formation endpoint
    this.formationApiService.getContenuDetailleByFormation(formationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contents) => {
          console.log('Flat contents received:', contents);
          if (contents && contents.length > 0) {
            const mappedContents = contents.map((content: any) =>
              this.mapDetailToCourseContent(content)
            );

            if (this.course) {
              this.course.contents = mappedContents;
              this.groupedView = false;
              if (mappedContents.length > 0) {
                this.loadModule(0);
              }
              this.cdr.detectChanges();
            }
          }
        },
        error: (error) => {
          console.error('Error loading flat contents:', error);
        }
      });
  }

  // Quiz Methods
  startQuiz() {
    if (!this.isAccessGranted) return;
    if (!this.currentModule || !this.currentModule.quiz) return;

    this.currentQuiz = this.currentModule.quiz;
    this.isQuizActive = true;
    this.showQuizResults = false;
    this.quizAnswers = {};
    this.quizStartTime = new Date();

    // Start timer if quiz has time limit
    if (this.currentQuiz.timeLimit) {
      this.quizTimeRemaining = this.currentQuiz.timeLimit * 60; // Convert to seconds
      this.startQuizTimer();
    }

    // Reset media display when starting quiz
    this.showVideo = false;
    this.showPdf = false;
  }

  startQuizTimer() {
    this.quizTimerInterval = setInterval(() => {
      if (this.quizTimeRemaining > 0) {
        this.quizTimeRemaining--;
      } else {
        this.submitQuiz(); // Auto-submit when time runs out
      }
    }, 1000);
  }

  stopQuizTimer() {
    if (this.quizTimerInterval) {
      clearInterval(this.quizTimerInterval);
      this.quizTimerInterval = null;
    }
  }

  getQuizTimerDisplay(): string {
    const minutes = Math.floor(this.quizTimeRemaining / 60);
    const seconds = this.quizTimeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  selectAnswer(questionId: string, answer: string) {
    this.quizAnswers[questionId] = answer;
  }

  toggleMultipleChoice(questionId: string, option: string) {
    if (!this.quizAnswers[questionId]) {
      this.quizAnswers[questionId] = [];
    }

    const answers = this.quizAnswers[questionId] as string[];
    const index = answers.indexOf(option);

    if (index > -1) {
      answers.splice(index, 1);
    } else {
      answers.push(option);
    }
  }

  isOptionSelected(questionId: string, option: string): boolean {
    const answer = this.quizAnswers[questionId];
    if (Array.isArray(answer)) {
      return answer.includes(option);
    }
    return answer === option;
  }

  canSubmitQuiz(): boolean {
    if (!this.currentQuiz) return false;

    // Check if all questions are answered
    return this.currentQuiz.questions.every(q => {
      const answer = this.quizAnswers[q.id];
      if (Array.isArray(answer)) {
        return answer.length > 0;
      }
      return answer && answer.trim().length > 0;
    });
  }

  submitQuiz() {
    if (!this.currentQuiz) return;

    this.stopQuizTimer();

    // Calculate score
    let score = 0;
    const totalPoints = this.currentQuiz.questions.reduce((sum, q) => sum + q.points, 0);

    this.currentQuiz.questions.forEach(question => {
      const userAnswer = this.quizAnswers[question.id];
      const correctAnswer = question.correctAnswer;

      let isCorrect = false;

      if (Array.isArray(correctAnswer)) {
        // Multiple correct answers
        if (Array.isArray(userAnswer)) {
          const sortedUserAnswer = [...userAnswer].sort();
          const sortedCorrectAnswer = [...correctAnswer].sort();
          isCorrect = JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer);
        }
      } else {
        // Single correct answer
        if (question.type === 'short-answer') {
          isCorrect = userAnswer?.toString().trim().toLowerCase() === correctAnswer.toLowerCase();
        } else {
          isCorrect = userAnswer === correctAnswer;
        }
      }

      if (isCorrect) {
        score += question.points;
      }
    });

    this.quizScore = score;
    this.quizTotalPoints = totalPoints;
    this.quizPassed = (score / totalPoints) * 100 >= this.currentQuiz.passingScore;
    this.showQuizResults = true;
    this.isQuizActive = false;

    // Scroll to top to show results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  retakeQuiz() {
    if (this.currentQuiz?.allowRetake) {
      this.startQuiz();
    }
  }

  exitQuiz() {
    this.isQuizActive = false;
    this.showQuizResults = false;
    this.currentQuiz = null;
    this.quizAnswers = {};
    this.stopQuizTimer();
  }

  isAnswerCorrect(questionId: string): boolean {
    if (!this.currentQuiz || !this.showQuizResults) return false;

    const question = this.currentQuiz.questions.find(q => q.id === questionId);
    if (!question) return false;

    const userAnswer = this.quizAnswers[questionId];
    const correctAnswer = question.correctAnswer;

    if (Array.isArray(correctAnswer)) {
      if (Array.isArray(userAnswer)) {
        const sortedUserAnswer = [...userAnswer].sort();
        const sortedCorrectAnswer = [...correctAnswer].sort();
        return JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer);
      }
      return false;
    } else {
      if (question.type === 'short-answer') {
        return userAnswer?.toString().trim().toLowerCase() === correctAnswer.toLowerCase();
      }
      return userAnswer === correctAnswer;
    }
  }

  getQuestionScore(questionId: string): number {
    return this.isAnswerCorrect(questionId)
      ? this.currentQuiz?.questions.find(q => q.id === questionId)?.points || 0
      : 0;
  }

  getQuizPercentage(): number {
    if (this.quizTotalPoints === 0) return 0;
    return Math.round((this.quizScore / this.quizTotalPoints) * 100);
  }

  validateAccessKey() {
    console.log('validateAccessKey called');
    if (!this.course || !this.accessKey.trim()) {
      this.errorMessage = 'Veuillez entrer une clé d\'accès';
      return;
    }

    const courseAccessKey = this.course.access_key;
    console.log('Entered key:', this.accessKey.trim().toUpperCase());
    console.log('Expected key:', courseAccessKey?.toUpperCase());

    if (this.accessKey.trim().toUpperCase() === courseAccessKey?.toUpperCase()) {
      console.log('Access key is valid! Granting access...');
      this.isAccessGranted = true;
      this.showAccessKeyInput = false;
      this.errorMessage = '';
      this.loadFirstModule();
      console.log('After loadFirstModule - showVideo:', this.showVideo, 'showPdf:', this.showPdf);
      this.cdr.detectChanges();
    } else {
      console.log('Access key is invalid');
      this.errorMessage = 'Clé d\'accès invalide';
    }
  }

  startCourse() {
    if (this.isAccessGranted) {
      this.showDetails = false;
      this.loadFirstModule();
    } else {
      this.showDetails = false;
      this.showAccessKeyInput = true;
    }
  }

  private loadFirstModule() {
    if (this.course && this.course.contents && this.course.contents.length > 0) {
      this.currentModuleIndex = 0;
      this.loadModule(0);
    }
  }

  loadModule(index: number) {
    // Check if user has access before loading module
    if (!this.isAccessGranted) {
      console.warn('Access denied: User is not enrolled in this course');
      this.showAccessKeyInput = true;
      this.showDetails = false;
      return;
    }

    if (!this.course || !this.course.contents || index < 0 || index >= this.course.contents.length) {
      return;
    }

    this.currentModuleIndex = index;
    this.currentModule = this.course.contents[index];

    console.log('Loading module:', this.currentModule);
    console.log('Module has quiz:', !!this.currentModule.quiz);
    if (this.currentModule.quiz) {
      console.log('Quiz details:', this.currentModule.quiz);
    }

    // Reset media display
    this.showVideo = false;
    this.showPdf = false;
    this.showImage = false;
    this.showPresentation = false;
    this.videoError = false;
    this.currentVideoUrl = null;
    this.currentPdfUrl = null;
    this.rawPdfUrl = null;
    this.currentImageUrl = null;
    this.currentPresentationUrl = null;
    this.rawPresentationUrl = null;

    // Load media if available
    const videoUrl = (this.currentModule as any).video_url || (this.currentModule as any).videoUrl;
    const pdfUrl = (this.currentModule as any).pdf_url || (this.currentModule as any).pdfUrl;
    const imageUrl = (this.currentModule as any).image_url || (this.currentModule as any).imageUrl;
    const pptxUrl = (this.currentModule as any).pptx_url || (this.currentModule as any).pptxUrl;

    console.log('Video URL:', videoUrl);
    console.log('PDF URL:', pdfUrl);
    console.log('Image URL:', imageUrl);
    console.log('PPTX URL:', pptxUrl);

    if (videoUrl) {
      this.currentVideoUrl = this.sanitizer.bypassSecurityTrustUrl(videoUrl);
      this.showVideo = true;
    } else if (pptxUrl) {
      this.rawPresentationUrl = pptxUrl;
      // Use Microsoft Office Online viewer to embed PowerPoint
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(pptxUrl)}`;
      this.currentPresentationUrl = this.sanitizer.bypassSecurityTrustResourceUrl(officeViewerUrl);
      this.showPresentation = true;
    } else if (pdfUrl) {
      this.rawPdfUrl = pdfUrl;
      this.showPdf = true;
      // Fetch PDF as blob to bypass X-Frame-Options: DENY
      this.loadPdfAsBlob(pdfUrl);
    } else if (imageUrl) {
      this.currentImageUrl = imageUrl;
      this.showImage = true;
    }

    console.log('Final state - showVideo:', this.showVideo, 'showPdf:', this.showPdf, 'showImage:', this.showImage);

    // Trigger change detection
    this.cdr.detectChanges();
  }

  private loadPdfAsBlob(pdfUrl: string): void {
    // Revoke previous blob URL to prevent memory leaks
    this.revokeBlobUrl();

    this.http.get(pdfUrl, { responseType: 'blob' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const blobUrl = URL.createObjectURL(blob);
          this.blobUrl = blobUrl;
          this.currentPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading PDF as blob, trying direct URL fallback:', err);
          // Fallback: try embedding the direct URL
          this.currentPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl);
          this.cdr.detectChanges();
        }
      });
  }

  openPdfInNewTab(): void {
    if (this.rawPdfUrl) {
      window.open(this.rawPdfUrl, '_blank');
    }
  }

  loadModuleById(moduleId: string) {
    // Check if user has access before loading module
    if (!this.isAccessGranted) {
      console.warn('Access denied: User is not enrolled in this course');
      return;
    }

    if (!this.course || !this.course.contents) return;

    const index = this.course.contents.findIndex(m => m.id === moduleId);
    if (index !== -1) {
      this.loadModule(index);
    }
  }

  isModuleCompleted(moduleId: string): boolean {
    if (!this.course || !this.course.contents) return false;

    const moduleIndex = this.course.contents.findIndex(m => m.id === moduleId);
    return moduleIndex !== -1 && moduleIndex < this.currentModuleIndex;
  }

  toggleGroup(groupId: string) {
    const group = this.contentGroups.find(g => g.objectifSpecifiqueId === groupId);
    if (group) {
      group.expanded = !group.expanded;
    }
  }

  nextModule() {
    if (!this.isAccessGranted) return;
    if (this.course && this.currentModuleIndex < this.course.contents.length - 1) {
      this.loadModule(this.currentModuleIndex + 1);
    }
  }

  previousModule() {
    if (!this.isAccessGranted) return;
    if (this.currentModuleIndex > 0) {
      this.loadModule(this.currentModuleIndex - 1);
    }
  }

  toggleVideo() {
    if (!this.isAccessGranted) return;
    this.showVideo = !this.showVideo;
    if (this.showVideo) {
      this.showPdf = false;
      this.showImage = false;
      this.showPresentation = false;
    }
  }

  onVideoError() {
    console.warn('Video failed to load:', this.currentVideoUrl);
    this.showVideo = false;
    this.currentVideoUrl = null;
    this.videoError = true;
    this.cdr.markForCheck();
  }

  togglePdf() {
    if (!this.isAccessGranted) return;
    this.showPdf = !this.showPdf;
    if (this.showPdf) {
      this.showVideo = false;
      this.showImage = false;
      this.showPresentation = false;
      // Reload blob if not yet loaded
      if (!this.currentPdfUrl && this.rawPdfUrl) {
        this.loadPdfAsBlob(this.rawPdfUrl);
      }
    }
  }

  toggleImage() {
    if (!this.isAccessGranted) return;
    this.showImage = !this.showImage;
    if (this.showImage) {
      this.showVideo = false;
      this.showPdf = false;
      this.showPresentation = false;
    }
  }

  togglePresentation() {
    if (!this.isAccessGranted) return;
    this.showPresentation = !this.showPresentation;
    if (this.showPresentation) {
      this.showVideo = false;
      this.showPdf = false;
      this.showImage = false;

      // Re-build viewer URL if needed
      if (!this.currentPresentationUrl && this.rawPresentationUrl) {
        const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(this.rawPresentationUrl)}`;
        this.currentPresentationUrl = this.sanitizer.bypassSecurityTrustResourceUrl(officeViewerUrl);
      }
    }
  }

  openPresentationInNewTab(): void {
    if (this.rawPresentationUrl) {
      window.open(this.rawPresentationUrl, '_blank');
    }
  }

  goBack() {
    this.router.navigate(['/formations']);
  }

  getCourseProgress(): number {
    if (!this.course || !this.course.contents.length) return 0;
    return Math.round(((this.currentModuleIndex + 1) / this.course.contents.length) * 100);
  }

  getModuleTypeIcon(module: CourseContent): string {
    let icon = '';

    if (module.video_url) icon += '🎥';
    if (module.pdf_url) icon += '📄';
    if ((module as any).image_url) icon += '🖼️';
    if (module.quiz) icon += '📝';

    return icon || '📚';
  }

  getCategoryLabel(): string {
    if (!this.course) return '';
    // Map of category labels
    const labels: Record<string, string> = {
      'thermo': 'Thermo Fromage',
      'automatisme': 'Automatisme',
      'process': 'Process'
    };
    return labels[this.course.category] || this.course.category;
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.validateAccessKey();
    }
  }

  setActiveTab(tab: 'overview' | 'qa' | 'notes') {
    this.activeTab = tab;

    if (tab === 'qa' && this.course) {
      this.loadDiscussions();
    }
  }

  // Discussion Forum Methods
  loadDiscussions() {
    if (!this.course?.id) return;

    this.supabaseService.getDiscussions(this.course.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(discussions => {
        this.discussions = discussions;
      });
  }

  postQuestion() {
    if (!this.newQuestion.trim() || !this.course?.id) return;

    const userName = localStorage.getItem('userName') || 'Utilisateur';
    const userId = localStorage.getItem('userEmail') || 'anonymous';
    const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

    this.supabaseService.addQuestion({
      courseId: this.course.id,
      moduleId: this.currentModule?.id,
      userId,
      userName,
      userAvatar: userInitials,
      question: this.newQuestion
    }).pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.newQuestion = '';
        this.loadDiscussions();
      });
  }

  toggleReplyBox(questionId: string) {
    this.showReplyBox[questionId] = !this.showReplyBox[questionId];
  }

  postReply(questionId: string) {
    if (!this.replyText[questionId]?.trim()) return;

    const userName = localStorage.getItem('userName') || 'Utilisateur';
    const userId = localStorage.getItem('userEmail') || 'anonymous';
    const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

    this.supabaseService.addReply(questionId, {
      userId,
      userName,
      userAvatar: userInitials,
      reply: this.replyText[questionId]
    }).pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.replyText[questionId] = '';
        this.showReplyBox[questionId] = false;
        this.loadDiscussions();
      });
  }

  deleteQuestion(questionId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      this.supabaseService.deleteQuestion(questionId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.loadDiscussions();
        });
    }
  }

  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'à l\'instant';
    if (diffMins < 60) return `il y a ${diffMins} min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffDays === 1) return 'hier';
    return `il y a ${diffDays} jours`;
  }
}
