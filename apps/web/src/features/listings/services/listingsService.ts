import { Listing, ListingCategory, ListingStatus, LostFoundStatus, ReviewSummary } from './types';

const API_BASE_URL = '/api';

export interface SaveListingInput {
  title: string;
  description: string;
  price?: number | null;
  category: ListingCategory;
  imageUrl?: string | null;
  status?: ListingStatus;
  isFree?: boolean;
  lostFoundLocation?: string | null;
  lostFoundOccurredAt?: string | null;
  lostFoundStatus?: LostFoundStatus | null;
  academicExternalLink?: string | null;
  academicSubject?: string | null;
  academicProfessor?: string | null;
  academicTerm?: string | null;
}

export interface PaginatedListingsResponse {
  data: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const listingsService = {
  async fetchListings(category?: ListingCategory, search?: string, page = 1, limit = 12): Promise<PaginatedListingsResponse> {
    const url = new URL(`${API_BASE_URL}/listings`, window.location.origin);
    if (category) {
      url.searchParams.append('category', category);
    }
    if (search) {
      url.searchParams.append('search', search);
    }
    url.searchParams.append('page', String(page));
    url.searchParams.append('limit', String(limit));

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch listings');
    }
    return response.json();
  },

  async fetchMyListings(
    category?: ListingCategory,
    status?: ListingStatus,
    search?: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedListingsResponse> {
    const token = localStorage.getItem('token');
    const url = new URL(`${API_BASE_URL}/listings/mine`, window.location.origin);
    if (category) {
      url.searchParams.append('category', category);
    }
    if (status) {
      url.searchParams.append('status', status);
    }
    if (search) {
      url.searchParams.append('search', search);
    }
    url.searchParams.append('page', String(page));
    url.searchParams.append('limit', String(limit));

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch my listings');
    }
    return response.json();
  },

  async fetchListingById(id: string): Promise<Listing> {
    const response = await fetch(`${API_BASE_URL}/listings/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch listing');
    }
    return response.json();
  },

  async fetchUserReviewSummary(userId: string): Promise<ReviewSummary> {
    const response = await fetch(`${API_BASE_URL}/reviews/users/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user reviews');
    }
    const data = await response.json();
    return {
      averageRating: data.averageRating,
      total: data.total,
    };
  },

  async uploadListingImage(file: File): Promise<{ imageUrl: string }> {
    const token = localStorage.getItem('token');
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Falha ao ler a imagem selecionada.'));
      reader.readAsDataURL(file);
    });

    const response = await fetch(`${API_BASE_URL}/listings/upload-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
        data,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || 'Failed to upload listing image');
    }

    return response.json();
  },

  async createListing(data: SaveListingInput): Promise<Listing> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create listing');
    }
    return response.json();
  },

  async updateListing(id: string, data: Partial<SaveListingInput>): Promise<Listing> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/listings/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || 'Failed to update listing');
    }

    return response.json();
  },

  async deleteListing(id: string): Promise<void> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/listings/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || 'Failed to delete listing');
    }
  },
};
