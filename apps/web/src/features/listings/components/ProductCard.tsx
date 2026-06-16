import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Loader2, MessageSquare, User } from 'lucide-react';
import { chatService } from '../../chat/services/chatService';
import { useAuth } from '../../../shared/context/AuthContext';
import { Listing } from '../services/types';

interface ProductCardProps {
  listing: Listing;
}

const ProductCard: React.FC<ProductCardProps> = ({ listing }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [contactLoading, setContactLoading] = React.useState(false);
  const [contactError, setContactError] = React.useState<string | null>(null);

  const formatPrice = () => {
    if (listing.isFree) return 'Grátis/Doação';
    if (listing.category !== 'SALE' && listing.price === null) return 'Grátis/Troca';
    if (listing.price === null) return 'N/A';

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(listing.price);
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

  const isOwnListing = user?.id === listing.author.id;

  const handleStartConversation = async () => {
    if (!isAuthenticated) {
      window.location.href = '/api/auth/login';
      return;
    }

    if (isOwnListing || contactLoading) return;

    setContactLoading(true);
    setContactError(null);

    try {
      const conversation = await chatService.startConversation(listing.author.id, listing.id);
      navigate('/chat', { state: { conversationId: conversation.id } });
    } catch (err) {
      console.error(err);
      setContactError('Não foi possível iniciar a negociação.');
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <Link
        to={`/listings/${listing.id}`}
        className="flex flex-col flex-grow focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
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
              {formatPrice()}
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
      </Link>

      <div className="px-4 pb-4">
        {contactError && (
          <p className="mb-2 text-xs text-red-600">{contactError}</p>
        )}
        <button
          type="button"
          onClick={handleStartConversation}
          disabled={contactLoading || isOwnListing}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-red-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
        >
          {contactLoading ? <Loader2 className="animate-spin" size={16} /> : <MessageSquare size={16} />}
          {isOwnListing ? 'Este anúncio é seu' : 'Iniciar negociação'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
