import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import ListingsFeed from './features/listings/components/ListingsFeed';
import ListingForm from './features/listings/components/ListingForm';
import ListingDetails from './features/listings/components/ListingDetails';
import ChatPage from './features/chat/components/ChatPage';
import ModerationDashboard from './features/moderation/components/ModerationDashboard';
import AlertsPage from './features/notifications/components/AlertsPage';
import ForumPage from './features/forum/components/ForumPage';
import NewTopicPage from './features/forum/components/NewTopicPage';
import TopicPage from './features/forum/components/TopicPage';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import { LogIn, LogOut, MessageSquare, Plus, ShieldCheck, Bell, ChevronDown, Hash } from 'lucide-react';
import { notificationService } from './features/notifications/services/notificationService';
import { chatService } from './features/chat/services/chatService';
import { io } from 'socket.io-client';

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

    const socket = io('http://localhost:3011', {
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
    <header className="bg-red-600 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <h1 className="text-2xl font-extrabold text-white group-hover:text-black transition-colors">CInplifica</h1>
          <span className="hidden sm:inline text-sm text-white font-medium">| Uma comunidade CIn </span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                to="/listings/new"
                className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
              >
                <Plus size={18} />
                <span className="hidden md:inline">Anunciar</span>
              </Link>
              
              <Link
                to="/forum"
                className="p-2 text-white hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                title="Fórum"
              >
                <Hash size={22} />
              </Link>

              <Link
                to="/chat"
                className="relative p-2 text-white hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                title="Mensagens"
              >
                <MessageSquare size={22} />
              </Link>

              <Link
                to="/alerts"
                onClick={() => setTimeout(refreshBadge, 250)}
                className="relative p-2 text-white hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
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
                  className="p-2 text-white hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
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
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-white/40" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm font-medium text-white">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={14} className={`text-white/80 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg ring-1 ring-black/5 py-1 z-50">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                      {user.picture ? (
                        <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
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
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Mural da Comunidade
        </h2>
        <p className="mt-3 text-xl text-gray-500 sm:mt-4">
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
        ? 'Acesso restrito a estudantes com email @cin.ufpe.br.'
        : 'Não foi possível concluir a autenticação.';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center bg-white border border-red-100 rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Login não autorizado</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            Voltar ao mural
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center animate-pulse">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Autenticando...</h2>
        <p className="text-gray-500">Aguarde um momento enquanto finalizamos seu login.</p>
      </div>
    </div>
  );
};

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
    <div className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
      <div className="max-w-sm w-full text-center bg-white rounded-2xl shadow-lg p-10">
        <h1 className="text-4xl font-extrabold text-red-600 mb-1">CInplifica</h1>
        <p className="text-gray-400 text-sm mb-8">Uma comunidade CIn</p>
        <p className="text-gray-600 text-sm mb-6">
          Use seu email institucional <strong>@cin.ufpe.br</strong> para acessar a plataforma.
        </p>
        <a
          href="/api/auth/login"
          className="flex items-center justify-center gap-3 w-full bg-red-600 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shadow"
        >
          <LogIn size={18} />
          Entrar com Google (@cin.ufpe.br)
        </a>
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
    <div className="min-h-screen bg-amber-50">
      <Header />
      <Routes>
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/success" element={<AuthSuccess />} />
        <Route path="/listings/:id" element={<ListingDetails />} />
        <Route path="/listings/new" element={<ProtectedRoute><ListingForm /></ProtectedRoute>} />
        <Route path="/listings/:id/edit" element={<ProtectedRoute><ListingForm /></ProtectedRoute>} />
        <Route path="/forum" element={<ProtectedRoute><ForumPage /></ProtectedRoute>} />
        <Route path="/forum/novo" element={<ProtectedRoute><NewTopicPage /></ProtectedRoute>} />
        <Route path="/forum/:id" element={<ProtectedRoute><TopicPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
        <Route path="/moderation" element={<ProtectedRoute requiredRoles={['ADMIN', 'MODERATOR']}><ModerationDashboard /></ProtectedRoute>} />
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
