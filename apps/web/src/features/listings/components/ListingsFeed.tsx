import React, { useEffect, useState, useCallback } from 'react';
import { Listing, ListingCategory } from '../services/types';
import { listingsService } from '../services/listingsService';
import ProductGrid from './ProductGrid';
import { Loader2, Search } from 'lucide-react';

const PAGE_SIZE = 12;

const ListingsFeed: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ListingCategory | undefined>();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchListings = useCallback(async (category?: ListingCategory, searchTerm?: string, nextPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await listingsService.fetchListings(category, searchTerm, nextPage, PAGE_SIZE);
      setListings(response.data);
      setTotal(response.total);
      setPage(response.page);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      setError('Erro ao carregar anúncios. Tente novamente mais tarde.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings(activeCategory, search, page);
    }, 500);

    return () => clearTimeout(timer);
  }, [activeCategory, search, page, fetchListings]);

  const categories: { label: string; value: ListingCategory | undefined }[] = [
    { label: 'Todos', value: undefined },
    { label: 'Vendas', value: 'SALE' },
    { label: 'Achados e Perdidos', value: 'LOST_FOUND' },
    { label: 'Acadêmico', value: 'ACADEMIC' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.value
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar anúncios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm"
          />
        </div>
      </div>

      {!loading && !error && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600">
          <p>
            {total === 1 ? '1 anúncio encontrado' : `${total} anúncios encontrados`}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <span>
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-red-600 mb-4" size={48} />
          <p className="text-gray-500">Carregando anúncios...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-center">
          {error}
        </div>
      ) : (
        <ProductGrid listings={listings} />
      )}
    </div>
  );
};

export default ListingsFeed;
