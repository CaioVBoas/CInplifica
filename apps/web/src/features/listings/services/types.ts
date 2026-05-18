export type ListingCategory = 'SALE' | 'LOST_FOUND' | 'ACADEMIC';

export interface Author {
  id: string;
  name: string;
  email: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number | null;
  imageUrl: string | null;
  category: ListingCategory;
  status: 'ACTIVE' | 'INACTIVE' | 'SOLD';
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: Author;
}
