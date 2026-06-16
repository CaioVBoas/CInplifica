import { Request, Response } from 'express';
import reportService, { parseReportStatus, parseReportTargetType } from '../services/report.service';
import auditLogService from '../services/audit-log.service';

export class ReportController {
  async create(req: Request, res: Response) {
    try {
      const reporterId = (req as any).user?.id;
      const { targetType, targetId, reason, description } = req.body;
      const parsedTargetType = parseReportTargetType(targetType);

      if (!reporterId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      if (!parsedTargetType || typeof targetId !== 'string' || !targetId.trim()) {
        return res.status(400).json({ error: 'Informe um alvo válido para a denúncia.' });
      }

      if (typeof reason !== 'string' || reason.trim().length < 3) {
        return res.status(400).json({ error: 'Informe um motivo válido para a denúncia.' });
      }

      const report = await reportService.create({
        targetType: parsedTargetType,
        targetId: targetId.trim(),
        reason: reason.trim(),
        description: typeof description === 'string' && description.trim() ? description.trim() : undefined,
        reporterId,
      });
      await auditLogService.create({
        action: 'REPORT_CREATED',
        entityType: 'Report',
        entityId: report.id,
        actorId: reporterId,
        metadata: {
          targetType: report.targetType,
          targetId: report.targetId,
        },
      });

      return res.status(201).json(report);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao criar denúncia.';

      if (message.includes('não encontrado')) {
        return res.status(404).json({ error: message });
      }

      return res.status(500).json({ error: 'Falha ao criar denúncia.' });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const filters = {
        status: req.query.status ? parseReportStatus(req.query.status) : undefined,
        targetType: req.query.targetType ? parseReportTargetType(req.query.targetType) : undefined,
      };

      if (req.query.status && !filters.status) {
        return res.status(400).json({ error: 'Status de denúncia inválido.' });
      }

      if (req.query.targetType && !filters.targetType) {
        return res.status(400).json({ error: 'Tipo de alvo inválido.' });
      }

      const reports = await reportService.list({
        status: filters.status || undefined,
        targetType: filters.targetType || undefined,
      });
      return res.json(reports);
    } catch (error) {
      return res.status(500).json({ error: 'Falha ao listar denúncias.' });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const status = parseReportStatus(req.body.status);

      if (!status) {
        return res.status(400).json({ error: 'Status de denúncia inválido.' });
      }

      const report = await reportService.updateStatus(id, status);
      await auditLogService.create({
        action: 'REPORT_STATUS_UPDATED',
        entityType: 'Report',
        entityId: id,
        actorId: (req as any).user?.id,
        metadata: { status },
      });
      return res.json(report);
    } catch (error: any) {
      if (error?.code === 'P2025') {
        return res.status(404).json({ error: 'Denúncia não encontrada.' });
      }

      return res.status(500).json({ error: 'Falha ao atualizar denúncia.' });
    }
  }
}

export default new ReportController();
