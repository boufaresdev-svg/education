# Formation API Integration

This document describes how the Angular e-learning application integrates with the Formation Management API microservice.

## Overview

The application now uses a real Java Spring Boot API backend to fetch formation (training) data instead of using fake/mock data. The integration includes:

- Real-time data fetching from the API
- Fallback mechanism to demo data if API is unavailable
- Proper error handling and loading states
- Dynamic category and subcategory filtering

## Architecture

### Services

#### 1. FormationApiService (`src/app/services/formation-api.service.ts`)

Main service responsible for all API interactions:

**Key Methods:**
- `getAllFormations()` - Fetch all formations
- `getFormationsPaginated()` - Fetch paginated formations
- `getFormationById(id)` - Get specific formation details
- `getFormationStatistics()` - Get platform statistics
- `getAllDomaines()` - Fetch all domains
- `getAllTypes()` - Fetch all types
- `getAllCategories()` - Fetch all categories
- `getAllSousCategories()` - Fetch all subcategories
- `getAllFormateurs()` - Fetch all trainers/instructors

**Helper Methods:**
- `mapFormationToCourse(formation)` - Maps API response to local Course interface
- `getFormateurPhotoUrl(photoPath)` - Generates trainer photo URLs
- `getDefaultImageByCategory(nomType)` - Returns default images by category

### Components

#### FormationsComponent (`src/app/pages/formations/formations.component.ts`)

Updated to:
- Load formations from API on initialization
- Display loading spinner during fetch
- Show error message if API fails
- Fallback to Supabase/demo data if API is unavailable

## API Configuration

### Environment Files

**Development** (`src/environments/environment.ts`):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

**Production** (`src/environments/environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  apiUrl: 'http://localhost:8080/api'  // Update with production URL
};
```

### API Base URL

The API base URL is configured in the environment files and defaults to:
```
http://localhost:8080/api
```

## API Endpoints Used

Based on the `formation-api-documentation.json`:

### Formations
- `GET /api/formations` - Get all formations
- `GET /api/formations/paginated` - Get paginated formations
- `GET /api/formations/{id}` - Get formation by ID
- `GET /api/formations/statistics` - Get statistics

### Metadata
- `GET /api/domaines` - Get all domains
- `GET /api/types` - Get all types
- `GET /api/categories` - Get all categories
- `GET /api/souscategories` - Get all subcategories
- `GET /api/formateurs` - Get all trainers

## Data Mapping

### API Response → Local Course Interface

The API returns formations with this structure:
```typescript
interface FormationResponse {
  idFormation: number;
  titreFormation: string;
  dureeFormation: number;
  descriptionFormation: string;
  niveauFormation?: string;
  nomFormateur?: string;
  prenomFormateur?: string;
  photoFormateur?: string;
  nomType?: string;
  nomCategorie?: string;
  nomSousCategorie?: string;
  // ... other fields
}
```

Mapped to local Course interface:
```typescript
interface Course {
  id: string;
  title: string;
  category: 'thermo' | 'automatisme' | 'process';
  subcategory?: string;
  description: string;
  level?: string;
  total_duration?: number;
  instructor?: string;
  image?: string;
  // ... other fields
}
```

## Features

### 1. Loading States

The component displays a loading spinner while fetching data:
```html
@if (isLoadingFormations) {
  <div class="loading-state">
    <div class="spinner"></div>
    <p>Chargement des formations...</p>
  </div>
}
```

### 2. Error Handling

If the API fails, an error message is displayed:
```html
@if (errorMessage) {
  <div class="alert alert-warning">
    <strong>⚠️ Attention:</strong> {{ errorMessage }}
  </div>
}
```

### 3. Fallback Mechanism

If the API is unavailable, the app automatically falls back to demo data:
```typescript
private loadFormationsFromApi(): void {
  this.formationApiService.getAllFormations()
    .subscribe({
      next: (formations) => {
        this.courses = formations.map(f => 
          this.formationApiService.mapFormationToCourse(f)
        );
      },
      error: (error) => {
        console.error('Error loading from API:', error);
        this.loadFromSupabase(); // Fallback
      }
    });
}
```

## Running the Application

### Prerequisites

1. **Backend API Running:**
   - Ensure the Formation Management API is running on `http://localhost:8080`
   - Check API health at: `http://localhost:8080/api/formations`

2. **Install Dependencies:**
   ```bash
   npm install
   ```

### Start Development Server

```bash
npm start
```

The application will be available at `http://localhost:4200`

### Build for Production

```bash
npm run build
```

## Testing the Integration

### 1. With API Available

1. Start the backend API server
2. Start the Angular app
3. Navigate to `/formations`
4. You should see real data from the API

### 2. Without API (Fallback Mode)

1. Stop the backend API server
2. Start the Angular app
3. Navigate to `/formations`
4. You should see:
   - Warning message about connection failure
   - Demo/fake data displayed

### 3. Verify API Calls

Open browser DevTools → Network tab:
- Look for calls to `http://localhost:8080/api/formations`
- Check request/response payloads
- Verify HTTP status codes

## Troubleshooting

### CORS Issues

If you see CORS errors in the console:

1. **Backend Configuration:**
   The API should allow `http://localhost:4200` in CORS configuration

2. **Check Browser Console:**
   Look for messages like "Access-Control-Allow-Origin"

### Connection Refused

If you see "Connection refused" errors:

1. Verify the backend API is running
2. Check the API URL in environment files
3. Test the API directly: `curl http://localhost:8080/api/formations`

### Empty Data

If formations list is empty:

1. Check if the backend database has data
2. Verify API endpoint returns data: `GET /api/formations`
3. Check browser console for JavaScript errors

## Future Enhancements

### Planned Features

1. **Real-time Updates:**
   - WebSocket integration for live updates
   - Server-sent events for notifications

2. **Advanced Filtering:**
   - Filter by domain, type, category
   - Price range filtering
   - Duration filtering

3. **Search Enhancement:**
   - Full-text search integration
   - Search suggestions
   - Search history

4. **Pagination:**
   - Implement paginated loading
   - Infinite scroll option
   - Page size selection

5. **Caching:**
   - Local storage caching
   - Service worker for offline support
   - Cache invalidation strategies

## API Documentation Reference

Complete API documentation is available in:
- `formation-api-documentation.json` (in project root)

## Support

For issues or questions:
1. Check the console for error messages
2. Review the API documentation
3. Verify backend API is accessible
4. Check network requests in DevTools

## Version History

- **v1.0.0** - Initial API integration
  - Basic CRUD operations
  - Fallback mechanism
  - Loading states
  - Error handling
