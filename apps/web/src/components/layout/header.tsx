'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Search, Menu, X, Heart, User, LogOut, ChevronDown,
  Building2, ShoppingBag, Loader2, Send, MapPin,
  Grid3X3, Map, Info, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

// Composant pour l'icône IA avec animation
function AIIcon({ className = "h-4 w-4", animated = true }: { className?: string; animated?: boolean }) {
  return (
    <Image
      src="/images/franceialogo.svg"
      alt="IA"
      width={24}
      height={24}
      className={`${className} ${animated ? 'ai-logo-animated' : ''} object-contain`}
    />
  );
}

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
  const [isScrolled, setIsScrolled] = useState(false);

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

  // Scroll detection for floating nav effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    { href: '/marques', label: 'Marques', icon: Building2 },
    { href: '/secteurs', label: 'Secteurs', icon: Grid3X3 },
    { href: '/regions', label: 'Régions', icon: MapPin },
    { href: '/carte', label: 'Carte', icon: Map },
    { href: '/a-propos', label: 'À propos', icon: Info },
  ];

  const hasResults = searchResults.brands.length > 0 || searchResults.products.length > 0;
  const hasAIResults = aiResponse || aiProducts.length > 0;

  return (
    <>
      {/* Navigation flottante */}
      <header className={`fixed top-0 left-0 right-0 z-50 px-4 transition-all duration-500 ${
        isScrolled ? 'pt-3' : 'pt-4 md:pt-6'
      }`}>
        <nav className={`mx-auto max-w-6xl transition-all duration-500 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-france-blue/5 border border-gray-200/50 rounded-full'
            : 'bg-white/80 backdrop-blur-xl shadow-soft border border-gray-100/50 rounded-full'
        }`}>
          <div className="flex items-center justify-between h-14 md:h-16 px-4 md:px-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-france-blue to-france-blue/80 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:shadow-france-blue/20 transition-all duration-300">
                  <span className="text-white font-bold text-sm md:text-base">MF</span>
                </div>
                {/* Petit indicateur tricolore */}
                <div className="absolute -bottom-0.5 -right-0.5 flex h-1.5 w-4 rounded-full overflow-hidden shadow-sm">
                  <span className="bg-france-blue flex-1" />
                  <span className="bg-white flex-1" />
                  <span className="bg-france-red flex-1" />
                </div>
              </div>
              <div className="hidden sm:flex flex-col -space-y-0.5">
                <span className="font-bold text-france-blue text-sm md:text-base leading-tight">Made in France</span>
                <span className="text-[10px] text-gray-400 font-medium tracking-wider">DÉCOUVRIR LE MEILLEUR</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="nav-link relative p-3 text-gray-500 hover:text-france-blue rounded-full hover:bg-france-blue/5 transition-all duration-300 group"
                    title={link.label}
                  >
                    <Icon className="h-6 w-6" />
                    {/* Tooltip */}
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-france-blue text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Actions */}
            <div className="flex items-center gap-2">
              {/* Search toggle */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`p-2.5 rounded-full transition-all duration-300 ${
                  showSearch
                    ? 'bg-france-blue text-white shadow-md'
                    : 'text-gray-500 hover:text-france-blue hover:bg-france-blue/5'
                }`}
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Favorites */}
              <Link
                href="/favoris"
                className="hidden md:flex p-2.5 text-gray-500 hover:text-france-red hover:bg-france-red/5 rounded-full transition-all duration-300"
              >
                <Heart className="h-5 w-5" />
              </Link>

              {/* User section */}
              {status === 'loading' ? (
                <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
              ) : session?.user ? (
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition-all duration-300"
                  >
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'Avatar'}
                        className="w-8 h-8 rounded-full ring-2 ring-white shadow-sm"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-france-blue to-france-blue/80 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                        {session.user.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* User dropdown */}
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 py-2 z-20 animate-fade-in-up">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="font-semibold text-france-blue">{session.user.name}</p>
                          <p className="text-sm text-gray-500 truncate">{session.user.email}</p>
                        </div>
                        <Link
                          href="/profil"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-france-blue/5 hover:text-france-blue transition-colors"
                        >
                          <User className="h-4 w-4" />
                          Mon profil
                        </Link>
                        <Link
                          href="/favoris"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-france-blue/5 hover:text-france-blue transition-colors"
                        >
                          <Heart className="h-4 w-4" />
                          Mes favoris
                        </Link>
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              signOut({ callbackUrl: '/' });
                            }}
                            className="flex items-center gap-3 px-4 py-3 text-france-red hover:bg-france-red/5 w-full transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            Déconnexion
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link href="/connexion" className="hidden md:block">
                  <Button className="btn-primary px-5 py-2 text-sm rounded-full">
                    Connexion
                  </Button>
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2.5 text-gray-500 hover:text-france-blue hover:bg-france-blue/5 rounded-full transition-all duration-300"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Search overlay */}
      {showSearch && (
        <div className="fixed inset-0 z-40 pt-24 md:pt-28 px-4 animate-fade-in" ref={searchRef}>
          <div className="absolute inset-0 bg-france-blue/5 backdrop-blur-sm" onClick={() => setShowSearch(false)} />

          <div className="relative max-w-2xl mx-auto">
            {/* Mode toggle */}
            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={() => { setIsAIMode(false); setShowResults(false); }}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  !isAIMode
                    ? 'bg-france-blue text-white shadow-md shadow-france-blue/20'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Search className="h-4 w-4 inline mr-2" />
                Recherche
              </button>
              <button
                onClick={() => { setIsAIMode(true); setShowResults(false); setSearchResults({ brands: [], products: [] }); }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isAIMode
                    ? 'bg-white shadow-lg ring-2 ring-france-blue'
                    : 'bg-white hover:bg-gray-50 border border-gray-200 shadow-sm'
                }`}
                title="Assistant IA"
              >
                <AIIcon className="h-7 w-7" animated={isAIMode} />
              </button>
            </div>

            {/* Search input */}
            <form onSubmit={handleSearch}>
              <div className="relative">
                <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isAIMode ? 'text-france-red' : 'text-gray-400'}`}>
                  {isAIMode ? <AIIcon className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                </div>
                <input
                  type="text"
                  placeholder={isAIMode ? "Demandez-moi des recommandations..." : "Rechercher une marque ou un produit..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => (hasResults || hasAIResults) && setShowResults(true)}
                  autoFocus
                  className={`w-full pl-14 pr-14 py-4 rounded-2xl border-2 bg-white text-france-blue placeholder-gray-400 outline-none transition-all duration-300 shadow-lg ${
                    isAIMode
                      ? 'border-france-red/30 focus:border-france-red focus:ring-4 focus:ring-france-red/10'
                      : 'border-gray-200 focus:border-france-blue focus:ring-4 focus:ring-france-blue/10'
                  }`}
                />
                {(isSearching || isAILoading) ? (
                  <div className="absolute right-5 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                  </div>
                ) : isAIMode ? (
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-r from-france-blue to-france-red text-white rounded-xl hover:shadow-lg transition-all duration-300"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                ) : searchQuery && (
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-france-blue text-white rounded-xl hover:shadow-lg transition-all duration-300"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* AI Results */}
              {showResults && isAIMode && hasAIResults && (
                <div className="mt-3 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-[60vh] overflow-y-auto animate-fade-in-up">
                  {aiResponse && (
                    <div className="p-5 bg-gradient-to-r from-france-blue/5 to-france-red/5 border-b border-gray-100">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-gradient-to-r from-france-blue to-france-red rounded-xl flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
                          <AIIcon className="h-6 w-6" animated={false} />
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{aiResponse}</p>
                      </div>
                    </div>
                  )}
                  {aiProducts.length > 0 && (
                    <div className="p-5">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                        Produits recommandés
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {aiProducts.slice(0, 8).map((product) => (
                          <Link
                            key={product.id}
                            href={`/produits/${product.slug}`}
                            onClick={handleResultClick}
                            className="group"
                          >
                            <div className="aspect-square rounded-xl bg-gray-50 overflow-hidden mb-2 border border-gray-100 group-hover:border-france-blue/20 transition-all">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <ShoppingBag className="h-6 w-6" />
                                </div>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-france-blue line-clamp-1 group-hover:text-france-red transition-colors">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.brandName}</p>
                            {product.priceMin && (
                              <p className="text-xs font-bold text-france-red mt-0.5">{product.priceMin}€</p>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Classic Search Results */}
              {showResults && !isAIMode && hasResults && (
                <div className="mt-3 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-[60vh] overflow-y-auto animate-fade-in-up">
                  {/* Produits */}
                  {searchResults.products.length > 0 && (
                    <div>
                      <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                          <ShoppingBag className="h-3.5 w-3.5" />
                          Produits
                        </span>
                      </div>
                      {searchResults.products.map((product) => (
                        <Link
                          key={product.id}
                          href={`/produits/${product.slug}`}
                          onClick={handleResultClick}
                          className="flex items-center gap-4 px-4 py-3 hover:bg-france-blue/5 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                                style={{ backgroundColor: product.sectorColor || '#0D2B4E' }}
                              >
                                {product.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-france-blue truncate">{product.name}</p>
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
                      <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5" />
                          Marques
                        </span>
                      </div>
                      {searchResults.brands.map((brand) => (
                        <Link
                          key={brand.id}
                          href={`/marques/${brand.slug}`}
                          onClick={handleResultClick}
                          className="flex items-center gap-4 px-4 py-3 hover:bg-france-blue/5 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: brand.sectorColor || '#0D2B4E' }}
                          >
                            {brand.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-france-blue truncate">{brand.name}</p>
                            <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                              {brand.city && <><MapPin className="h-3 w-3" />{brand.city}</>}
                              {brand.sector && <> • {brand.sector}</>}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Voir tous les résultats */}
                  <div className="px-4 py-4 bg-gray-50/80 border-t border-gray-100">
                    <button
                      type="submit"
                      className="w-full text-center text-sm font-semibold text-france-blue hover:text-france-red transition-colors"
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

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-30 pt-20 lg:hidden animate-fade-in">
          <div className="absolute inset-0 bg-france-blue/10 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />

          <div className="relative mx-4 bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-slide-down">
            <div className="p-6 space-y-5">
              {/* User info mobile */}
              {session?.user && (
                <div className="flex items-center gap-4 p-4 bg-france-blue/5 rounded-2xl">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'Avatar'}
                      className="w-12 h-12 rounded-xl shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-france-blue to-france-blue/80 text-white flex items-center justify-center font-semibold shadow-sm">
                      {session.user.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-france-blue">{session.user.name}</p>
                    <p className="text-sm text-gray-500 truncate">{session.user.email}</p>
                  </div>
                </div>
              )}

              {/* Mobile nav links */}
              <nav className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center px-4 py-3 text-gray-700 hover:text-france-blue hover:bg-france-blue/5 rounded-xl font-medium transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Mobile actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Link href="/favoris" onClick={() => setIsMenuOpen(false)} className="flex-1">
                  <Button variant="outline" className="w-full gap-2 rounded-xl border-2">
                    <Heart className="h-4 w-4" />
                    Favoris
                  </Button>
                </Link>
                {session?.user ? (
                  <Button
                    onClick={() => { setIsMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                    variant="outline"
                    className="flex-1 gap-2 text-france-red border-france-red/20 hover:bg-france-red/5 rounded-xl border-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </Button>
                ) : (
                  <Link href="/connexion" onClick={() => setIsMenuOpen(false)} className="flex-1">
                    <Button className="w-full gap-2 btn-primary rounded-xl">
                      <User className="h-4 w-4" />
                      Connexion
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed header */}
      <div className="h-20 md:h-24" />
    </>
  );
}
