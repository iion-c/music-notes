import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Film, MessageSquare, Settings, LogOut, ArrowLeft } from 'lucide-react';

export default function AdminLayout() {
  const { logout, currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const navItems = [
    { name: 'Projects', path: '/admin/projects', icon: Film },
    { name: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-bg-card border-r border-border-subtle flex flex-col">
        <div className="p-6 border-b border-border-subtle">
          <h2 className="font-display text-xl font-bold text-text-primary">Matthew Admin</h2>
          <p className="font-mono text-[10px] text-text-muted mt-1 truncate">{currentUser.email}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.includes(item.path);
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded transition-colors ${
                  isActive 
                    ? 'bg-accent-red/10 text-accent-red border border-accent-red/20' 
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-primary'
                }`}
              >
                <Icon size={18} />
                <span className="font-ui text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-subtle space-y-2">
          <Link 
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded text-text-muted hover:text-text-primary hover:bg-bg-primary transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="font-ui text-sm font-medium">Back to Site</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded text-text-muted hover:text-white hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={18} />
            <span className="font-ui text-sm font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-bg-primary">
        <div className="p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
