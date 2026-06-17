import { Request, Response } from 'express';
import listingService from '../services/listing.service';
import uploadService from '../services/upload.service';
import auditLogService from '../services/audit-log.service';
import notificationService from '../services/notification.service';

const ALLOWED_CATEGORIES = ['SALE', 'LOST_FOUND', 'ACADEMIC'];
const ALLOWED_STATUSES = ['ACTIVE', 'INACTIVE', 'SOLD', 'FINALIZED', 'RETURNED'];
const ALLOWED_LOST_FOUND_STATUSES = ['LOST', 'FOUND', 'WITH_FINDER', 'RETURNED'];
const STATUSES_BY_CATEGORY: Record<string, string[]> = {
  SALE: ['ACTIVE', 'INACTIVE', 'SOLD'],
  LOST_FOUND: ['ACTIVE', 'INACTIVE', 'RETURNED'],
  ACADEMIC: ['ACTIVE', 'INACTIVE', 'FINALIZED'],
};
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

const normalizeString = (value: unknown) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeNullableString = (value: unknown) => {
  if (value === null || value === '') return null;
  return normalizeString(value) ?? null;
};

const normalizeBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return false;
};

const normalizePrice = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    throw new Error('Preço inválido.');
  }

  return numericValue;
};

const normalizeDate = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error('Data inválida.');
  }

  return date;
};

const normalizePagination = (query: Request['query']) => {
  const rawPage = Number.parseInt(String(query.page || DEFAULT_PAGE), 10);
  const rawLimit = Number.parseInt(String(query.limit || DEFAULT_LIMIT), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : DEFAULT_PAGE;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT;

  return { page, limit };
};

const normalizeExternalLink = (value: unknown) => {
  const link = normalizeNullableString(value);
  if (!link) return link;

  try {
    const url = new URL(link);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error();
    }
    return url.toString();
  } catch {
    throw new Error('Link externo inválido.');
  }
};

const normalizeLostFoundStatus = (value: unknown) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (!ALLOWED_LOST_FOUND_STATUSES.includes(String(value))) {
    throw new Error('Status de achados e perdidos inválido.');
  }
  return String(value);
};

const getAllowedStatusesForCategory = (category: string) => {
  return STATUSES_BY_CATEGORY[category] ?? ALLOWED_STATUSES;
};

const appendCategoryFields = (
  data: Record<string, unknown>,
  body: Record<string, unknown>,
  category: string,
  includeDefaults: boolean,
) => {
  if (body.isFree !== undefined || includeDefaults) {
    data.isFree = category === 'ACADEMIC' ? normalizeBoolean(body.isFree) : false;
  }

  if (category === 'ACADEMIC') {
    if (data.isFree === true) {
      data.price = 0;
    }

    if (body.academicExternalLink !== undefined || includeDefaults) {
      data.academicExternalLink = normalizeExternalLink(body.academicExternalLink);
    }
    if (body.academicSubject !== undefined || includeDefaults) {
      data.academicSubject = normalizeNullableString(body.academicSubject);
    }
    if (body.academicProfessor !== undefined || includeDefaults) {
      data.academicProfessor = normalizeNullableString(body.academicProfessor);
    }
    if (body.academicTerm !== undefined || includeDefaults) {
      data.academicTerm = normalizeNullableString(body.academicTerm);
    }
  } else if (includeDefaults) {
    data.academicExternalLink = null;
    data.academicSubject = null;
    data.academicProfessor = null;
    data.academicTerm = null;
  }

  if (category === 'LOST_FOUND') {
    data.price = null;
    data.isFree = false;

    if (body.lostFoundLocation !== undefined || includeDefaults) {
      data.lostFoundLocation = normalizeNullableString(body.lostFoundLocation);
    }
    if (body.lostFoundOccurredAt !== undefined || includeDefaults) {
      data.lostFoundOccurredAt = normalizeDate(body.lostFoundOccurredAt) ?? null;
    }
    if (body.lostFoundStatus !== undefined || includeDefaults) {
      data.lostFoundStatus = normalizeLostFoundStatus(body.lostFoundStatus) ?? 'LOST';
    }
  } else if (includeDefaults) {
    data.lostFoundLocation = null;
    data.lostFoundOccurredAt = null;
    data.lostFoundStatus = null;
  }
};

export class ListingController {
  async getAll(req: Request, res: Response) {
    try {
      const { category, search } = req.query;
      const { page, limit } = normalizePagination(req.query);

      if (category && !ALLOWED_CATEGORIES.includes(String(category))) {
        return res.status(400).json({ error: 'Categoria inválida.' });
      }

      const listings = await listingService.getAll(category as string, search as string, page, limit);
      res.json(listings);
    } catch (error) {
      res.status(500).json({ error: 'Falha ao buscar anúncios.' });
    }
  }

  async getMine(req: Request, res: Response) {
    try {
      const currentUserId = (req as any).user?.id;
      const { category, search, status } = req.query;
      const { page, limit } = normalizePagination(req.query);

      if (!currentUserId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      if (category && !ALLOWED_CATEGORIES.includes(String(category))) {
        return res.status(400).json({ error: 'Categoria inválida.' });
      }

      if (status && !ALLOWED_STATUSES.includes(String(status))) {
        return res.status(400).json({ error: 'Status inválido.' });
      }

      const listings = await listingService.getMine(
        currentUserId,
        category as string,
        search as string,
        status as string,
        page,
        limit,
      );
      res.json(listings);
    } catch (error) {
      res.status(500).json({ error: 'Falha ao buscar seus anúncios.' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const listing = await listingService.getById(id);
      if (!listing) {
        return res.status(404).json({ error: 'Anúncio não encontrado.' });
      }
      res.json(listing);
    } catch (error) {
      res.status(500).json({ error: 'Falha ao buscar anúncio.' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { title, description, price, category, imageUrl } = req.body;
      const authorId = (req as any).user?.id;

      const normalizedTitle = normalizeString(title);
      const normalizedDescription = normalizeString(description);

      if (!normalizedTitle || !normalizedDescription || !category || !authorId) {
        return res.status(400).json({ error: 'Preencha título, descrição e categoria.' });
      }

      if (!ALLOWED_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: 'Categoria inválida.' });
      }

      const data: Record<string, unknown> = {
        title: normalizedTitle,
        description: normalizedDescription,
        price: category === 'LOST_FOUND' ? null : normalizePrice(price),
        category,
        imageUrl: imageUrl === undefined ? undefined : normalizeNullableString(imageUrl),
        authorId,
      };

      appendCategoryFields(data, req.body, category, true);

      const listing = await listingService.create(data as any);
      await auditLogService.create({
        action: 'LISTING_CREATED',
        entityType: 'Listing',
        entityId: listing.id,
        actorId: authorId,
        metadata: { category: listing.category },
      });
      await notificationService.createInterestAlerts(listing);
      res.status(201).json(listing);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao criar anúncio.';
      res.status(400).json({ error: message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.id;

      const existingListing = await listingService.getById(id);
      if (!existingListing) {
        return res.status(404).json({ error: 'Anúncio não encontrado.' });
      }

      if (!currentUserId || existingListing.authorId !== currentUserId) {
        return res.status(403).json({ error: 'Apenas o autor pode editar este anúncio.' });
      }

      const updateData: Record<string, unknown> = {};
      const nextCategory = req.body.category ?? existingListing.category;
      const categoryChanged = req.body.category !== undefined && req.body.category !== existingListing.category;

      if (req.body.title !== undefined) {
        const title = normalizeString(req.body.title);
        if (!title) return res.status(400).json({ error: 'Título é obrigatório.' });
        updateData.title = title;
      }

      if (req.body.description !== undefined) {
        const description = normalizeString(req.body.description);
        if (!description) return res.status(400).json({ error: 'Descrição é obrigatória.' });
        updateData.description = description;
      }

      if (req.body.price !== undefined) {
        updateData.price = nextCategory === 'LOST_FOUND' ? null : normalizePrice(req.body.price);
      }

      if (req.body.category !== undefined) {
        if (!ALLOWED_CATEGORIES.includes(req.body.category)) {
          return res.status(400).json({ error: 'Categoria inválida.' });
        }
        updateData.category = req.body.category;
      }

      const allowedStatusesForNextCategory = getAllowedStatusesForCategory(nextCategory);
      if (req.body.status !== undefined) {
        if (!allowedStatusesForNextCategory.includes(req.body.status)) {
          return res.status(400).json({ error: 'Status inválido.' });
        }
        updateData.status = req.body.status;
      } else if (!allowedStatusesForNextCategory.includes(existingListing.status)) {
        updateData.status = 'ACTIVE';
      }

      if (req.body.imageUrl !== undefined) {
        updateData.imageUrl = normalizeNullableString(req.body.imageUrl);
      }

      appendCategoryFields(updateData, req.body, nextCategory, categoryChanged);

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'Nenhum campo válido para atualizar.' });
      }

      const listing = await listingService.update(id, updateData as any);
      await auditLogService.create({
        action: 'LISTING_UPDATED',
        entityType: 'Listing',
        entityId: id,
        actorId: currentUserId,
        metadata: { fields: Object.keys(updateData) },
      });
      res.json(listing);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao atualizar anúncio.';
      res.status(400).json({ error: message });
    }
  }

  async uploadImage(req: Request, res: Response) {
    try {
      const upload = await uploadService.saveListingImage(req.body);
      res.status(201).json(upload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao enviar imagem.';
      res.status(400).json({ error: message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.id;

      const existingListing = await listingService.getById(id);
      if (!existingListing) {
        return res.status(404).json({ error: 'Anúncio não encontrado.' });
      }

      if (!currentUserId || existingListing.authorId !== currentUserId) {
        return res.status(403).json({ error: 'Apenas o autor pode excluir este anúncio.' });
      }

      await listingService.delete(id);
      await auditLogService.create({
        action: 'LISTING_DELETED',
        entityType: 'Listing',
        entityId: id,
        actorId: currentUserId,
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Falha ao excluir anúncio.' });
    }
  }
}

export default new ListingController();
