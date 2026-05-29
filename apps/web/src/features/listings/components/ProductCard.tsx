import React from 'react';
import { Listing } from '../services/types';
import { Tag, User, Clock } from 'lucide-react';

interface ProductCardProps {
  listing: Listing;
}

const ProductCard: React.FC<ProductCardProps> = ({ listing }) => {
  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const categoryColors = {
    SALE: 'bg-green-100 text-green-800',
    LOST_FOUND: 'bg-orange-100 text-orange-800',
    ACADEMIC: 'bg-red-100 text-red-800',
  };

  const categoryLabels = {
    SALE: 'Venda',
    LOST_FOUND: 'Achados e Perdidos',
    ACADEMIC: 'Acadêmico',
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <div className="relative h-48 bg-gray-200">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
            <span className="text-sm">Sem imagem</span>
          </div>
        )}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold ${categoryColors[listing.category]}`}>
          {categoryLabels[listing.category]}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{listing.title}</h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">{listing.description}</p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <div className="text-lg font-bold text-red-600">
            {listing.category === 'SALE' ? formatPrice(listing.price) : 'Grátis/Troca'}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center text-xs text-gray-500">
            <User size={14} className="mr-1" />
            <span>{listing.author.name}</span>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Clock size={14} className="mr-1" />
            <span>{new Date(listing.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
