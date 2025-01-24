import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <nav className="fixed top-0 w-full bg-black/95 backdrop-blur-sm border-b border-zinc-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold gradient-text">TeamAI</Link>
            {user && !isLandingPage && (
              <div className="hidden md:flex ml-10 space-x-8">
                <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link to="/analytics" className="text-gray-300 hover:text-white transition-colors">
                  Analytics
                </Link>
                <Link to="/team" className="text-gray-300 hover:text-white transition-colors">
                  Team
                </Link>
                <Link to="/settings" className="text-gray-300 hover:text-white transition-colors">
                  Settings
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {!user ? (
              isLandingPage ? (
                <>
                  <Link to="/login" className="btn-secondary">Login</Link>
                  <Link to="/register" className="btn-primary">Get Started</Link>
                </>
              ) : null
            ) : (
              <button onClick={handleLogout} className="btn-secondary">
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}