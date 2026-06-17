import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, MessageSquare } from 'lucide-react';
import { forumService, ForumTopic, ForumAnswer, ForumComment } from '../services/forumService';
import { useAuth } from '../../../shared/context/AuthContext';

const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora mesmo';
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Avatar: React.FC<{ name: string; picture: string | null }> = ({ name, picture }) => {
  if (picture)
    return <img src={picture} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />;
  return (
    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold text-sm flex-shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

const CommentItem: React.FC<{
  comment: ForumComment;
  canDelete: boolean;
  onDelete: (id: string) => void;
}> = ({ comment, canDelete, onDelete }) => (
  <div className="flex gap-3 py-2">
    <Avatar name={comment.author.name} picture={comment.author.picture} />
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-xs font-semibold text-gray-700">{comment.author.name.split(' ')[0]}</span>
        <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
      </div>
      <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap break-words">{comment.content}</p>
    </div>
    {canDelete && (
      <button
        onClick={() => onDelete(comment.id)}
        className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
        title="Excluir comentário"
      >
        <Trash2 size={14} />
      </button>
    )}
  </div>
);

const CommentForm: React.FC<{ onSubmit: (text: string) => Promise<void> }> = ({ onSubmit }) => {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handle} className="flex gap-2 mt-3">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Adicionar comentário..."
        className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent"
      />
      <button
        type="submit"
        disabled={submitting || !text.trim()}
        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? '...' : 'Comentar'}
      </button>
    </form>
  );
};

const AnswerItem: React.FC<{
  answer: ForumAnswer;
  canDeleteAnswer: boolean;
  canDeleteComment: (authorId: string) => boolean;
  onDeleteAnswer: (id: string) => void;
  onAddComment: (answerId: string, text: string) => Promise<void>;
  onDeleteComment: (id: string, answerId: string) => void;
}> = ({ answer, canDeleteAnswer, canDeleteComment, onDeleteAnswer, onAddComment, onDeleteComment }) => {
  const [showComments, setShowComments] = useState(true);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex gap-3">
        <Avatar name={answer.author.name} picture={answer.author.picture} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-gray-800">{answer.author.name.split(' ')[0]}</span>
              <span className="text-xs text-gray-400">{timeAgo(answer.createdAt)}</span>
            </div>
            {canDeleteAnswer && (
              <button
                onClick={() => onDeleteAnswer(answer.id)}
                className="text-gray-300 hover:text-red-500 transition-colors"
                title="Excluir resposta"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap break-words">{answer.content}</p>
        </div>
      </div>

      <div className="mt-4 pl-11">
        {answer.comments.length > 0 && (
          <button
            onClick={() => setShowComments((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-2 transition-colors"
          >
            <MessageSquare size={12} />
            {answer.comments.length} {answer.comments.length === 1 ? 'comentário' : 'comentários'}
          </button>
        )}

        {showComments && answer.comments.length > 0 && (
          <div className="divide-y divide-gray-100 border-t border-gray-100">
            {answer.comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                canDelete={canDeleteComment(c.author.id)}
                onDelete={(id) => onDeleteComment(id, answer.id)}
              />
            ))}
          </div>
        )}

        <CommentForm onSubmit={(text) => onAddComment(answer.id, text)} />
      </div>
    </div>
  );
};

const TopicPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);

  const canModerate = user?.role === 'ADMIN' || user?.role === 'MODERATOR';
  const canDelete = (authorId: string) => user?.id === authorId || canModerate;

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    forumService
      .getTopic(id)
      .then(setTopic)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !answerText.trim()) return;
    setAnswerError(null);
    setSubmittingAnswer(true);
    try {
      const answer = await forumService.createAnswer(id, answerText.trim());
      setTopic((prev) =>
        prev ? { ...prev, answers: [...(prev.answers ?? []), answer] } : prev
      );
      setAnswerText('');
    } catch (err) {
      setAnswerError(err instanceof Error ? err.message : 'Falha ao publicar resposta.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    try {
      await forumService.deleteAnswer(answerId);
      setTopic((prev) =>
        prev ? { ...prev, answers: (prev.answers ?? []).filter((a) => a.id !== answerId) } : prev
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao excluir resposta.');
    }
  };

  const handleAddComment = async (answerId: string, text: string) => {
    const comment = await forumService.createComment(answerId, text);
    setTopic((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        answers: (prev.answers ?? []).map((a) =>
          a.id === answerId ? { ...a, comments: [...a.comments, comment] } : a
        ),
      };
    });
  };

  const handleDeleteComment = async (commentId: string, answerId: string) => {
    try {
      await forumService.deleteComment(commentId);
      setTopic((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          answers: (prev.answers ?? []).map((a) =>
            a.id === answerId
              ? { ...a, comments: a.comments.filter((c) => c.id !== commentId) }
              : a
          ),
        };
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Falha ao excluir comentário.');
    }
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        <div className="text-center py-16 text-gray-400 animate-pulse">Carregando tópico...</div>
      </main>
    );
  }

  if (error || !topic) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error ?? 'Tópico não encontrado.'}
        </div>
      </main>
    );
  }

  const answers = topic.answers ?? [];

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate('/forum')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar ao fórum
      </button>

      {/* Topic header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-3">{topic.title}</h2>
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={topic.author.name} picture={topic.author.picture} />
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{topic.author.name.split(' ')[0]}</span>
            {' · '}
            {timeAgo(topic.createdAt)}
          </div>
        </div>
        <p className="text-gray-700 whitespace-pre-wrap break-words leading-relaxed">{topic.content}</p>
      </div>

      {/* Answers */}
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        {answers.length === 0 ? 'Nenhuma resposta ainda' : `${answers.length} ${answers.length === 1 ? 'resposta' : 'respostas'}`}
      </h3>

      {answers.length > 0 && (
        <div className="space-y-4 mb-8">
          {answers.map((answer) => (
            <AnswerItem
              key={answer.id}
              answer={answer}
              canDeleteAnswer={canDelete(answer.author.id)}
              canDeleteComment={(authorId) => canDelete(authorId)}
              onDeleteAnswer={handleDeleteAnswer}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
            />
          ))}
        </div>
      )}

      {/* Answer form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Sua resposta</h4>
        {answerError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm mb-3">
            {answerError}
          </div>
        )}
        <form onSubmit={handleSubmitAnswer} className="space-y-3">
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            rows={5}
            placeholder="Escreva sua resposta..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-y"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingAnswer || !answerText.trim()}
              className="px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submittingAnswer ? 'Publicando...' : 'Publicar resposta'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default TopicPage;
