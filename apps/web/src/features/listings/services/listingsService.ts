import { Listing, ListingCategory } from './types';

const API_BASE_URL = '/api';

export const listingsService = {
  async fetchListings(category?: ListingCategory, search?: string): Promise<Listing[]> {
    const url = new URL(`${API_BASE_URL}/listings`, window.location.origin);
    if (category) {
      url.searchParams.append('category', category);
    }
    if (search) {
      url.searchParams.append('search', search);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch listings');
    }
    return response.json();
  },

  async createListing(data: { title: string; description: string; price?: number; category: ListingCategory; imageUrl?: string }): Promise<Listing> {
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
};
