'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Search, Menu, X, Heart, User, LogOut, ChevronDown, Building2, ShoppingBag, Loader2, Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchBrand {
  type: 'brand';
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  city: string | null;
  sector: string | null;
  sectorColor: string | null;
}

interface SearchProduct {
  type: 'product';
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  brandName: string;
  brandSlug: string;
  sectorColor: string | null;
}

interface AIProduct {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  priceMin: number | null;
  brandName: string;
  sectorColor: string;
}

export function Header() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Mode IA
  const [isAIMode, setIsAIMode] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [aiProducts, setAiProducts] = useState<AIProduct[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);
  
  // Search results
  const [searchResults, setSearchResults] = useState<{ brands: SearchBrand[]; products: SearchProduct[] }>({ brands: [], products: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search (only in classic mode)
  useEffect(() => {
    if (isAIMode) return;
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults({ brands: [], products: [] });
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/v1/search/all?q=${encodeURIComponent(searchQuery)}&limit=5`);
        const data = await res.json();
        setSearchResults({ brands: data.brands || [], products: data.products || [] });
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, isAIMode]);

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset AI response when switching modes or closing
  useEffect(() => {
    if (!showSearch || !isAIMode) {
      setAiResponse('');
      setAiProducts([]);
    }
  }, [showSearch, isAIMode]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (isAIMode) {
      // Mode IA - Appeler l'API chat
      setIsAILoading(true);
      setShowResults(true);
      try {
        const res = await fetch('http://localhost:4000/api/v1/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: searchQuery }),
        });
        const data = await res.json();
        setAiResponse(data.message || '');
        setAiProducts(data.products || []);
      } catch (error) {
        console.error('AI Search error:', error);
        setAiResponse('Désolé, une erreur est survenue.');
      } finally {
        setIsAILoading(false);
      }
    } else {
      // Mode classique - Rediriger vers la page recherche
      router.push(`/recherche?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setShowResults(false);
      setSearchQuery('');
    }
  };

  const handleResultClick = () => {
    setShowResults(false);
    setShowSearch(false);
    setSearchQuery('');
    setAiResponse('');
    setAiProducts([]);
  };

  const formatPrice = (min: number | null, max: number | null) => {
    if (!min) return null;
    if (min === max || !max) return `${min.toFixed(0)} €`;
    return `${min.toFixed(0)} - ${max.toFixed(0)} €`;
  };

  const navLinks = [
    { href: '/marques', label: 'Marques' },
    { href: '/secteurs', label: 'Secteurs' },
    { href: '/regions', label: 'Régions' },
    { href: '/carte', label: 'Carte' },
    { href: '/a-propos', label: 'À propos' },
  ];

  const hasResults = searchResults.brands.length > 0 || searchResults.products.length > 0;
  const hasAIResults = aiResponse || aiProducts.length > 0;

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
            {navLinks.map((link: any) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-medium transition-colors ${
                  link.isPro 
                    ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 rounded-lg hover:opacity-90' 
                    : 'text-gray-600 hover:text-france-blue'
                }`}
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
            <Link 
              href="/favoris"
              className="p-2 text-gray-600 hover:text-france-red transition-colors"
            >
              <Heart className="h-5 w-5" />
            </Link>

            {/* User section */}
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'Avatar'}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-france-blue text-white flex items-center justify-center text-sm font-medium">
                      {session.user.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {/* User dropdown */}
                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowUserMenu(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-medium text-gray-900">{session.user.name}</p>
                        <p className="text-sm text-gray-500">{session.user.email}</p>
                      </div>
                      <Link
                        href="/profil"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        <User className="h-4 w-4" />
                        Mon profil
                      </Link>
                      <Link
                        href="/favoris"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        <Heart className="h-4 w-4" />
                        Mes favoris
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          signOut({ callbackUrl: '/' });
                        }}
                        className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 w-full"
                      >
                        <LogOut className="h-4 w-4" />
                        Déconnexion
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/connexion">
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  Connexion
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Search bar with results (desktop) */}
        {showSearch && (
          <div className="hidden md:block pb-4" ref={searchRef}>
            <div className="max-w-2xl mx-auto">
              {/* Mode toggle */}
              <div className="flex justify-center gap-2 mb-3">
                <button
                  onClick={() => { setIsAIMode(false); setShowResults(false); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    !isAIMode 
                      ? 'bg-france-blue text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Search className="h-3.5 w-3.5 inline mr-1.5" />
                  Recherche
                </button>
                <button
                  onClick={() => { setIsAIMode(true); setShowResults(false); setSearchResults({ brands: [], products: [] }); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isAIMode 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 inline mr-1.5" />
                  Assistant IA
                </button>
              </div>

              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  {isAIMode ? (
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-500" />
                  ) : (
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  )}
                  <input
                    type="text"
                    placeholder={isAIMode ? "Demandez-moi des recommandations..." : "Rechercher une marque ou un produit..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => (hasResults || hasAIResults) && setShowResults(true)}
                    autoFocus
                    className={`w-full pl-12 pr-12 py-3 rounded-xl border outline-none transition-colors ${
                      isAIMode 
                        ? 'border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20' 
                        : 'border-gray-200 focus:border-france-blue focus:ring-2 focus:ring-france-blue/20'
                    }`}
                  />
                  {(isSearching || isAILoading) ? (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
                  ) : isAIMode ? (
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                {/* AI Results Dropdown */}
                {showResults && isAIMode && hasAIResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
                    {/* AI Message */}
                    {aiResponse && (
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-100">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{aiResponse}</p>
                        </div>
                      </div>
                    )}

                    {/* AI Products Grid */}
                    {aiProducts.length > 0 && (
                      <div className="p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          Produits recommandés
                        </p>
                        <div className="grid grid-cols-4 gap-3">
                          {aiProducts.slice(0, 8).map((product) => (
                            <Link
                              key={product.id}
                              href={`/produits/${product.slug}`}
                              onClick={handleResultClick}
                              className="group"
                            >
                              <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden mb-2">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <ShoppingBag className="h-6 w-6" />
                                  </div>
                                )}
                              </div>
                              <p className="text-xs font-medium text-gray-900 line-clamp-1">{product.name}</p>
                              <p className="text-xs text-gray-500">{product.brandName}</p>
                              {product.priceMin && (
                                <p className="text-xs font-semibold text-purple-600">{product.priceMin}€</p>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Classic Search Results Dropdown */}
                {showResults && !isAIMode && hasResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
                    {/* Produits */}
                    {searchResults.products.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <ShoppingBag className="h-3.5 w-3.5" />
                            Produits
                          </span>
                        </div>
                        {searchResults.products.map((product) => (
                          <Link
                            key={product.id}
                            href={`/produits/${product.slug}`}
                            onClick={handleResultClick}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                              {product.imageUrl ? (
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.name}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div 
                                  className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                                  style={{ backgroundColor: product.sectorColor || '#002395' }}
                                >
                                  {product.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{product.name}</p>
                              <p className="text-sm text-gray-500 truncate">
                                {product.brandName}
                                {product.priceMin && ` • ${formatPrice(product.priceMin, product.priceMax)}`}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Marques */}
                    {searchResults.brands.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5" />
                            Marques
                          </span>
                        </div>
                        {searchResults.brands.map((brand) => (
                          <Link
                            key={brand.id}
                            href={`/marques/${brand.slug}`}
                            onClick={handleResultClick}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                              style={{ backgroundColor: brand.sectorColor || '#002395' }}
                            >
                              {brand.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{brand.name}</p>
                              <p className="text-sm text-gray-500 truncate">
                                {brand.city}{brand.sector && ` • ${brand.sector}`}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Voir tous les résultats */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                      <button
                        type="submit"
                        className="w-full text-center text-sm font-medium text-france-blue hover:underline"
                      >
                        Voir tous les résultats pour "{searchQuery}"
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="container py-4 space-y-4">
            {/* User info mobile */}
            {session?.user && (
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'Avatar'}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-france-blue text-white flex items-center justify-center font-medium">
                    {session.user.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{session.user.name}</p>
                  <p className="text-sm text-gray-500">{session.user.email}</p>
                </div>
              </div>
            )}

            {/* Mobile search */}
            <div className="relative" ref={searchRef}>
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une marque ou un produit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => hasResults && setShowResults(true)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-france-blue outline-none"
                  />
                </div>
              </form>

              {/* Mobile Search Results */}
              {showResults && hasResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[50vh] overflow-y-auto">
                  {searchResults.brands.slice(0, 3).map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/marques/${brand.slug}`}
                      onClick={() => { handleResultClick(); setIsMenuOpen(false); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50"
                    >
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{brand.name}</span>
                    </Link>
                  ))}
                  {searchResults.products.slice(0, 3).map((product) => (
                    <Link
                      key={product.id}
                      href={`/produits/${product.slug}`}
                      onClick={() => { handleResultClick(); setIsMenuOpen(false); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50"
                    >
                      <ShoppingBag className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900 truncate">{product.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile nav links */}
            <nav className="flex flex-col gap-2">
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

            {/* Mobile actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <Link href="/favoris" className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <Heart className="h-4 w-4" />
                  Favoris
                </Button>
              </Link>
              {session?.user ? (
                <Button 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  variant="outline"
                  className="flex-1 gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </Button>
              ) : (
                <Link href="/connexion" className="flex-1">
                  <Button className="w-full gap-2">
                    <User className="h-4 w-4" />
                    Connexion
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}