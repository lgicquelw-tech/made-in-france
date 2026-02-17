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
  FolderOpen,
  Sparkles,
  TrendingUp,
  Zap,
  Award
} from 'lucide-react';

const API_URL = 'http://localhost:4000';

const menuItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Marques', href: '/admin/marques', icon: Package },
  { label: 'Produits', href: '/admin/produits', icon: ShoppingBag },
  { label: 'Labels', href: '/admin/labels', icon: Award },
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
      <div className="min-h-screen bg-france-cream flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-france-blue to-france-blue/80 flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-2 w-6 rounded-full overflow-hidden">
            <span className="bg-france-blue flex-1" />
            <span className="bg-white flex-1" />
            <span className="bg-france-red flex-1" />
          </div>
        </div>
      </div>
    );
  }

  // Login
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-france-cream flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-france-blue/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-france-red/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-france-blue/5 to-france-red/5 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Login card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-soft-lg border border-white/50 p-8 md:p-10">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <div className="w-20 h-20 bg-gradient-to-br from-france-blue to-france-blue/80 rounded-2xl flex items-center justify-center mx-auto shadow-glow-blue">
                  <span className="text-white font-bold text-2xl">MiF</span>
                </div>
                {/* Tricolore indicator */}
                <div className="absolute -bottom-1 -right-1 flex h-2.5 w-8 rounded-full overflow-hidden shadow-sm">
                  <span className="bg-france-blue flex-1" />
                  <span className="bg-white flex-1" />
                  <span className="bg-france-red flex-1" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-france-blue mt-6">Super Admin</h1>
              <p className="text-gray-500 mt-1">Made in France</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue transition-all outline-none"
                  placeholder="admin@madeinfrance.fr"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-france-blue/20 focus:border-france-blue transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>

              {loginError && (
                <div className="bg-france-red/10 text-france-red px-4 py-3 rounded-xl text-sm font-medium">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-france-blue to-france-blue/90 text-white rounded-xl font-semibold hover:shadow-glow-blue transition-all duration-300 active:scale-[0.98]"
              >
                Se connecter
              </button>
            </form>

            {/* Back to site link */}
            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-gray-500 hover:text-france-blue transition-colors">
                ← Retour au site
              </Link>
            </div>
          </div>

          {/* Bottom decoration */}
          <div className="flex justify-center mt-6">
            <div className="flex h-1.5 w-24 rounded-full overflow-hidden">
              <span className="bg-france-blue flex-1" />
              <span className="bg-white flex-1 border-y border-gray-100" />
              <span className="bg-france-red flex-1" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin avec sidebar
  return (
    <div className="min-h-screen bg-france-cream flex">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-100 flex flex-col transition-all duration-300 fixed h-full z-40 shadow-soft`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-france-blue to-france-blue/80 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-sm">MiF</span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 flex h-1.5 w-4 rounded-full overflow-hidden">
                    <span className="bg-france-blue flex-1" />
                    <span className="bg-white flex-1" />
                    <span className="bg-france-red flex-1" />
                  </div>
                </div>
                <div>
                  <h1 className="font-bold text-france-blue text-sm">Super Admin</h1>
                  <p className="text-xs text-gray-400">Made in France</p>
                </div>
              </div>
            ) : (
              <div className="relative mx-auto">
                <div className="w-10 h-10 bg-gradient-to-br from-france-blue to-france-blue/80 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">MF</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 flex h-1.5 w-4 rounded-full overflow-hidden">
                  <span className="bg-france-blue flex-1" />
                  <span className="bg-white flex-1" />
                  <span className="bg-france-red flex-1" />
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-france-blue"
            >
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-france-blue to-france-blue/90 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-france-blue'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <div className={`${active ? '' : 'group-hover:scale-110'} transition-transform`}>
                  <Icon className="w-5 h-5 flex-shrink-0" />
                </div>
                {sidebarOpen && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
                {active && sidebarOpen && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick stats when collapsed */}
        {!sidebarOpen && (
          <div className="p-3 border-t border-gray-100 space-y-2">
            <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/20 flex items-center justify-center" title="Marques actives">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/20 flex items-center justify-center" title="Performance IA">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-france-blue transition-all group"
          >
            <Eye className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
            {sidebarOpen && <span className="text-sm font-medium">Voir le site</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-france-red/70 hover:bg-france-red/5 hover:text-france-red transition-all group"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
            {sidebarOpen && <span className="text-sm font-medium">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Subtle gradient overlay */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 right-0 w-96 h-96 bg-france-blue/3 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-40 w-96 h-96 bg-france-red/3 rounded-full blur-3xl" />
        </div>

        <div className="relative p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
