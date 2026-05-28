import React, { useEffect, useState, useCallback } from 'react';
import { Listing, ListingCategory } from '../services/types';
import { listingsService } from '../services/listingsService';
import ProductGrid from './ProductGrid';
import { Loader2, Search } from 'lucide-react';

const ListingsFeed: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ListingCategory | undefined>();
  const [search, setSearch] = useState('');

  const fetchListings = useCallback(async (category?: ListingCategory, searchTerm?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listingsService.fetchListings(category, searchTerm);
      setListings(data);
    } catch (err) {
      setError('Erro ao carregar anúncios. Tente novamente mais tarde.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings(activeCategory, search);
    }, 500);

    return () => clearTimeout(timer);
  }, [activeCategory, search, fetchListings]);

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
                  ? 'bg-blue-600 text-white'
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
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
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
