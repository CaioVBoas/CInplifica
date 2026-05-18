import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import ListingsFeed from './features/listings/components/ListingsFeed';
import ListingForm from './features/listings/components/ListingForm';
import ChatPage from './features/chat/components/ChatPage';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import { LogIn, LogOut, User as UserIcon, MessageSquare, Plus } from 'lucide-react';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <h1 className="text-2xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">CInplifica</h1>
          <span className="hidden sm:inline text-sm text-gray-500 font-medium">| Comunidade CIn-UFPE</span>
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
                to="/chat" 
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                title="Mensagens"
              >
                <MessageSquare size={22} />
              </Link>

              <div className="h-8 w-px bg-gray-200 hidden sm:block mx-1"></div>

              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <UserIcon size={18} />
                </div>
                <span className="hidden sm:inline">{user.name}</span>
              </div>
              
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <LogIn size={18} />
              <span>Entrar com CIn-SSO</span>
            </button>
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
          Encontre o que você precisa ou anuncie para seus colegas do CIn.
        </p>
      </section>
      <ListingsFeed />
    </main>
  );
};

const AuthSuccess: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      login(token);
      navigate('/', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [location, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center animate-pulse">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Autenticando...</h2>
        <p className="text-gray-500">Aguarde um momento enquanto finalizamos seu login.</p>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth/success" element={<AuthSuccess />} />
        <Route path="/listings/new" element={<ListingForm />} />
        <Route path="/chat" element={<ChatPage />} />
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
