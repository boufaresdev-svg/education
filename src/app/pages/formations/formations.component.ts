import { Component, OnInit, OnDestroy, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Course } from '../../services/supabase.service';
import { FormationApiService, CategorieResponse, SousCategorieResponse } from '../../services/formation-api.service';
import { takeUntil, forkJoin } from 'rxjs';
import { Subject } from 'rxjs';

interface SidebarCategory {
  id: string;
  label: string;
  icon?: string;
  subcategories: { id: string; label: string }[];
  isOpen?: boolean;
}

@Component({
  selector: 'app-formations',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './formations.component.html',
  styleUrl: './formations.component.css'
})
export class FormationsComponent implements OnInit, OnDestroy {
  courses: Course[] = [];
  selectedCategory: string = '';
  selectedSubCategory: string = '';
  searchTerm: string = '';
  searchInstructor: string = '';
  private destroy$ = new Subject<void>();
  isLoadingFormations = signal(true);
  errorMessage = signal<string | null>(null);

  sidebarCategories: SidebarCategory[] = [
    {
      id: 'all',
      label: 'Toutes les formations',
      icon: 'all',
      subcategories: [],
      isOpen: false
    }
  ];

  constructor(
    private formationApiService: FormationApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
  }

  private loadData(): void {
    this.isLoadingFormations.set(true);
    this.errorMessage.set(null);

    // Load formations, categories, and sous-categories in parallel
    forkJoin({
      formations: this.formationApiService.getAllFormations(),
      categories: this.formationApiService.getAllCategories(),
      sousCategories: this.formationApiService.getAllSousCategories()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ formations, categories, sousCategories }) => {
        console.log('[FormationsComponent] Raw API formations:', formations);
        console.log('[FormationsComponent] Categories:', categories);
        console.log('[FormationsComponent] Sous-categories:', sousCategories);

        // Build sidebar from real categories
        this.buildSidebarFromApi(categories, sousCategories);

        // Handle formations
        let formationsArray = formations;
        if (Array.isArray(formations) && formations.length > 0 && Array.isArray(formations[0])) {
          formationsArray = formations[0];
        }

        if (formationsArray && formationsArray.length > 0) {
          this.courses = formationsArray.map(f => this.formationApiService.mapFormationToCourse(f));
          console.log('[FormationsComponent] Mapped courses:', this.courses);
        } else {
          console.log('[FormationsComponent] No formations received from API');
          this.courses = [];
        }

        this.isLoadingFormations.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('[FormationsComponent] Error loading data:', error);
        this.errorMessage.set('Connexion au serveur impossible.');
        this.courses = [];
        this.isLoadingFormations.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private buildSidebarFromApi(categories: CategorieResponse[], sousCategories: SousCategorieResponse[]): void {
    // Start with "all" item
    const sidebar: SidebarCategory[] = [
      {
        id: 'all',
        label: 'Toutes les formations',
        icon: 'all',
        subcategories: [],
        isOpen: false
      }
    ];

    // Group sous-categories by their parent category id
    const subCatMap = new Map<number, SousCategorieResponse[]>();
    for (const sc of sousCategories) {
      if (sc.idCategorie) {
        const existing = subCatMap.get(sc.idCategorie) || [];
        existing.push(sc);
        subCatMap.set(sc.idCategorie, existing);
      }
    }

    // Build each category entry
    for (const cat of categories) {
      const children = subCatMap.get(cat.idCategorie) || [];
      sidebar.push({
        id: cat.idCategorie.toString(),
        label: cat.nomCategorie,
        icon: 'category',
        isOpen: true,
        subcategories: children.map(sc => ({
          id: sc.idSousCategorie.toString(),
          label: sc.nomSousCategorie
        }))
      });
    }

    this.sidebarCategories = sidebar;
    console.log('[FormationsComponent] Built sidebar categories:', this.sidebarCategories);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleCategory(category: SidebarCategory) {
    if (category.id === 'all') {
      this.selectedCategory = '';
      this.selectedSubCategory = '';
    } else {
      category.isOpen = !category.isOpen;
    }
  }

  selectCategory(category: string) {
    if (category === 'all') {
      this.selectedCategory = '';
    } else {
      this.selectedCategory = category;
    }
    this.selectedSubCategory = '';
  }

  selectSubCategory(category: string, subCategory: string, event: Event) {
    event.stopPropagation();
    this.selectedCategory = category;
    this.selectedSubCategory = subCategory;
  }

  getFilteredCourses() {
    return this.courses.filter(course => {
      const c = course as any;

      // Filter by Category (match by id or name)
      if (this.selectedCategory) {
        const catId = c.idCategorie?.toString();
        const catName = c.categorie?.toLowerCase();
        const selectedLower = this.selectedCategory.toLowerCase();
        // Match by idCategorie or by nomCategorie
        if (catId !== this.selectedCategory && catName !== selectedLower) {
          return false;
        }
      }

      // Filter by SubCategory
      if (this.selectedSubCategory) {
        const subId = c.idSousCategorie?.toString();
        const subName = c.sousCategorie?.toLowerCase();
        const selectedSubLower = this.selectedSubCategory.toLowerCase();
        if (subId !== this.selectedSubCategory && subName !== selectedSubLower) {
          return false;
        }
      }

      // Filter by Search Term (Title)
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        if (!course.title.toLowerCase().includes(term)) {
          return false;
        }
      }

      // Filter by Instructor
      if (this.searchInstructor) {
        const instructor = c.instructor;
        if (!instructor || !instructor.toLowerCase().includes(this.searchInstructor.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }

  getCategoryIcon(category: string): string {
    // Return a generic icon type — the template handles SVGs
    return 'course';
  }

  getCategoryLabel(category: string): string {
    if (category === 'all' || category === '') return 'Toutes les formations';
    const cat = this.sidebarCategories.find(c => c.id === category);
    return cat ? cat.label : category;
  }

  formatDuration(totalDuration?: number): string {
    if (!totalDuration) return 'Non spécifié';
    if (totalDuration < 60) return `${totalDuration}m`;
    const hours = Math.floor(totalDuration / 60);
    const mins = totalDuration % 60;
    const timeStr = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;

    // Calculate days (6 hours per day)
    const days = Math.ceil(hours / 6);
    const dayStr = days === 1 ? '1 jour' : `${days} jours`;

    return `${timeStr} (${dayStr})`;
  }

  getLevel(course: Course): string {
    return course.level || 'Tous niveaux';
  }

  getDurationInDays(totalDuration?: number): string {
    if (!totalDuration) return 'Non spécifié';
    const hours = Math.floor(totalDuration / 60);
    const days = Math.ceil(hours / 6);
    return days === 1 ? '1 jour' : `${days} jours`;
  }
}
