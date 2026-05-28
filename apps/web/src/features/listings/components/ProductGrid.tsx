import React from 'react';
import { Listing } from '../services/types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  listings: Listing[];
}

const ProductGrid: React.FC<ProductGridProps> = ({ listings }) => {
  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Nenhum anúncio encontrado.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {listings.map((listing) => (
        <ProductCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
};

export default ProductGrid;
