'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  CreditCard,
  Building2,
  BarChart3,
  Bot,
  Settings,
  LogOut,
  Eye,
  ChevronLeft,
  Menu,
  FolderOpen
} from 'lucide-react';

const API_URL = 'http://localhost:4000';

const menuItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Marques', href: '/admin/marques', icon: Package },
  { label: 'Produits', href: '/admin/produits', icon: ShoppingBag },
  { label: 'Utilisateurs', href: '/admin/utilisateurs', icon: Users },
  { label: 'Abonnements', href: '/admin/abonnements', icon: CreditCard },
  { label: 'MiF Studios', href: '/admin/studios', icon: Building2 },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'IA & Chat', href: '/admin/ia', icon: Bot },
  { label: 'Collections', href: '/admin/collections', icon: FolderOpen },
  { label: 'Système', href: '/admin/systeme', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const adminData = localStorage.getItem('admin');
    setIsLoggedIn(!!adminData);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setLoginError(data.error || 'Erreur de connexion');
        return;
      }
      
      localStorage.setItem('admin', JSON.stringify(data.data));
      setIsLoggedIn(true);
    } catch (error) {
      setLoginError('Erreur de connexion au serveur');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    setIsLoggedIn(false);
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  };

  // Loading
  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  // Login
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-france-blue to-france-red flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-france-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🇫🇷</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>
            <p className="text-gray-600 mt-2">Made in France</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-france-blue focus:border-transparent"
                placeholder="admin@madeinfrance.fr"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-france-blue focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>
            
            {loginError && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{loginError}</div>
            )}
            
            <button type="submit" className="w-full py-3 bg-france-blue text-white rounded-xl font-medium hover:bg-france-blue/90 transition-colors">
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin avec sidebar
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white flex flex-col transition-all duration-300 fixed h-full z-40`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {sidebarOpen ? (
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">🇫🇷 <span>Super Admin</span></h1>
              <p className="text-xs text-gray-400 mt-1">Made in France</p>
            </div>
          ) : (
            <span className="text-2xl mx-auto">🇫🇷</span>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  active ? 'bg-france-blue text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        
        {/* Footer */}
        <div className="p-3 border-t border-gray-800 space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all">
            <Eye className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Voir le site</span>}
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}