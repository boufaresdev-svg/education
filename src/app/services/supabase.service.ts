import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

// Supabase Configuration
const SUPABASE_URL = 'https://qggjjzrfquvxxfshhujb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZ2pqenJmcXV2eHhmc2hodWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTM0OTksImV4cCI6MjA3ODQyOTQ5OX0.b9FaScmc559THw46dYZ22F7sz7WS7byc8ZHxobLt_VE';

export interface Course {
  id?: string;
  title: string;
  category: string;
  description: string;
  objectives?: string;
  level?: string;
  image?: string;
  instructor?: string;
  contents: CourseContent[];
  access_key?: string;
  created_at?: string;
  updated_at?: string;
  total_duration?: number;
}

export interface CourseContent {
  id: string;
  title: string;
  description: string;
  video_url?: string;
  video_file?: string;
  pdf_url?: string;
  pdf_file?: string;
  image_url?: string;
  pptx_url?: string;
  duration?: string;
  quiz?: Quiz;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
  allowRetake: boolean;
  showCorrectAnswers: boolean;
}

export interface DiscussionQuestion {
  id: string;
  courseId: string;
  moduleId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  question: string;
  timestamp: string;
  replies: DiscussionReply[];
  likes: number;
}

export interface DiscussionReply {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  reply: string;
  timestamp: string;
  isInstructor?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private coursesSubject = new BehaviorSubject<Course[]>([]);
  public courses$ = this.coursesSubject.asObservable();
  private localStorageKey = 'elearning_formations';
  private discussionsKey = 'elearning_discussions';
  private discussionsSubject = new BehaviorSubject<DiscussionQuestion[]>([]);
  public discussions$ = this.discussionsSubject.asObservable();

  // Fake courses data for fallback/demo
  private fakeCourses: Course[] = [
    {
      id: 'fake-1',
      title: 'Maîtrise de la Pasteurisation',
      category: 'thermo',
      description: 'Comprendre les principes fondamentaux de la pasteurisation et son application industrielle.',
      level: 'Intermédiaire',
      total_duration: 120,
      image: 'https://images.unsplash.com/photo-1577935749442-8356391d8487?q=80&w=2000&auto=format&fit=crop',
      access_key: 'open',
      contents: [
        { id: 'm1', title: 'Introduction à la Pasteurisation', description: 'Définition, histoire et enjeux sanitaires.' },
        { id: 'm2', title: 'Le Barème Pasteurisation', description: 'Couple Temps/Température et Unités de Pasteurisation.' },
        { id: 'm3', title: 'Les Équipements', description: 'Échangeurs à plaques, tubulaires et périphériques.' },
        { id: 'm4', title: 'Conduite et Surveilance', description: 'Paramètres critiques et points de contrôle.' }
      ]
    } as any, // Cast to any because of potential extra props not in interface like 'instructor' or 'subcategory' if strict
    {
      id: 'fake-2',
      title: 'Les Échangeurs à Plaques',
      category: 'thermo',
      description: 'Maintenance et dimensionnement des échangeurs thermiques à plaques.',
      level: 'Avancé',
      total_duration: 180,
      image: 'https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?q=80&w=2000&auto=format&fit=crop',
      access_key: 'open',
      contents: [
        { id: 'm1', title: 'Principe de Fonctionnement', description: 'Transfert thermique et contre-courant.' },
        { id: 'm2', title: 'Dimensionnement', description: 'Calcul de surface et débit.' },
        { id: 'm3', title: 'Maintenance Préventive', description: 'Changement de joints et détection de fuites.' }
      ]
    } as any,
    {
      id: 'fake-3',
      title: 'Programmation Siemens S7-1200',
      category: 'automatisme',
      description: 'Initiation à la programmation des automates Siemens série S7-1200 avec TIA Portal.',
      level: 'Débutant',
      total_duration: 360,
      image: 'https://images.unsplash.com/photo-1531297461136-82lw8e4a9075?q=80&w=2000&auto=format&fit=crop',
      access_key: 'open',
      contents: [
        { id: 'm1', title: 'Présentation S7-1200', description: 'Architecture matérielle et câblage.' },
        { id: 'm2', title: 'Introduction TIA Portal', description: 'Création de projet et configuration matérielle.' },
        { id: 'm3', title: 'Langage Ladder (LD)', description: 'Contacts, bobines, set/reset et temporisations.' },
        { id: 'm4', title: 'Blocs de Programme', description: 'OB, FC, FB et DB.' }
      ]
    } as any,
    {
      id: 'fake-4',
      title: 'Supervision WinCC Unified',
      category: 'automatisme',
      description: 'Création d\'interfaces homme-machine modernes avec WinCC Unified.',
      level: 'Intermédiaire',
      total_duration: 240,
      image: 'https://images.unsplash.com/photo-1610465299993-e6675c9f9efa?q=80&w=2000&auto=format&fit=crop',
      access_key: 'locked',
      contents: [
        { id: 'm1', title: 'Concept WinCC Unified', description: 'Architecture web et SVG.' },
        { id: 'm2', title: 'Design d\'Écrans', description: 'Création de vues et navigation.' },
        { id: 'm3', title: 'Scripts JavaScript', description: 'Introduction au scripting dans WinCC.' }
      ]
    } as any,
    {
      id: 'fake-5',
      title: 'Pompes Centrifuges : Principes',
      category: 'process',
      description: 'Fonctionnement, choix et maintenance des pompes centrifuges en industrie agroalimentaire.',
      level: 'Débutant',
      total_duration: 90,
      image: 'https://images.unsplash.com/photo-1581092497914-874936d52d9a?q=80&w=2000&auto=format&fit=crop',
      access_key: 'open',
      contents: [
        { id: 'm1', title: 'Hydraulique de Base', description: 'Pression, débit et pertes de charge.' },
        { id: 'm2', title: 'La Pompe Centrifuge', description: 'Roue, volute et étanchéité.' },
        { id: 'm3', title: 'Courbes Caractéristiques', description: 'Point de fonctionnement et HMT.' }
      ]
    } as any,
    {
      id: 'fake-6',
      title: 'Techniques de NEP Avancées',
      category: 'process',
      description: 'Optimisation des cycles de Nettoyage En Place pour réduire la consommation d\'eau et d\'énergie.',
      level: 'Expert',
      instructor: 'Jean Dupont',
      total_duration: 300,
      image: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?q=80&w=2000&auto=format&fit=crop',
      access_key: 'locked',
      contents: [
        { id: 'm1', title: 'Chimie du Nettoyage', description: 'Détergents, température et temps.' },
        { id: 'm2', title: 'Mécanique des Fluides en NEP', description: 'Turbulence, vitesse et zones d\'ombre.' },
        { id: 'm3', title: 'Optimisation', description: 'Récupération d\'eau et dosage précis.' }
      ]
    } as any,
     {
      id: 'fake-7',
      title: 'Les Capteurs de Température',
      category: 'process',
      description: 'PT100, Thermocouples : choisir et installer le bon capteur.',
      level: 'Intermédiaire',
      instructor: 'Sophie Martin',
      total_duration: 60,
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2000&auto=format&fit=crop',
      access_key: 'open',
      contents: [
        { id: 'm1', title: 'Grandeurs Physiques', description: 'Température et échelles.' },
        { id: 'm2', title: 'Technologies', description: 'PT100 vs Thermocouple.' },
        { id: 'm3', title: 'Installation', description: 'Doigts de gant et convertisseurs.' }
      ]
    } as any,
    {
      id: 'fake-8',
      title: 'Variateurs de Vitesse ATV320',
      category: 'automatisme',
      description: 'Paramétrage et mise en service des variateurs Schneider ATV320.',
      level: 'Avancé',
      instructor: 'Ahmed Ben Ali',
      total_duration: 150,
      image: 'https://images.unsplash.com/photo-1563770095-39d468f95c83?q=80&w=2000&auto=format&fit=crop',
      access_key: 'open',
      contents: [
        { id: 'm1', title: 'Câblage de Puissance', description: 'Réseau et moteur.' },
        { id: 'm2', title: 'Configuration de Base', description: 'Loi U/f et rampes.' },
        { id: 'm3', title: 'Fonctions Avancées', description: 'PID intégré et sécurité STO.' }
      ]
    } as any,
     {
      id: 'fake-9',
      title: 'Stérilisation UHT',
      category: 'thermo',
      description: 'Procédés de stérilisation Ultra Haute Température.',
      level: 'Expert',
      instructor: 'Dr. Sarah Connor',
      total_duration: 200,
      image: 'https://images.unsplash.com/photo-1565514020176-13d8a1c90069?q=80&w=2000&auto=format&fit=crop',
      access_key: 'locked',
      contents: [
        { id: 'm1', title: 'Microbiologie de la Stérilisation', description: 'Destruction des spores.' },
        { id: 'm2', title: 'Technologies UHT', description: 'Injection vapeur et infusion.' },
        { id: 'm3', title: 'Conditionnement Aseptique', description: 'Surpression et stérilité commerciale.' }
      ]
    } as any
  ];

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    // Don't auto-load courses anymore - call loadCourses() explicitly when needed
    // this.loadCourses();
  }

  // Load all courses
  loadCourses(): void {
    this.getCourses().subscribe({
      next: (courses) => {
        this.coursesSubject.next(courses);
        console.log('✅ Loaded courses from Supabase:', courses.length);
      },
      error: (err) => {
        console.error('❌ Error loading from Supabase, using localStorage fallback:', err);
        const localCourses = this.getLocalStorage();
        this.coursesSubject.next(localCourses);
      }
    });
  }

  // Get all courses
  getCourses(): Observable<Course[]> {
    return from(
      this.supabase
        .from('formations')
        .select('*')
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const courses = (data || []) as Course[];
        this.saveToLocalStorage(courses);
        return courses;
      }),
      tap(courses => this.coursesSubject.next(courses)),
      catchError(err => {
        console.error('Supabase API error:', err);
        return of(this.getLocalStorage());
      })
    );
  }

  // Get course by ID
  getCourseById(id: string): Observable<Course | null> {
    // Check if it's a fake course
    const fakeCourse = this.fakeCourses.find(c => c.id === id);
    if (fakeCourse) {
      return of(fakeCourse);
    }

    return from(
      this.supabase
        .from('formations')
        .select(`
          *,
          contents:course_contents(*)
        `)
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error fetching course:', error);
          return null;
        }
        return data as Course;
      }),
      catchError(() => of(null))
    );
  }

  // Add new course
  addCourse(course: Omit<Course, 'id'>): Observable<Course> {
    return from(
      this.supabase
        .from('formations')
        .insert([course])
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const newCourse = data as Course;
        const currentCourses = this.coursesSubject.value;
        this.coursesSubject.next([newCourse, ...currentCourses]);
        this.saveToLocalStorage([newCourse, ...currentCourses]);
        return newCourse;
      }),
      catchError(err => {
        console.error('Supabase insert error, using localStorage:', err);
        // Fallback to localStorage
        const newCourse: Course = {
          ...course,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const currentCourses = this.coursesSubject.value;
        const updatedCourses = [newCourse, ...currentCourses];
        this.coursesSubject.next(updatedCourses);
        this.saveToLocalStorage(updatedCourses);
        return of(newCourse);
      })
    );
  }

  // Update course
  updateCourse(id: string, updates: Partial<Course>): Observable<Course> {
    return from(
      this.supabase
        .from('formations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const updatedCourse = data as Course;
        const currentCourses = this.coursesSubject.value;
        const updatedCourses = currentCourses.map(c =>
          c.id === id ? updatedCourse : c
        );
        this.coursesSubject.next(updatedCourses);
        this.saveToLocalStorage(updatedCourses);
        return updatedCourse;
      }),
      catchError(err => {
        console.error('Supabase update error, using localStorage:', err);
        // Fallback
        const currentCourses = this.coursesSubject.value;
        const index = currentCourses.findIndex(c => c.id === id);
        if (index !== -1) {
          const updatedCourse = { ...currentCourses[index], ...updates, updated_at: new Date().toISOString() };
          const updatedCourses = [...currentCourses];
          updatedCourses[index] = updatedCourse;
          this.coursesSubject.next(updatedCourses);
          this.saveToLocalStorage(updatedCourses);
          return of(updatedCourse);
        }
        return of(currentCourses[index]);
      })
    );
  }

  // Delete course
  deleteCourse(id: string): Observable<boolean> {
    return from(
      this.supabase
        .from('formations')
        .delete()
        .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        const currentCourses = this.coursesSubject.value;
        const filteredCourses = currentCourses.filter(c => c.id !== id);
        this.coursesSubject.next(filteredCourses);
        this.saveToLocalStorage(filteredCourses);
        return true;
      }),
      catchError(err => {
        console.error('Supabase delete error, using localStorage:', err);
        // Fallback
        const currentCourses = this.coursesSubject.value;
        const filteredCourses = currentCourses.filter(c => c.id !== id);
        if (filteredCourses.length < currentCourses.length) {
          this.coursesSubject.next(filteredCourses);
          this.saveToLocalStorage(filteredCourses);
          return of(true);
        }
        return of(false);
      })
    );
  }

  // Delete multiple courses
  deleteMultipleCourses(ids: string[]): Observable<boolean> {
    return from(
      this.supabase
        .from('formations')
        .delete()
        .in('id', ids)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        const currentCourses = this.coursesSubject.value;
        const filteredCourses = currentCourses.filter(c => !ids.includes(c.id || ''));
        this.coursesSubject.next(filteredCourses);
        this.saveToLocalStorage(filteredCourses);
        return true;
      }),
      catchError(err => {
        console.error('Supabase deleteMany error, using localStorage:', err);
        // Fallback
        const currentCourses = this.coursesSubject.value;
        const filteredCourses = currentCourses.filter(c => !ids.includes(c.id || ''));
        if (filteredCourses.length < currentCourses.length) {
          this.coursesSubject.next(filteredCourses);
          this.saveToLocalStorage(filteredCourses);
          return of(true);
        }
        return of(false);
      })
    );
  }

  // Add content to course
  addContentToCourse(courseId: string, content: CourseContent): Observable<Course> {
    return from((async () => {
      const { data: course, error: fetchError } = await this.supabase
        .from('formations')
        .select('*')
        .eq('id', courseId)
        .single();

      if (fetchError) throw fetchError;
      if (!course) throw new Error('Course not found');

      const updatedContents = [...((course as Course).contents || []), content];

      const { data, error } = await this.supabase
        .from('formations')
        .update({ contents: updatedContents, updated_at: new Date().toISOString() })
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;

      const updatedCourse = data as Course;
      const currentCourses = this.coursesSubject.value;
      const updatedCourses = currentCourses.map(c => c.id === courseId ? updatedCourse : c);
      this.coursesSubject.next(updatedCourses);
      this.saveToLocalStorage(updatedCourses);

      return updatedCourse;
    })()).pipe(
      catchError(err => {
        console.error('Supabase addContent error, using localStorage:', err);
        // Fallback
        const currentCourses = this.coursesSubject.value;
        const index = currentCourses.findIndex(c => c.id === courseId);
        if (index !== -1) {
          const updatedCourse = {
            ...currentCourses[index],
            contents: [...(currentCourses[index].contents || []), content],
            updated_at: new Date().toISOString()
          };
          const updatedCourses = [...currentCourses];
          updatedCourses[index] = updatedCourse;
          this.coursesSubject.next(updatedCourses);
          this.saveToLocalStorage(updatedCourses);
          return of(updatedCourse);
        }
        return of({} as Course);
      })
    );
  }

  // Delete content from course
  deleteContent(courseId: string, contentId: string): Observable<Course> {
    return from((async () => {
      const { data: course, error: fetchError } = await this.supabase
        .from('formations')
        .select('*')
        .eq('id', courseId)
        .single();

      if (fetchError) throw fetchError;
      if (!course) throw new Error('Course not found');

      const updatedContents = (course as Course).contents.filter(c => c.id !== contentId);

      const { data, error } = await this.supabase
        .from('formations')
        .update({ contents: updatedContents, updated_at: new Date().toISOString() })
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;

      const updatedCourse = data as Course;
      const currentCourses = this.coursesSubject.value;
      const updatedCourses = currentCourses.map(c => c.id === courseId ? updatedCourse : c);
      this.coursesSubject.next(updatedCourses);
      this.saveToLocalStorage(updatedCourses);

      return updatedCourse;
    })()).pipe(
      catchError(err => {
        console.error('Supabase deleteContent error, using localStorage:', err);
        // Fallback
        const currentCourses = this.coursesSubject.value;
        const index = currentCourses.findIndex(c => c.id === courseId);
        if (index !== -1) {
          const updatedCourse = {
            ...currentCourses[index],
            contents: currentCourses[index].contents.filter(c => c.id !== contentId),
            updated_at: new Date().toISOString()
          };
          const updatedCourses = [...currentCourses];
          updatedCourses[index] = updatedCourse;
          this.coursesSubject.next(updatedCourses);
          this.saveToLocalStorage(updatedCourses);
          return of(updatedCourse);
        }
        return of({} as Course);
      })
    );
  }

  updateContent(courseId: string, updatedContent: CourseContent): Observable<Course> {
    return from((async () => {
      const { data: course, error: fetchError } = await this.supabase
        .from('formations')
        .select('*')
        .eq('id', courseId)
        .single();

      if (fetchError) throw fetchError;
      if (!course) throw new Error('Course not found');

      const updatedContents = (course as Course).contents.map(c =>
        c.id === updatedContent.id ? updatedContent : c
      );

      const { data, error } = await this.supabase
        .from('formations')
        .update({ contents: updatedContents, updated_at: new Date().toISOString() })
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;

      const updatedCourse = data as Course;
      const currentCourses = this.coursesSubject.value;
      const updatedCourses = currentCourses.map(c => c.id === courseId ? updatedCourse : c);
      this.coursesSubject.next(updatedCourses);
      this.saveToLocalStorage(updatedCourses);

      return updatedCourse;
    })()).pipe(
      catchError(err => {
        console.error('Supabase updateContent error, using localStorage:', err);
        // Fallback
        const currentCourses = this.coursesSubject.value;
        const index = currentCourses.findIndex(c => c.id === courseId);
        if (index !== -1) {
          const updatedCourse = {
            ...currentCourses[index],
            contents: currentCourses[index].contents.map(c =>
              c.id === updatedContent.id ? updatedContent : c
            ),
            updated_at: new Date().toISOString()
          };
          const updatedCourses = [...currentCourses];
          updatedCourses[index] = updatedCourse;
          this.coursesSubject.next(updatedCourses);
          this.saveToLocalStorage(updatedCourses);
          return of(updatedCourse);
        }
        return of({} as Course);
      })
    );
  }

  // Upload file to Supabase Storage
  uploadFile(bucket: string, path: string, file: File): Observable<string> {
    return from(
      this.supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const { data: { publicUrl } } = this.supabase.storage
          .from(bucket)
          .getPublicUrl(path);
        return publicUrl;
      }),
      catchError(err => {
        console.error('File upload error:', err);
        throw err;
      })
    );
  }

  // Export/Import utilities
  exportCoursesAsJson(): void {
    const courses = this.coursesSubject.value;
    const dataStr = JSON.stringify(courses, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `courses-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importCoursesFromJson(file: File): Observable<boolean> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const courses = JSON.parse(e.target.result);
          if (Array.isArray(courses)) {
            this.coursesSubject.next(courses);
            this.saveToLocalStorage(courses);
            observer.next(true);
            observer.complete();
          } else {
            observer.error(new Error('Format JSON invalide'));
          }
        } catch (err) {
          observer.error(err);
        }
      };
      reader.onerror = () => observer.error(new Error('Erreur lecture fichier'));
      reader.readAsText(file);
    });
  }

  // ============ Discussion Forum Methods ============

  getDiscussions(courseId: string): Observable<DiscussionQuestion[]> {
    const discussions = this.getDiscussionsFromStorage();
    return of(discussions.filter(d => d.courseId === courseId));
  }

  addQuestion(question: Omit<DiscussionQuestion, 'id' | 'timestamp' | 'replies' | 'likes'>): Observable<DiscussionQuestion> {
    const newQuestion: DiscussionQuestion = {
      ...question,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      replies: [],
      likes: 0
    };

    const discussions = this.getDiscussionsFromStorage();
    discussions.unshift(newQuestion);
    this.saveDiscussionsToStorage(discussions);
    this.discussionsSubject.next(discussions);

    return of(newQuestion);
  }

  addReply(questionId: string, reply: Omit<DiscussionReply, 'id' | 'timestamp'>): Observable<DiscussionQuestion> {
    const discussions = this.getDiscussionsFromStorage();
    const questionIndex = discussions.findIndex(q => q.id === questionId);

    if (questionIndex !== -1) {
      const newReply: DiscussionReply = {
        ...reply,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };

      discussions[questionIndex].replies.push(newReply);
      this.saveDiscussionsToStorage(discussions);
      this.discussionsSubject.next(discussions);

      return of(discussions[questionIndex]);
    }

    return of({} as DiscussionQuestion);
  }

  deleteQuestion(questionId: string): Observable<boolean> {
    const discussions = this.getDiscussionsFromStorage();
    const filtered = discussions.filter(q => q.id !== questionId);
    this.saveDiscussionsToStorage(filtered);
    this.discussionsSubject.next(filtered);
    return of(true);
  }

  private getDiscussionsFromStorage(): DiscussionQuestion[] {
    try {
      const data = localStorage.getItem(this.discussionsKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading discussions from localStorage:', error);
      return [];
    }
  }

  private saveDiscussionsToStorage(discussions: DiscussionQuestion[]): void {
    try {
      localStorage.setItem(this.discussionsKey, JSON.stringify(discussions));
    } catch (error) {
      console.error('Error writing discussions to localStorage:', error);
    }
  }

  // ============ LocalStorage Methods ============

  private getLocalStorage(): Course[] {
    try {
      const data = localStorage.getItem(this.localStorageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  }

  private saveToLocalStorage(courses: Course[]): void {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(courses));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }
}
