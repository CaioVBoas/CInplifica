import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Eye, Loader2, PackageOpen, Plus, Search } from 'lucide-react';
import { listingsService } from '../services/listingsService';
import { Listing, ListingCategory, ListingStatus } from '../services/types';

const PAGE_SIZE = 10;

const categoryOptions: { label: string; value?: ListingCategory }[] = [
  { label: 'Todas as categorias' },
  { label: 'Vendas', value: 'SALE' },
  { label: 'Achados e perdidos', value: 'LOST_FOUND' },
  { label: 'Acadêmico', value: 'ACADEMIC' },
];

const statusOptions: { label: string; value?: ListingStatus }[] = [
  { label: 'Todos os status' },
  { label: 'Ativos', value: 'ACTIVE' },
  { label: 'Inativos', value: 'INACTIVE' },
  { label: 'Vendidos', value: 'SOLD' },
  { label: 'Finalizados', value: 'FINALIZED' },
  { label: 'Devolvidos', value: 'RETURNED' },
];

const categoryLabels: Record<ListingCategory, string> = {
  SALE: 'Venda',
  LOST_FOUND: 'Achados e perdidos',
  ACADEMIC: 'Acadêmico',
};

const statusLabels: Record<ListingStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  SOLD: 'Vendido',
  FINALIZED: 'Finalizado',
  RETURNED: 'Devolvido',
};

const statusClasses: Record<ListingStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVE: 'bg-gray-50 text-gray-600 border-gray-200',
  SOLD: 'bg-blue-50 text-blue-700 border-blue-200',
  FINALIZED: 'bg-violet-50 text-violet-700 border-violet-200',
  RETURNED: 'bg-amber-50 text-amber-700 border-amber-200',
};

const formatPrice = (listing: Listing) => {
  if (listing.isFree) return 'Grátis/Doação';
  if (listing.category !== 'SALE' && listing.price === null) return 'Grátis/Troca';
  if (listing.price === null) return 'N/A';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(listing.price);
};

const MyListingsPage: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ListingCategory | undefined>();
  const [status, setStatus] = useState<ListingStatus | undefined>();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMyListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await listingsService.fetchMyListings(category, status, search, page, PAGE_SIZE);
      setListings(response.data);
      setTotal(response.total);
      setPage(response.page);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar seus anúncios.');
    } finally {
      setLoading(false);
    }
  }, [category, page, search, status]);

  useEffect(() => {
    setPage(1);
  }, [category, search, status]);

  useEffect(() => {
    const timer = setTimeout(fetchMyListings, 350);
    return () => clearTimeout(timer);
  }, [fetchMyListings]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Área do anunciante</p>
          <h2 className="mt-1 text-3xl font-extrabold text-gray-900">Meus anúncios</h2>
          <p className="mt-2 max-w-2xl text-gray-600">
            Acompanhe tudo que você publicou e acesse rapidamente a edição de cada anúncio.
          </p>
        </div>
        <Link
          to="/listings/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
        >
          <Plus size={18} />
          Novo anúncio
        </Link>
      </section>

      <section className="mb-6 grid gap-3 lg:grid-cols-[1fr_220px_190px]">
        <label className="relative block">
          <span className="sr-only">Buscar nos meus anúncios</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por título ou descrição"
            className="h-11 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 placeholder-gray-500 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </label>

        <label className="block">
          <span className="sr-only">Filtrar categoria</span>
          <select
            value={category || ''}
            onChange={(event) => setCategory((event.target.value || undefined) as ListingCategory | undefined)}
            className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            {categoryOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value || ''}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="sr-only">Filtrar status</span>
          <select
            value={status || ''}
            onChange={(event) => setStatus((event.target.value || undefined) as ListingStatus | undefined)}
            className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value || ''}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      {!loading && !error && (
        <div className="mb-4 flex flex-col gap-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <p>{total === 1 ? '1 anúncio seu encontrado' : `${total} anúncios seus encontrados`}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="h-9 rounded-md border border-gray-200 bg-white px-3 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <span>Página {page} de {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
              className="h-9 rounded-md border border-gray-200 bg-white px-3 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="mb-4 animate-spin text-red-600" size={42} />
          <p className="text-gray-500">Carregando seus anúncios...</p>
        </div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-center text-red-700">
          {error}
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <PackageOpen className="mb-4 text-gray-300" size={48} />
          <h3 className="text-lg font-bold text-gray-900">Nenhum anúncio encontrado</h3>
          <p className="mt-2 max-w-md text-sm text-gray-600">
            Ajuste os filtros ou publique um novo anúncio para ele aparecer aqui.
          </p>
          <Link
            to="/listings/new"
            className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            <Plus size={17} />
            Criar anúncio
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <article
              key={listing.id}
              className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:grid-cols-[96px_1fr_auto]"
            >
              <Link
                to={`/listings/${listing.id}`}
                className="h-24 w-full overflow-hidden rounded-md bg-gray-100 md:w-24"
              >
                {listing.imageUrl ? (
                  <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-medium text-gray-400">
                    Sem imagem
                  </div>
                )}
              </Link>

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                    {categoryLabels[listing.category]}
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[listing.status]}`}>
                    {statusLabels[listing.status]}
                  </span>
                </div>
                <Link to={`/listings/${listing.id}`} className="block">
                  <h3 className="truncate text-lg font-bold text-gray-900 hover:text-red-600">{listing.title}</h3>
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-gray-600">{listing.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                  <span className="font-semibold text-red-600">{formatPrice(listing)}</span>
                  <span>Atualizado em {new Date(listing.updatedAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 md:flex-col md:items-stretch md:justify-center">
                <Link
                  to={`/listings/${listing.id}/edit`}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                >
                  <Edit3 size={16} />
                  Editar
                </Link>
                <Link
                  to={`/listings/${listing.id}`}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Eye size={16} />
                  Ver
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
};

export default MyListingsPage;
