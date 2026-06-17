import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Edit,
  ExternalLink,
  Gift,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Star,
  Tag,
  Trash2,
  User,
} from 'lucide-react';
import { chatService } from '../../chat/services/chatService';
import { useAuth } from '../../../shared/context/AuthContext';
import { listingsService } from '../services/listingsService';
import { Listing, ListingCategory, LostFoundStatus, ReviewSummary } from '../services/types';

const categoryLabels: Record<ListingCategory, string> = {
  SALE: 'Venda',
  LOST_FOUND: 'Achados e Perdidos',
  ACADEMIC: 'Acadêmico',
};

const statusLabels: Record<Listing['status'], string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  SOLD: 'Vendido',
  FINALIZED: 'Finalizado',
  RETURNED: 'Devolvido',
};

const lostFoundStatusLabels: Record<LostFoundStatus, string> = {
  LOST: 'Perdido',
  FOUND: 'Encontrado',
  WITH_FINDER: 'Em posse do achador',
  RETURNED: 'Devolvido',
};

const statusClasses: Record<Listing['status'], string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-700',
  SOLD: 'bg-blue-100 text-blue-800',
  FINALIZED: 'bg-purple-100 text-purple-800',
  RETURNED: 'bg-amber-100 text-amber-800',
};

const formatPrice = (listing: Listing) => {
  if (listing.isFree) return 'Grátis/Doação';
  if (listing.category !== 'SALE' && listing.price === null) return 'Grátis/Troca';
  if (listing.price === null) return 'Preço não informado';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(listing.price);
};

const ListingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactLoading, setContactLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [ownerActionError, setOwnerActionError] = useState<string | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Anúncio não encontrado.');
      setLoading(false);
      return;
    }

    const loadListing = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listingsService.fetchListingById(id);
        setListing(data);
      } catch (err) {
        console.error(err);
        setError('Não foi possível carregar este anúncio.');
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [id]);

  useEffect(() => {
    if (!listing) return;

    const loadReviewSummary = async () => {
      try {
        const summary = await listingsService.fetchUserReviewSummary(listing.author.id);
        setReviewSummary(summary);
      } catch (err) {
        console.error(err);
      }
    };

    loadReviewSummary();
  }, [listing]);

  const handleContactSeller = async () => {
    if (!listing) return;

    if (!isAuthenticated) {
      window.location.href = '/api/auth/login';
      return;
    }

    setContactLoading(true);
    setContactError(null);
    try {
      const conversation = await chatService.startConversation(listing.author.id, listing.id);
      navigate('/chat', { state: { conversationId: conversation.id } });
    } catch (err) {
      console.error(err);
      setContactError('Não foi possível iniciar a conversa. Tente novamente.');
    } finally {
      setContactLoading(false);
    }
  };

  const handleStatusChange = async (status: Listing['status']) => {
    if (!listing || listing.status === status) return;

    setActionLoading(status);
    setOwnerActionError(null);
    try {
      const updatedListing = await listingsService.updateListing(listing.id, { status });
      setListing(updatedListing);
    } catch (err) {
      console.error(err);
      setOwnerActionError('Não foi possível atualizar o status do anúncio.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!listing) return;

    const confirmed = window.confirm('Tem certeza que deseja excluir este anúncio? Essa ação não pode ser desfeita.');
    if (!confirmed) return;

    setActionLoading('DELETE');
    setOwnerActionError(null);
    try {
      await listingsService.deleteListing(listing.id);
      navigate('/');
    } catch (err) {
      console.error(err);
      setOwnerActionError('Não foi possível excluir o anúncio.');
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-red-600 mb-4" size={48} />
          <p className="text-gray-600">Carregando anúncio...</p>
        </div>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Anúncio indisponível</h2>
        <p className="text-gray-600 mb-6">{error || 'Este anúncio não foi encontrado.'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          <ArrowLeft size={18} />
          Voltar ao mural
        </Link>
      </main>
    );
  }

  const isOwnListing = user?.id === listing.author.id;
  const ownerStatusActions: Array<{ status: Listing['status']; label: string }> =
    listing.category === 'SALE'
      ? [{ status: 'SOLD', label: 'Vendido' }]
      : listing.category === 'LOST_FOUND'
        ? [{ status: 'RETURNED', label: 'Devolvido' }]
        : [{ status: 'FINALIZED', label: 'Finalizado' }];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        Voltar ao mural
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] gap-8 items-start">
        <section className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="aspect-[4/3] sm:aspect-[16/10] bg-gray-100">
              {listing.imageUrl ? (
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="w-full h-full object-contain bg-gray-100"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Sem imagem
                </div>
              )}
            </div>
          </div>

          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Descrição</h2>
            <p className="text-gray-700 leading-7 whitespace-pre-line">{listing.description}</p>
          </section>

          {listing.category === 'LOST_FOUND' && (
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Detalhes de achados e perdidos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border border-orange-100 bg-orange-50 p-4">
                  <MapPin className="mb-2 text-orange-600" size={20} />
                  <p className="text-xs font-semibold uppercase text-orange-700">Local</p>
                  <p className="mt-1 text-sm text-gray-800">{listing.lostFoundLocation || 'Não informado'}</p>
                </div>
                <div className="rounded-lg border border-orange-100 bg-orange-50 p-4">
                  <CalendarDays className="mb-2 text-orange-600" size={20} />
                  <p className="text-xs font-semibold uppercase text-orange-700">Data/hora</p>
                  <p className="mt-1 text-sm text-gray-800">
                    {listing.lostFoundOccurredAt
                      ? new Date(listing.lostFoundOccurredAt).toLocaleString('pt-BR')
                      : 'Não informado'}
                  </p>
                </div>
                <div className="rounded-lg border border-orange-100 bg-orange-50 p-4">
                  <Tag className="mb-2 text-orange-600" size={20} />
                  <p className="text-xs font-semibold uppercase text-orange-700">Status do item</p>
                  <p className="mt-1 text-sm text-gray-800">
                    {listing.lostFoundStatus ? lostFoundStatusLabels[listing.lostFoundStatus] : 'Não informado'}
                  </p>
                </div>
              </div>
            </section>
          )}

          {listing.category === 'ACADEMIC' && (
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Detalhes acadêmicos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                  <Gift className="mb-2 text-red-600" size={20} />
                  <p className="text-xs font-semibold uppercase text-red-700">Oferta</p>
                  <p className="mt-1 text-sm text-gray-800">{listing.isFree ? 'Gratuito ou doação' : 'Com valor informado'}</p>
                </div>
                <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                  <BookOpen className="mb-2 text-red-600" size={20} />
                  <p className="text-xs font-semibold uppercase text-red-700">Disciplina</p>
                  <p className="mt-1 text-sm text-gray-800">{listing.academicSubject || 'Não informado'}</p>
                </div>
                <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                  <User className="mb-2 text-red-600" size={20} />
                  <p className="text-xs font-semibold uppercase text-red-700">Professor</p>
                  <p className="mt-1 text-sm text-gray-800">{listing.academicProfessor || 'Não informado'}</p>
                </div>
                <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                  <CalendarDays className="mb-2 text-red-600" size={20} />
                  <p className="text-xs font-semibold uppercase text-red-700">Período</p>
                  <p className="mt-1 text-sm text-gray-800">{listing.academicTerm || 'Não informado'}</p>
                </div>
                {listing.academicExternalLink && (
                  <a
                    href={listing.academicExternalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="sm:col-span-2 inline-flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700 hover:bg-red-100"
                  >
                    <ExternalLink size={18} />
                    Abrir material externo
                  </a>
                )}
              </div>
            </section>
          )}
        </section>

        <aside className="bg-white rounded-lg shadow-sm p-6 lg:sticky lg:top-24">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
              <Tag size={14} />
              {categoryLabels[listing.category]}
            </span>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[listing.status]}`}>
              {statusLabels[listing.status]}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">{listing.title}</h1>
          <p className="text-3xl font-extrabold text-red-600 mb-6">{formatPrice(listing)}</p>

          <div className="space-y-4 border-y border-gray-100 py-5 mb-6">
            <div className="flex items-start gap-3 text-sm text-gray-700">
              <User className="text-gray-400 mt-0.5" size={18} />
              <div>
                <p className="font-semibold text-gray-900">{listing.author.name}</p>
                <p>Responsável pelo anúncio</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                  <Star size={14} className="text-yellow-500" fill="currentColor" />
                  {reviewSummary && reviewSummary.total > 0 ? (
                    <span>
                      {reviewSummary.averageRating?.toFixed(1)} de 5 ({reviewSummary.total} avaliação{reviewSummary.total === 1 ? '' : 'ões'})
                    </span>
                  ) : (
                    <span>Sem avaliações ainda</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-700">
              <Mail className="text-gray-400 mt-0.5" size={18} />
              <div>
                <p className="font-semibold text-gray-900">{listing.author.email}</p>
                <p>Email institucional</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-700">
              <CalendarDays className="text-gray-400 mt-0.5" size={18} />
              <div>
                <p className="font-semibold text-gray-900">
                  {new Date(listing.createdAt).toLocaleDateString('pt-BR')}
                </p>
                <p>Publicado em</p>
              </div>
            </div>
          </div>

          {contactError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {contactError}
            </div>
          )}

          {isOwnListing ? (
            <div className="space-y-3">
              {ownerActionError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {ownerActionError}
                </div>
              )}

              <Link
                to={`/listings/${listing.id}/edit`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              >
                <Edit size={18} />
                Editar anúncio
              </Link>

              <div className="grid grid-cols-1 gap-2">
                {ownerStatusActions.map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    onClick={() => handleStatusChange(action.status)}
                    disabled={Boolean(actionLoading) || listing.status === action.status}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading === action.status ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    {action.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleDelete}
                disabled={Boolean(actionLoading)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading === 'DELETE' ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                Excluir anúncio
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleContactSeller}
              disabled={contactLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
            >
              {contactLoading ? <Loader2 className="animate-spin" size={18} /> : <MessageSquare size={18} />}
              Iniciar bate-papo
            </button>
          )}
        </aside>
      </div>
    </main>
  );
};

export default ListingDetails;
