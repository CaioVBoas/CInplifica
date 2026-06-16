import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Loader2, Plus, Trash2 } from 'lucide-react';
import { InterestKeyword, NotificationItem, notificationService } from '../services/notificationService';
import { useAuth } from '../../../shared/context/AuthContext';

const AlertsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [keywords, setKeywords] = useState<InterestKeyword[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [notificationData, keywordData] = await Promise.all([
        notificationService.fetchNotifications(),
        notificationService.fetchKeywords(),
      ]);
      setNotifications(notificationData);
      setKeywords(keywordData);
      await notificationService.markAllRead();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar alertas.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const addKeyword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!keyword.trim()) return;
    try {
      await notificationService.addKeyword(keyword);
      setKeyword('');
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao cadastrar interesse.';
      setError(message);
    }
  };

  const deleteKeyword = async (id: string) => {
    try {
      await notificationService.deleteKeyword(id);
      setKeywords((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao remover interesse.';
      setError(message);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Bell className="mx-auto mb-4 text-red-600" size={48} />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Entre para ver seus alertas</h1>
        <p className="text-gray-600">Alertas de interesse são exclusivos para usuários autenticados.</p>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Alertas</h1>
        <p className="mt-2 text-gray-600">Cadastre interesses e acompanhe mensagens e anúncios relevantes.</p>
      </div>

      {error && <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-red-600" size={42} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Palavras-chave</h2>
            <form onSubmit={addKeyword} className="flex gap-2">
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Ex.: cálculo, carteira, monitor"
                className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
              <button type="submit" className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-red-600 text-white hover:bg-red-700">
                <Plus size={18} />
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {keywords.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum interesse cadastrado.</p>
              ) : (
                keywords.map((item) => (
                  <span key={item.id} className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
                    {item.keyword}
                    <button type="button" onClick={() => deleteKeyword(item.id)} className="text-red-500 hover:text-red-800">
                      <Trash2 size={14} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {notifications.length === 0 ? (
              <div className="p-12 text-center text-gray-500">Nenhuma notificação ainda.</div>
            ) : (
              notifications.map((item) => (
                <Link
                  key={item.id}
                  to={item.link || '/alerts'}
                  className={`block border-b border-gray-100 p-5 last:border-b-0 hover:bg-red-50/40 ${item.readAt ? 'bg-white' : 'bg-yellow-50'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-bold text-gray-900">{item.title}</h2>
                      <p className="mt-1 text-sm text-gray-600">{item.body}</p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </section>
        </div>
      )}
    </main>
  );
};

export default AlertsPage;
