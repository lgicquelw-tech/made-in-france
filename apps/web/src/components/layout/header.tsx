'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Menu, X, Heart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marques?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { href: '/marques', label: 'Marques' },
    { href: '/regions', label: 'Régions' },
    { href: '/a-propos', label: 'À propos' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🇫🇷</span>
            <span className="font-bold text-xl text-gray-900">
              Made in <span className="text-france-blue">France</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-france-blue font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Search toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-gray-600 hover:text-france-blue transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Favorites */}
            <button className="p-2 text-gray-600 hover:text-france-red transition-colors">
              <Heart className="h-5 w-5" />
            </button>

            {/* Login button */}
            <Button variant="outline" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              Connexion
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Search bar (desktop) */}
        {showSearch && (
          <div className="hidden md:block pb-4">
            <form onSubmit={handleSearch} className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une marque..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-france-blue focus:ring-2 focus:ring-france-blue/20 outline-none"
                />
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="container py-4 space-y-4">
            {/* Mobile search */}
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une marque..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-france-blue outline-none"
                />
              </div>
            </form>

            {/* Mobile nav links */}
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <Button variant="outline" className="flex-1 gap-2">
                <Heart className="h-4 w-4" />
                Favoris
              </Button>
              <Button className="flex-1 gap-2">
                <User className="h-4 w-4" />
                Connexion
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}