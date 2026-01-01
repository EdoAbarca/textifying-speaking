import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { toast } from 'react-toastify';
import useAuthStore from '../store/authStore';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    setShowUserMenu(false);
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-2">
            <Icon icon="mdi:text-to-speech" className="text-indigo-600 text-3xl" />
            <span className="text-xl font-bold text-gray-900">
              Textifying Speaking
            </span>
          </Link>

          {/* Right side - Auth buttons or User menu */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Dashboard button */}
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors flex items-center gap-2"
                >
                  <Icon icon="mdi:view-dashboard" />
                  Dashboard
                </button>

                {/* Upload button */}
                <button
                  onClick={() => navigate('/upload')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium transition-colors flex items-center gap-2"
                >
                  <Icon icon="mdi:upload" />
                  Upload
                </button>
                
                {/* Logged in - Show user menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    aria-label="User menu"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                      <Icon icon="mdi:account" className="text-2xl" />
                    </div>
                  </button>

                  {/* Dropdown menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.username}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Icon icon="mdi:logout" className="text-lg" />
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Not logged in - Show CTA buttons
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium transition-colors flex items-center gap-1"
                >
                  <Icon icon="mdi:account-plus" />
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
