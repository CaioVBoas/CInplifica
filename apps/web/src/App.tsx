import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import ListingsFeed from './features/listings/components/ListingsFeed';
import ListingForm from './features/listings/components/ListingForm';
import ListingDetails from './features/listings/components/ListingDetails';
import MyListingsPage from './features/listings/components/MyListingsPage';
import ChatPage from './features/chat/components/ChatPage';
import ModerationDashboard from './features/moderation/components/ModerationDashboard';
import AlertsPage from './features/notifications/components/AlertsPage';
import ForumPage from './features/forum/components/ForumPage';
import NewTopicPage from './features/forum/components/NewTopicPage';
import TopicPage from './features/forum/components/TopicPage';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import { LogIn, LogOut, MessageSquare, Plus, ShieldCheck, Bell, ChevronDown, Hash, Package, Lock } from 'lucide-react';
import { notificationService } from './features/notifications/services/notificationService';
import { chatService } from './features/chat/services/chatService';
import { io } from 'socket.io-client';

const getUserInitial = (name: string) => name.trim().charAt(0).toUpperCase() || '?';

interface UserAvatarProps {
  name: string;
  picture?: string;
  sizeClass: string;
  fallbackClassName: string;
  imageClassName?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  picture,
  sizeClass,
  fallbackClassName,
  imageClassName = '',
}) => {
  const [imageFailed, setImageFailed] = React.useState(false);
  React.useEffect(() => {
    setImageFailed(false);
  }, [picture]);
  if (picture && !imageFailed) {
    return (
      <img
        src={picture}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImageFailed(true)}
        className={`${sizeClass} rounded-full object-cover ${imageClassName}`}
      />
    );
  }
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-semibold ${fallbackClassName}`}>
      {getUserInitial(name)}
    </div>
  );
};

const Header: React.FC = () => {
  const { user, token, isAuthenticated, logout } = useAuth();
  const canModerate = user?.role === 'ADMIN' || user?.role === 'MODERATOR';
  const [badgeCount, setBadgeCount] = React.useState(0);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const refreshBadge = React.useCallback(async () => {
    if (!isAuthenticated) {
      setBadgeCount(0);
      return;
    }
    try {
      const [notifications, messages] = await Promise.all([
        notificationService.fetchUnreadCount('INTEREST_ALERT'),
        chatService.fetchUnreadCount(),
      ]);
      setBadgeCount(notifications.count + messages.count);
    } catch {
      setBadgeCount(0);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    refreshBadge();
  }, [refreshBadge]);

  React.useEffect(() => {
    if (!token) return;
    const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
      auth: { token },
      transports: ['websocket'],
    });
    socket.on('unread_count_updated', refreshBadge);
    socket.on('new_message', refreshBadge);
    return () => {
      socket.close();
    };
  }, [refreshBadge, token]);

  return (
    <header className="bg-red-600 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <h1 className="text-2xl font-extrabold text-white group-hover:text-red-100 transition-colors">CInplifica</h1>
          <span className="hidden sm:inline text-sm text-red-100 font-medium">| Uma comunidade CIn </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/listings/new"
                className="flex items-center gap-2 bg-white text-red-600 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-red-50 transition-colors shadow-sm"
              >
                <Plus size={18} />
                <span className="hidden md:inline">Anunciar</span>
              </Link>

              <Link
                to="/forum"
                className="p-2 text-white hover:bg-red-700 rounded-full transition-all"
                title="Fórum"
              >
                <Hash size={22} />
              </Link>
              <Link
                to="/chat"
                className="relative p-2 text-white hover:bg-red-700 rounded-full transition-all"
                title="Mensagens"
              >
                <MessageSquare size={22} />
              </Link>
              <Link
                to="/alerts"
                onClick={() => setTimeout(refreshBadge, 250)}
                className="relative p-2 text-white hover:bg-red-700 rounded-full transition-all"
                title="Alertas"
              >
                <Bell size={22} />
                {badgeCount > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-yellow-300 px-1.5 py-0.5 text-center text-[10px] font-bold text-red-900">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </Link>
              {canModerate && (
                <Link
                  to="/moderation"
                  className="p-2 text-white hover:bg-red-700 rounded-full transition-all"
                  title="Moderação"
                >
                  <ShieldCheck size={22} />
                </Link>
              )}
              <div className="h-8 w-px bg-white/30 hidden sm:block mx-1"></div>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-white/10 transition-colors"
                >
                  <UserAvatar
                    name={user.name}
                    picture={user.picture}
                    sizeClass="w-8 h-8"
                    fallbackClassName="bg-white/20 text-white text-sm ring-2 ring-white/40"
                    imageClassName="ring-2 ring-white/40"
                  />
                  <span className="hidden sm:inline text-sm font-medium text-white">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={14} className={`text-white/80 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg ring-1 ring-black/5 py-1 z-50">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                      <UserAvatar
                        name={user.name}
                        picture={user.picture}
                        sizeClass="w-10 h-10"
                        fallbackClassName="bg-red-100 text-red-600"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      to="/meus-anuncios"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Package size={15} />
                      Meus anúncios
                    </Link>
                    <button
                      onClick={() => { setMenuOpen(false); logout(); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 bg-white text-red-600 px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-50 transition-colors shadow-sm"
            >
              <LogIn size={18} />
              <span>Entrar</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

const Home: React.FC = () => {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-8 text-center sm:text-left">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl tracking-tight">
          Mural da Comunidade
        </h2>
        <p className="mt-3 text-lg text-gray-500 sm:mt-4">
          Encontre o que você perdeu, compre novos itens ou anuncie para seus colegas do CIn: a comunidade é toda sua!
        </p>
      </section>
      <ListingsFeed />
    </main>
  );
};

const AuthSuccess: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const error = new URLSearchParams(location.search).get('error');

  useEffect(() => {
    if (error) return;
    const token = new URLSearchParams(location.search).get('token');
    if (token) {
      login(token);
    } else {
      navigate('/', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (error) {
    const message =
      error === 'unauthorized_domain'
        ? 'Acesso restrito a estudantes e servidores com e-mail institucional @cin.ufpe.br.'
        : 'Não foi possível concluir a autenticação.';
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
        <div className="max-w-md text-center bg-white border border-red-100 rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Login não autorizado</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors shadow-sm"
          >
            Voltar ao mural
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50">
      <div className="text-center animate-pulse">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Autenticando...</h2>
        <p className="text-gray-500">Aguarde um momento enquanto finalizamos seu login.</p>
      </div>
    </div>
  );
};

const LOGIN_ANNOUNCEMENTS = [
  { emoji: '📚', text: 'Doação: Livros de Cálculo', sub: 'Materiais · Grátis' },
  { emoji: '🔑', text: 'Chave de carro no Grad 5', sub: 'Achados e perdidos' },
  { emoji: '💻', text: 'Troco monitor 24" por teclado mecânico', sub: 'Troca · Eletrônicos' },
  { emoji: '📝', text: 'Monitoria de IP', sub: 'Anúncio Acadêmico' },
  { emoji: '☕', text: 'Grupo de Estudos para Maratona', sub: 'Grupos · Cursos' },
  { emoji: '🎒', text: 'Mochila preta no Bloco A', sub: 'Achados e perdidos' },
  { emoji: '🎨', text: 'Material para desenho', sub: 'Disponível para troca' },
  { emoji: '💡', text: 'Minicurso de Introdução ao React', sub: 'Eventos · Cursos' },
];


const CARD_POSITIONS = [
  { left: '6%',  top: '8%'  },
  { left: '52%', top: '18%' },
  { left: '10%', top: '33%' },
  { left: '70%', top: '44%' },
  { left: '4%',  top: '58%' },
  { left: '50%', top: '68%' },
  { left: '14%', top: '79%' },
  { left: '53%', top: '87%' },
];

const LoginPage: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, location.state]);

  return (
    <div className="min-h-screen flex overflow-hidden font-sans">
      
      {/* ── PAINEL ESQUERDO (Apenas Desktop) ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-red-600 to-red-900 flex-col items-center justify-center">
        {/* Blobs decorativos de fundo */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-[45%] left-[30%] w-44 h-44 rounded-full bg-white/5 pointer-events-none" />

        {/* Brand/Logo Central */}
        <div className="relative z-10 text-center space-y-2 animate-fade-in-up">
          <h1 className="text-5xl font-black text-white tracking-tight">
            CInplifica
          </h1>
          <p className="text-white/70 text-lg font-light">
            A comunidade que conecta o CIn
          </p>
        </div>

        {/* Cards Flutuantes de Simulação de Anúncios */}
        {LOGIN_ANNOUNCEMENTS.map((ann, i) => (
          <div
            key={i}
            className="absolute z-55 pointer-events-none transition-transform duration-500 ease-out"
            style={{
              left: CARD_POSITIONS[i].left,
              top: CARD_POSITIONS[i].top,
            }}
          >
            <div className="animate-bounce" style={{ animationDuration: `${4 + i * 0.5}s` }}>
              <div className="bg-white/10 border border-white/20 rounded-xl p-3 flex items-center gap-3 min-w-[160px] max-w-[220px] backdrop-blur-md shadow-lg">
                <span className="text-xl flex-shrink-0">{ann.emoji}</span>
                <div className="min-w-0">
                  <p className="text-white text-xs font-semibold truncate m-0 leading-tight">{ann.text}</p>
                  <p className="text-white/60 text-[10px] m-0 mt-0.5 truncate">{ann.sub}</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Tagline inferior */}
        <div className="absolute bottom-6 left-0 right-0 text-center z-10">
          <p className="text-white/40 text-xs tracking-widest font-semibold uppercase">
            COMPRE · VENDA · TROQUE · CONECTE-SE
          </p>
        </div>
      </div>

      {/* ── PAINEL DIREITO (Formulário/Acesso) ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-amber-50/50">
        
        {/* Identidade visual visível apenas no Mobile */}
        <div className="lg:hidden text-center mb-8">
          <h1 className="text-4xl font-black text-red-600 tracking-tight">
            CInplifica
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            A comunidade que conecta o CIn
          </p>
        </div>

        {/* Card do Container de Login */}
        <div className="bg-white rounded-2xl p-8 sm:p-10 w-full max-w-[400px] shadow-xl border border-gray-100">
          <p className="text-xs font-bold tracking-wider text-red-600 uppercase mb-2">
            CIn · UFPE
          </p>

          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">
            Bem-vindo de volta
          </h2>

          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Use o seu e-mail institucional <strong className="text-gray-700 font-semibold">@cin.ufpe.br</strong> para acessar anúncios, canais de bate-papo e o fórum local.
          </p>

          {/* Botão de Autenticação do Google */}
          <a
            href="/api/auth/login"
            className="flex items-center justify-center gap-3 w-full bg-red-600 text-white py-3.5 px-4 rounded-xl font-semibold text-sm hover:bg-red-700 transition-all duration-200 transform hover:-translate-y-0.5 shadow-md hover:shadow-red-600/20"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.278 17.64 11.97 17.64 9.2z"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
              <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Entrar com Google
          </a>

          <hr className="my-6 border-gray-100" />

          {/* Nota de Segurança/Regra de negócio */}
          <div className="bg-red-50 rounded-xl p-4 flex gap-3 items-start">
            <Lock className="text-red-600 w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-red-900 text-xs leading-relaxed">
              Acesso exclusivo para membros validados do Centro de Informática. O login via Google serve unicamente como autenticador de domínio.
            </p>
          </div>
        </div>

        <p className="text-gray-400 text-[11px] mt-6 text-center">
          CInplifica · Centro de Informática · UFPE · Recife
        </p>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRoles?: string[] }> = ({
  children,
  requiredRoles,
}) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <p className="text-gray-400 animate-pulse">Carregando...</p>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-amber-50/40">
      <Header />
      <Routes>
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/success" element={<AuthSuccess />} />
        <Route path="/listings/:id" element={<ProtectedRoute><ListingDetails /></ProtectedRoute>} />
        <Route path="/listings/new" element={<ProtectedRoute><ListingForm /></ProtectedRoute>} />
        <Route path="/listings/:id/edit" element={<ProtectedRoute><ListingForm /></ProtectedRoute>} />
        <Route path="/forum" element={<ProtectedRoute><ForumPage /></ProtectedRoute>} />
        <Route path="/forum/novo" element={<ProtectedRoute><NewTopicPage /></ProtectedRoute>} />
        <Route path="/forum/:id" element={<ProtectedRoute><TopicPage /></ProtectedRoute>} />
        <Route path="/meus-anuncios" element={<ProtectedRoute><MyListingsPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
        <Route
          path="/moderation"
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'MODERATOR']}>
              <ModerationDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;