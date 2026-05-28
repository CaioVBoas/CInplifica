import { Request, Response } from 'express';
import listingService from '../services/listing.service';

export class ListingController {
  async getAll(req: Request, res: Response) {
    try {
      const { category, search } = req.query;
      const listings = await listingService.getAll(category as string, search as string);
      res.json(listings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch listings' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const listing = await listingService.getById(id);
      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }
      res.json(listing);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch listing' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { title, description, price, category } = req.body;
      const authorId = (req as any).user?.id;
      
      // Basic validation
      if (!title || !description || !category || !authorId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const listing = await listingService.create({
        title,
        description,
        price,
        category,
        authorId,
      });
      res.status(201).json(listing);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create listing' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await listingService.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete listing' });
    }
  }
}

export default new ListingController();
