import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { forumService, ForumTopic } from '../services/forumService';

const Avatar: React.FC<{ name: string; picture: string | null; size?: number }> = ({ name, picture, size = 8 }) => {
  const cls = `w-${size} h-${size} rounded-full object-cover`;
  if (picture) return <img src={picture} alt={name} className={cls} />;
  return (
    <div className={`w-${size} h-${size} rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold text-sm`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora mesmo';
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return `há ${Math.floor(diff / 86400)}d`;
};

const ForumPage: React.FC = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    forumService
      .listTopics(page)
      .then((result) => {
        setTopics(result.data);
        setTotalPages(result.totalPages);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">Fórum</h2>
          <p className="mt-1 text-gray-500">Discussões da comunidade CIn</p>
        </div>
        <button
          onClick={() => navigate('/forum/novo')}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Novo tópico
        </button>
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400 animate-pulse">Carregando tópicos...</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {!loading && !error && topics.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
          <p>Nenhum tópico ainda. Seja o primeiro a iniciar uma discussão!</p>
        </div>
      )}

      {!loading && !error && topics.length > 0 && (
        <div className="space-y-3">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              to={`/forum/${topic.id}`}
              className="block bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-red-300 hover:shadow-sm transition-all"
            >
              <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">{topic.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{topic.content}</p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <Avatar name={topic.author.name} picture={topic.author.picture} size={6} />
                  <span>{topic.author.name.split(' ')[0]}</span>
                  <span>·</span>
                  <span>{timeAgo(topic.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare size={13} />
                  <span>{topic._count?.answers ?? 0} respostas</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </main>
  );
};

export default ForumPage;
