import { Request, Response } from 'express';
import { parseReportTargetType } from '../services/report.service';
import moderationService from '../services/moderation.service';

export class ModerationController {
  async approveReport(req: Request, res: Response) {
    try {
      const moderatorId = (req as any).user?.id;
      const action = await moderationService.approveReport({
        reportId: req.params.id,
        moderatorId,
        reason: this.optionalString(req.body.reason),
        removeContent: Boolean(req.body.removeContent),
        suspendUser: Boolean(req.body.suspendUser),
      });

      return res.status(201).json(action);
    } catch (error: any) {
      if (error?.code === 'P2025') {
        return res.status(404).json({ error: 'Registro não encontrado.' });
      }

      return res.status(500).json({ error: 'Falha ao aprovar denúncia.' });
    }
  }

  async rejectReport(req: Request, res: Response) {
    try {
      const moderatorId = (req as any).user?.id;
      const action = await moderationService.rejectReport({
        reportId: req.params.id,
        moderatorId,
        reason: this.optionalString(req.body.reason),
      });

      return res.status(201).json(action);
    } catch (error: any) {
      if (error?.code === 'P2025') {
        return res.status(404).json({ error: 'Denúncia não encontrada.' });
      }

      return res.status(500).json({ error: 'Falha ao rejeitar denúncia.' });
    }
  }

  async removeContent(req: Request, res: Response) {
    try {
      const targetType = parseReportTargetType(req.body.targetType);

      if (!targetType || typeof req.body.targetId !== 'string' || !req.body.targetId.trim()) {
        return res.status(400).json({ error: 'Informe um conteúdo válido.' });
      }

      const action = await moderationService.removeContent({
        targetType,
        targetId: req.body.targetId.trim(),
        moderatorId: (req as any).user?.id,
        reason: this.optionalString(req.body.reason),
        reportId: this.optionalString(req.body.reportId),
      });

      return res.status(201).json(action);
    } catch (error: any) {
      if (error?.code === 'P2025') {
        return res.status(404).json({ error: 'Conteúdo não encontrado.' });
      }

      return res.status(500).json({ error: 'Falha ao remover conteúdo.' });
    }
  }

  async suspendUser(req: Request, res: Response) {
    try {
      const action = await moderationService.suspendUser({
        userId: req.params.id,
        moderatorId: (req as any).user?.id,
        reason: this.optionalString(req.body.reason),
        reportId: this.optionalString(req.body.reportId),
      });

      return res.status(201).json(action);
    } catch (error: any) {
      if (error?.code === 'P2025') {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      return res.status(500).json({ error: 'Falha ao suspender usuário.' });
    }
  }

  async listActions(req: Request, res: Response) {
    try {
      const actions = await moderationService.listActions();
      return res.json(actions);
    } catch (error) {
      return res.status(500).json({ error: 'Falha ao listar histórico de moderação.' });
    }
  }

  private optionalString(value: unknown) {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
  }
}

export default new ModerationController();
