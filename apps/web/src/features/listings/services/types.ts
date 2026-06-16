export type ListingCategory = 'SALE' | 'LOST_FOUND' | 'ACADEMIC';
export type ListingStatus = 'ACTIVE' | 'INACTIVE' | 'SOLD' | 'FINALIZED' | 'RETURNED';
export type LostFoundStatus = 'LOST' | 'FOUND' | 'WITH_FINDER' | 'RETURNED';

export interface Author {
  id: string;
  name: string;
  email: string;
}

export interface ReviewSummary {
  averageRating: number | null;
  total: number;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number | null;
  imageUrl: string | null;
  category: ListingCategory;
  status: ListingStatus;
  isFree: boolean;
  lostFoundLocation: string | null;
  lostFoundOccurredAt: string | null;
  lostFoundStatus: LostFoundStatus | null;
  academicExternalLink: string | null;
  academicSubject: string | null;
  academicProfessor: string | null;
  academicTerm: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: Author;
}
