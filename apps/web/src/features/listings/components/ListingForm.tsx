import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Camera,
  DollarSign,
  FileText,
  Gift,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Package,
  Plus,
  Save,
  Tag,
  User,
  X,
} from 'lucide-react';
import { ListingCategory, ListingStatus, LostFoundStatus } from '../services/types';
import { listingsService } from '../services/listingsService';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const statusOptions: { value: ListingStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'SOLD', label: 'Vendido' },
  { value: 'FINALIZED', label: 'Finalizado' },
  { value: 'RETURNED', label: 'Devolvido' },
  { value: 'INACTIVE', label: 'Inativo' },
];

const lostFoundStatusOptions: { value: LostFoundStatus; label: string }[] = [
  { value: 'LOST', label: 'Perdido' },
  { value: 'FOUND', label: 'Encontrado' },
  { value: 'WITH_FINDER', label: 'Em posse do achador' },
  { value: 'RETURNED', label: 'Devolvido' },
];

const toDateTimeInputValue = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
};

const ListingForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'SALE' as ListingCategory,
    status: 'ACTIVE' as ListingStatus,
    isFree: false,
    lostFoundLocation: '',
    lostFoundOccurredAt: '',
    lostFoundStatus: 'LOST' as LostFoundStatus,
    academicExternalLink: '',
    academicSubject: '',
    academicProfessor: '',
    academicTerm: '',
  });

  useEffect(() => {
    if (!id) return;

    const loadListing = async () => {
      setInitialLoading(true);
      setError(null);
      try {
        const listing = await listingsService.fetchListingById(id);
        setFormData({
          title: listing.title,
          description: listing.description,
          price: listing.price === null ? '' : String(listing.price),
          category: listing.category,
          status: listing.status,
          isFree: listing.isFree,
          lostFoundLocation: listing.lostFoundLocation ?? '',
          lostFoundOccurredAt: toDateTimeInputValue(listing.lostFoundOccurredAt),
          lostFoundStatus: listing.lostFoundStatus ?? 'LOST',
          academicExternalLink: listing.academicExternalLink ?? '',
          academicSubject: listing.academicSubject ?? '',
          academicProfessor: listing.academicProfessor ?? '',
          academicTerm: listing.academicTerm ?? '',
        });
        setCurrentImageUrl(listing.imageUrl);
      } catch (err) {
        console.error(err);
        setError('Não foi possível carregar o anúncio para edição.');
      } finally {
        setInitialLoading(false);
      }
    };

    loadListing();
  }, [id]);

  useEffect(() => {
    if (!selectedImage) {
      setSelectedImagePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setSelectedImagePreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let imageUrl: string | null | undefined = currentImageUrl;
      if (selectedImage) {
        const upload = await listingsService.uploadListingImage(selectedImage);
        imageUrl = upload.imageUrl;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        price: formData.isFree ? 0 : formData.price ? parseFloat(formData.price) : null,
        category: formData.category,
        imageUrl,
        status: formData.status,
        isFree: formData.category === 'ACADEMIC' ? formData.isFree : false,
        lostFoundLocation: formData.category === 'LOST_FOUND' ? formData.lostFoundLocation : null,
        lostFoundOccurredAt: formData.category === 'LOST_FOUND' ? formData.lostFoundOccurredAt || null : null,
        lostFoundStatus: formData.category === 'LOST_FOUND' ? formData.lostFoundStatus : null,
        academicExternalLink: formData.category === 'ACADEMIC' ? formData.academicExternalLink : null,
        academicSubject: formData.category === 'ACADEMIC' ? formData.academicSubject : null,
        academicProfessor: formData.category === 'ACADEMIC' ? formData.academicProfessor : null,
        academicTerm: formData.category === 'ACADEMIC' ? formData.academicTerm : null,
      };

      if (isEditing && id) {
        const updatedListing = await listingsService.updateListing(id, payload);
        navigate(`/listings/${updatedListing.id}`);
      } else {
        await listingsService.createListing(payload);
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar anúncio. Verifique sua conexão e os dados inseridos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'category') {
      const category = value as ListingCategory;
      setFormData((prev) => ({
        ...prev,
        category,
        isFree: category === 'ACADEMIC' ? prev.isFree : false,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFreeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      isFree: checked,
      price: checked ? '0' : prev.price,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) {
      setSelectedImage(null);
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setSelectedImage(null);
      e.target.value = '';
      setError('Envie uma imagem em JPG, PNG, WebP ou GIF.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setSelectedImage(null);
      e.target.value = '';
      setError('A imagem deve ter no máximo 5 MB.');
      return;
    }

    setSelectedImage(file);
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setCurrentImageUrl(null);
  };

  const displayImageUrl = selectedImagePreviewUrl || currentImageUrl;

  if (initialLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="animate-spin text-red-600 mb-4" size={44} />
          <p className="text-gray-600">Carregando anúncio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-red-600 mb-6 transition-colors group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Voltar</span>
      </button>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
        <div className="bg-red-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white">
            {isEditing ? 'Editar anúncio' : 'Criar novo anúncio'}
          </h2>
          <p className="text-red-100 text-sm mt-1">
            {isEditing ? 'Atualize os detalhes do anúncio.' : 'Preencha os detalhes abaixo para publicar no mural.'}
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-sm">
              <p className="font-medium text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <Package size={16} className="text-red-500" />
                    Título
                  </span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Monitor Gamer 144Hz"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <Tag size={16} className="text-red-500" />
                    Categoria
                  </span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white cursor-pointer"
                >
                  <option value="SALE">Venda</option>
                  <option value="LOST_FOUND">Achados e Perdidos</option>
                  <option value="ACADEMIC">Acadêmico / Doação</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <DollarSign size={16} className="text-red-500" />
                    Preço
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">R$</span>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    disabled={formData.isFree || formData.category === 'LOST_FOUND'}
                    placeholder="0,00"
                    className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white cursor-pointer"
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {formData.category === 'LOST_FOUND' && (
              <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 rounded-lg border border-orange-100 bg-orange-50 p-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <MapPin size={16} className="text-orange-600" />
                      Local
                    </span>
                  </label>
                  <input
                    type="text"
                    name="lostFoundLocation"
                    value={formData.lostFoundLocation}
                    onChange={handleChange}
                    placeholder="Ex: Biblioteca, bloco A"
                    className="w-full px-4 py-2.5 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-orange-600" />
                      Data/hora aproximada
                    </span>
                  </label>
                  <input
                    type="datetime-local"
                    name="lostFoundOccurredAt"
                    value={formData.lostFoundOccurredAt}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status do item</label>
                  <select
                    name="lostFoundStatus"
                    value={formData.lostFoundStatus}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white cursor-pointer"
                  >
                    {lostFoundStatusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </section>
            )}

            {formData.category === 'ACADEMIC' && (
              <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 rounded-lg border border-red-100 bg-red-50 p-4">
                <label className="sm:col-span-2 flex items-center gap-3 rounded-lg border border-red-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.isFree}
                    onChange={handleFreeChange}
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <Gift size={16} className="text-red-500" />
                  Material gratuito ou doação
                </label>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <BookOpen size={16} className="text-red-500" />
                      Disciplina
                    </span>
                  </label>
                  <input
                    type="text"
                    name="academicSubject"
                    value={formData.academicSubject}
                    onChange={handleChange}
                    placeholder="Ex: Algoritmos"
                    className="w-full px-4 py-2.5 border border-red-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <User size={16} className="text-red-500" />
                      Professor
                    </span>
                  </label>
                  <input
                    type="text"
                    name="academicProfessor"
                    value={formData.academicProfessor}
                    onChange={handleChange}
                    placeholder="Ex: Profa. Ana"
                    className="w-full px-4 py-2.5 border border-red-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Período</label>
                  <input
                    type="text"
                    name="academicTerm"
                    value={formData.academicTerm}
                    onChange={handleChange}
                    placeholder="Ex: 2026.1"
                    className="w-full px-4 py-2.5 border border-red-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <LinkIcon size={16} className="text-red-500" />
                      Link externo
                    </span>
                  </label>
                  <input
                    type="url"
                    name="academicExternalLink"
                    value={formData.academicExternalLink}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 border border-red-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  />
                </div>
              </section>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <Camera size={16} className="text-red-500" />
                  Imagem
                </span>
              </label>
              <input
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                onChange={handleImageChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all file:mr-4 file:rounded-md file:border-0 file:bg-red-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-red-700 hover:file:bg-red-100"
              />
              <p className="mt-2 text-xs text-gray-500">Formatos aceitos: JPG, PNG, WebP ou GIF. Tamanho máximo: 5 MB.</p>

              {displayImageUrl && (
                <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  <div className="relative aspect-video">
                    <img src={displayImageUrl} alt="Prévia da imagem do anúncio" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={clearSelectedImage}
                      className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-gray-700 shadow hover:bg-white"
                      aria-label="Remover imagem"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="px-4 py-3 text-sm text-gray-600">
                    {selectedImage?.name || 'Imagem atual do anúncio'}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <FileText size={16} className="text-red-500" />
                  Descrição
                </span>
              </label>
              <textarea
                name="description"
                required
                rows={5}
                value={formData.description}
                onChange={handleChange}
                placeholder="Dê detalhes sobre o estado do item, local de entrega, etc."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none placeholder:text-gray-400"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3.5 rounded-lg font-bold text-lg hover:bg-red-700 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={22} />
                    <span>Salvando...</span>
                  </>
                ) : isEditing ? (
                  <>
                    <Save size={22} />
                    <span>Salvar alterações</span>
                  </>
                ) : (
                  <>
                    <Plus size={22} />
                    <span>Publicar anúncio</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ListingForm;
