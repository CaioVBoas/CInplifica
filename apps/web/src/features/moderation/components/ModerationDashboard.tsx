import React, { useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, ClipboardList, Loader2, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';
import { moderationService } from '../services/moderationService';
import { AuditLog, ModerationAction, Report, ReportStatus, ReportTargetType } from '../services/types';

type Tab = 'reports' | 'actions' | 'audit';

const targetLabels: Record<ReportTargetType, string> = {
  LISTING: 'Anúncio',
  MESSAGE: 'Mensagem',
  CONVERSATION: 'Conversa',
};

const statusLabels: Record<ReportStatus, string> = {
  PENDING: 'Pendente',
  REVIEWED: 'Revisada',
  DISMISSED: 'Rejeitada',
  RESOLVED: 'Resolvida',
};

const statusClasses: Record<ReportStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  REVIEWED: 'bg-blue-100 text-blue-800',
  DISMISSED: 'bg-gray-100 text-gray-700',
  RESOLVED: 'bg-green-100 text-green-800',
};

const actionLabels: Record<string, string> = {
  APPROVE_REPORT: 'Denúncia aprovada',
  REJECT_REPORT: 'Denúncia rejeitada',
  SUSPEND_USER: 'Usuário suspenso',
  REMOVE_CONTENT: 'Conteúdo removido',
  LOGIN: 'Login',
  LOGIN_MOCK: 'Login de desenvolvimento',
  LISTING_CREATED: 'Anúncio criado',
  LISTING_UPDATED: 'Anúncio atualizado',
  LISTING_DELETED: 'Anúncio excluído',
  REPORT_CREATED: 'Denúncia criada',
  REPORT_APPROVED: 'Denúncia aprovada',
  REPORT_REJECTED: 'Denúncia rejeitada',
  REPORT_STATUS_UPDATED: 'Status de denúncia atualizado',
  CONTENT_REMOVED: 'Conteúdo removido',
  USER_SUSPENDED: 'Usuário suspenso',
};

const formatDate = (value: string) => {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ModerationDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [actions, setActions] = useState<ModerationAction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canModerate = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  const pendingReports = useMemo(() => reports.filter((report) => report.status === 'PENDING'), [reports]);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportsData, actionsData, auditData] = await Promise.all([
        moderationService.fetchReports(),
        moderationService.fetchActions(),
        moderationService.fetchAuditLogs(),
      ]);
      setReports(reportsData);
      setActions(actionsData);
      setAuditLogs(auditData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar moderação.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canModerate) {
      loadDashboard();
    } else {
      setLoading(false);
    }
  }, [canModerate]);

  const approveReport = async (report: Report, removeContent: boolean, suspendUser: boolean) => {
    setSavingId(report.id);
    setError(null);
    try {
      await moderationService.approveReport(report.id, {
        reason: removeContent ? 'Denúncia aprovada com remoção de conteúdo.' : 'Denúncia aprovada.',
        removeContent,
        suspendUser,
      });
      await loadDashboard();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao aprovar denúncia.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  const rejectReport = async (report: Report) => {
    setSavingId(report.id);
    setError(null);
    try {
      await moderationService.rejectReport(report.id, 'Denúncia rejeitada pela moderação.');
      await loadDashboard();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao rejeitar denúncia.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  if (!canModerate) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <ShieldAlert className="mx-auto mb-4 text-red-600" size={48} />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso restrito</h1>
        <p className="text-gray-600">Este painel é exclusivo para administradores e moderadores.</p>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Moderação</h1>
          <p className="mt-2 text-gray-600">Denúncias pendentes, ações recentes e audit log do sistema.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-white p-1 shadow-sm border border-gray-200">
          {[
            { id: 'reports' as Tab, label: 'Denúncias', icon: ClipboardList },
            { id: 'actions' as Tab, label: 'Ações', icon: ShieldCheck },
            { id: 'audit' as Tab, label: 'Audit log', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-red-600 mb-4" size={44} />
          <p className="text-gray-600">Carregando painel...</p>
        </div>
      ) : activeTab === 'reports' ? (
        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Metric label="Pendentes" value={pendingReports.length} />
            <Metric label="Resolvidas" value={reports.filter((report) => report.status === 'RESOLVED').length} />
            <Metric label="Rejeitadas" value={reports.filter((report) => report.status === 'DISMISSED').length} />
          </div>

          {reports.length === 0 ? (
            <EmptyState text="Nenhuma denúncia registrada." />
          ) : (
            reports.map((report) => (
              <article key={report.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[report.status]}`}>
                        {statusLabels[report.status]}
                      </span>
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                        {targetLabels[report.targetType]}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(report.createdAt)}</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">{report.reason}</h2>
                    {report.description && <p className="mt-2 text-sm text-gray-600">{report.description}</p>}
                    <p className="mt-3 text-xs text-gray-500">
                      Alvo: <span className="font-mono">{report.targetId}</span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Denunciante: {report.reporter.name} ({report.reporter.email})
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <button
                      type="button"
                      disabled={savingId === report.id || report.status !== 'PENDING'}
                      onClick={() => approveReport(report, false, false)}
                      className="inline-flex h-10 items-center gap-2 rounded-md bg-green-600 px-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      <CheckCircle2 size={16} />
                      Aprovar
                    </button>
                    <button
                      type="button"
                      disabled={savingId === report.id || report.status !== 'PENDING'}
                      onClick={() => approveReport(report, true, false)}
                      className="inline-flex h-10 items-center gap-2 rounded-md bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      <ShieldAlert size={16} />
                      Remover
                    </button>
                    <button
                      type="button"
                      disabled={savingId === report.id || report.status !== 'PENDING' || report.targetType === 'CONVERSATION'}
                      onClick={() => approveReport(report, true, true)}
                      className="inline-flex h-10 items-center gap-2 rounded-md bg-gray-900 px-3 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      Suspender
                    </button>
                    <button
                      type="button"
                      disabled={savingId === report.id || report.status !== 'PENDING'}
                      onClick={() => rejectReport(report)}
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                      <XCircle size={16} />
                      Rejeitar
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      ) : activeTab === 'actions' ? (
        <Timeline
          items={actions.map((action) => ({
            id: action.id,
            title: actionLabels[action.action] || action.action,
            subtitle: `${action.moderator.name} - ${formatDate(action.createdAt)}`,
            detail: action.reason || `${action.targetType || 'Usuário'} ${action.targetId || ''}`,
          }))}
          emptyText="Nenhuma ação de moderação registrada."
        />
      ) : (
        <Timeline
          items={auditLogs.map((log) => ({
            id: log.id,
            title: actionLabels[log.action] || log.action,
            subtitle: `${log.actor?.name || 'Sistema'} - ${formatDate(log.createdAt)}`,
            detail: `${log.entityType}${log.entityId ? ` ${log.entityId}` : ''}`,
          }))}
          emptyText="Nenhum audit log registrado."
        />
      )}
    </main>
  );
};

const Metric: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="mt-2 text-3xl font-extrabold text-gray-900">{value}</p>
  </div>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
    {text}
  </div>
);

const Timeline: React.FC<{
  items: { id: string; title: string; subtitle: string; detail: string }[];
  emptyText: string;
}> = ({ items, emptyText }) => {
  if (items.length === 0) return <EmptyState text={emptyText} />;

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {items.map((item) => (
        <article key={item.id} className="border-b border-gray-100 p-5 last:border-b-0">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900">{item.title}</h2>
              <p className="mt-1 text-sm text-gray-600 break-words">{item.detail}</p>
            </div>
            <p className="text-xs font-medium text-gray-500">{item.subtitle}</p>
          </div>
        </article>
      ))}
    </section>
  );
};

export default ModerationDashboard;
