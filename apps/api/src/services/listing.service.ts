import prisma from './prisma';

export interface CreateListingData {
  title: string;
  description: string;
  price?: number;
  category: string;
  authorId: string;
}

export class ListingService {
  async getAll(category?: string, search?: string) {
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

    return prisma.listing.findMany({
      where,
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
    });
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
        authorId: data.authorId,
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
