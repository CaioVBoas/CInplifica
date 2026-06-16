import { Request, Response } from 'express';
import auditLogService from '../services/audit-log.service';

export class AuditLogController {
  async list(req: Request, res: Response) {
    try {
      const logs = await auditLogService.list({
        entityType: this.optionalString(req.query.entityType),
        actorId: this.optionalString(req.query.actorId),
        action: this.optionalString(req.query.action),
      });

      return res.json(logs);
    } catch (error) {
      return res.status(500).json({ error: 'Falha ao listar audit log.' });
    }
  }

  private optionalString(value: unknown) {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
  }
}

export default new AuditLogController();
