import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, Lock, LayoutDashboard, FolderTree, Building2 } from 'lucide-react';
import { UpdatePassword } from './UpdatePassword';
import { InstanceSelector } from './InstanceSelector';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showUserMenu]);

  const handleUserMenuClick = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleUpdatePassword = () => {
    setShowUserMenu(false);
    setShowUpdatePassword(true);
  };

  const handleSignOut = () => {
    setShowUserMenu(false);
    logout();
  };

  // Get user initials from email for placeholder
  const getUserInitials = (email: string | undefined): string => {
    if (!email) return 'U';
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email[0].toUpperCase();
  };

  // Get background color based on email (for consistent color per user)
  const getAvatarColor = (email: string | undefined): string => {
    if (!email) return 'bg-blue-500';
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-green-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500',
    ];
    const index = email.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 sm:space-x-6 flex-1 min-w-0">
              <div className="flex items-center min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Vocatree</h1>
                <span className="ml-2 text-xs sm:text-sm text-gray-500 hidden sm:inline">English Vocabulary</span>
              </div>
              
              {/* Navigation - Desktop */}
              <nav className="hidden md:flex items-center space-x-1">
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/tree"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/tree'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FolderTree className="h-4 w-4" />
                  <span>Library</span>
                </Link>
                <Link
                  to="/collections"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/collections'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>Collections</span>
                </Link>
              </nav>

              {/* Navigation - Mobile */}
              <nav className="md:hidden flex items-center space-x-1 ml-auto mr-2">
                <Link
                  to="/dashboard"
                  className={`p-2 rounded-md transition-colors ${
                    location.pathname === '/dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Dashboard"
                  aria-label="Dashboard"
                >
                  <LayoutDashboard className="h-5 w-5" />
                </Link>
                <Link
                  to="/tree"
                  className={`p-2 rounded-md transition-colors ${
                    location.pathname === '/tree'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Library"
                  aria-label="Library"
                >
                  <FolderTree className="h-5 w-5" />
                </Link>
                <Link
                  to="/collections"
                  className={`p-2 rounded-md transition-colors ${
                    location.pathname === '/collections'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Collections"
                  aria-label="Collections"
                >
                  <Building2 className="h-5 w-5" />
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <InstanceSelector />
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={handleUserMenuClick}
                  className="flex items-center justify-center w-10 h-10 rounded-full hover:ring-2 hover:ring-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="User menu"
                  aria-expanded={showUserMenu}
                  aria-haspopup="menu"
                >
                  {/* Profile Photo Placeholder */}
                  <div className={`w-10 h-10 rounded-full ${getAvatarColor(user?.email)} flex items-center justify-center text-white font-medium text-sm shadow-sm`}>
                    {user?.email ? (
                      getUserInitials(user.email)
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
                    role="menu"
                  >
                    <button
                      onClick={handleUpdatePassword}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      role="menuitem"
                    >
                      <Lock className="h-4 w-4 mr-3" />
                      Update Password
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Update Password Modal */}
      {showUpdatePassword && (
        <UpdatePassword onClose={() => setShowUpdatePassword(false)} />
      )}
    </div>
  );
};

