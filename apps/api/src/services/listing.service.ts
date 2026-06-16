import prisma from './prisma';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateListingData {
  title: string;
  description: string;
  price?: number | null;
  category: string;
  imageUrl?: string;
  isFree?: boolean;
  lostFoundLocation?: string | null;
  lostFoundOccurredAt?: Date | null;
  lostFoundStatus?: string | null;
  academicExternalLink?: string | null;
  academicSubject?: string | null;
  academicProfessor?: string | null;
  academicTerm?: string | null;
  authorId: string;
}

export interface UpdateListingData {
  title?: string;
  description?: string;
  price?: number | null;
  category?: string;
  imageUrl?: string | null;
  status?: string;
  isFree?: boolean;
  lostFoundLocation?: string | null;
  lostFoundOccurredAt?: Date | null;
  lostFoundStatus?: string | null;
  academicExternalLink?: string | null;
  academicSubject?: string | null;
  academicProfessor?: string | null;
  academicTerm?: string | null;
}

export class ListingService {
  async getAll(category?: string, search?: string, page = 1, limit = 12) {
    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await prisma.$transaction([
      prisma.listing.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getById(id: string) {
    return prisma.listing.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async create(data: CreateListingData) {
    return prisma.listing.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category,
        imageUrl: data.imageUrl,
        isFree: data.isFree,
        lostFoundLocation: data.lostFoundLocation,
        lostFoundOccurredAt: data.lostFoundOccurredAt,
        lostFoundStatus: data.lostFoundStatus,
        academicExternalLink: data.academicExternalLink,
        academicSubject: data.academicSubject,
        academicProfessor: data.academicProfessor,
        academicTerm: data.academicTerm,
        authorId: data.authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateListingData) {
    return prisma.listing.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.listing.delete({
      where: { id },
    });
  }
}

export default new ListingService();
