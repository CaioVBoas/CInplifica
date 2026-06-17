import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { forumService } from '../services/forumService';

const NewTopicPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const topic = await forumService.createTopic(title.trim(), content.trim());
      navigate(`/forum/${topic.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar tópico.');
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
      <button
        onClick={() => navigate('/forum')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar ao fórum
      </button>

      <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Novo tópico</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            placeholder="O que você quer discutir?"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
          />
          <p className="text-right text-xs text-gray-400 mt-1">{title.length}/200</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Conteúdo <span className="text-red-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={8}
            placeholder="Descreva o tópico com detalhes..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-y"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/forum')}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            className="px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Publicando...' : 'Publicar tópico'}
          </button>
        </div>
      </form>
    </main>
  );
};

export default NewTopicPage;
