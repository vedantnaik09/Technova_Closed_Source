import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLandingPage = location.pathname === '/';
  const { logout } = useAuth();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUserFromLocalStorage = () => {
      try {
        const userString = localStorage.getItem('user');
        const parsedUser = userString ? JSON.parse(userString) : null;
        return parsedUser;
      } catch (error) {
        console.error('Error retrieving user from localStorage:', error);
        return null;
      }
    };

    setUser(getUserFromLocalStorage());
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('user');
      setUser(null);
      navigate('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const navLinks = {
    'COMPANY_OWNER': [
      { to: '/create-company', label: 'Company' },
      { to: '/create-project', label: 'Projects' },
      { to: '/add-company-employee', label: 'Employees' },
    ],
    'PROJECT_MANAGER': [
      { to: '/project-employees', label: 'Project Team' },
      { to: '/add-project-employee', label: 'Manage Team' },
      { to: '/schedule-meeting', label: 'Create Meet' },
    ],
    'EMPLOYEE': [
      { to: '/dashboardEmployee', label: 'Dashboard' },
      { to: '/task-view', label: 'View Tasks' },
      { to: '/employeeMeet', label: 'Meetings' },
      { to: '/upload-resume', label: 'Upload Resume' },
    ],
  };

  const renderNavLinks = () => {
    if (!user) return null;

    const links = navLinks[user.role];
    if (!links) return null;

    return (
      <div className="hidden md:flex ml-10 space-x-8">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="text-gray-300 hover:text-white transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    );
  };

  return (
    <nav className="fixed top-0 w-full bg-black/95 backdrop-blur-sm border-b border-zinc-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold gradient-text">
              CloSo
            </Link>
            {user && renderNavLinks()}
          </div>
          <div className="flex items-center space-x-4">
            {!user ? (
              isLandingPage ? (
                <>
                  <Link to="/login" className="btn-secondary">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Get Started
                  </Link>
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
