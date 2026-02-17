'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, Sparkles, ArrowRight, Heart, MapPin, Star,
  ChevronLeft, ChevronRight, Play, Pause, TrendingUp, ShoppingBag, X,
  Building2, Package, Award, Users, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/components/ui/favorite-button';
import Image from 'next/image';

interface WeeklyBrand {
  id: string; name: string; slug: string; description: string | null;
  city: string | null; yearFounded: number | null; region: string | null;
  sector: string | null; sectorSlug: string | null; sectorColor: string | null;
  websiteUrl: string | null; labels: string[];
}

interface TrendingProduct {
  id: string; name: string; slug: string; description: string | null;
  imageUrl: string | null; priceMin: number | null; priceMax: number | null;
  currency: string; buyUrl: string | null; isFeatured: boolean;
  brand: { id: string; name: string; slug: string; sectorColor: string; };
}

interface Sector {
  id: string; name: string; slug: string; color: string | null;
  icon: string | null; brandCount: number;
}

const API_URL = 'http://localhost:4000';

const COLLECTIONS = [
  { id: '1', title: 'Noël Made in France', slug: 'noel', count: 48, image: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=600&q=80', color: '#BD3A3A' },
  { id: '2', title: 'Mode Éthique', slug: 'mode-ethique', count: 127, image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80', color: '#0D2B4E' },
  { id: '3', title: 'Artisanat d\'Art', slug: 'artisanat', count: 84, image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600&q=80', color: '#7C3AED' },
  { id: '4', title: 'Gastronomie', slug: 'gastronomie', count: 156, image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80', color: '#E5A632' },
];

const HERO_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80',
  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=1920&q=80',
];

const SEARCH_SUGGESTIONS = [
  "Idée de cadeau à moins de 20€",
  "Des baskets Made in France",
  "Cosmétiques naturels français",
  "Vêtements éco-responsables",
  "Accessoires en cuir artisanal",
  "Jouets fabriqués en France",
];

// ===== AI SEARCH OVERLAY =====
function AISearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    products?: any[];
    brands?: any[];
    suggestions?: string[];
  }>>([]);
  const [expandedMessages, setExpandedMessages] = useState<Map<number, number>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setMessages([]);
      setExpandedMessages(new Map());
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const parseSuggestions = (text: string): { cleanText: string; suggestions: string[] } => {
    const match = text.match(/\[SUGGESTIONS\]\n?(.*?)\n?\[\/SUGGESTIONS\]/s);
    if (match) {
      const suggestions = match[1].split('|').map(s => s.trim()).filter(s => s.length > 0);
      const cleanText = text.replace(/\[SUGGESTIONS\].*?\[\/SUGGESTIONS\]/s, '').trim();
      return { cleanText, suggestions };
    }
    return { cleanText: text, suggestions: [] };
  };

  const handleSearch = async (query: string) => {
    if (!query.trim() || isSearching) return;

    const userMessage = query.trim();
    setSearchQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsSearching(true);

    try {
      const conversationHistory = messages.map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API_URL}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, conversationHistory }),
      });
      const data = await res.json();
      const { cleanText, suggestions } = parseSuggestions(data.message || '');

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: cleanText,
        products: data.products || [],
        brands: data.brands || [],
        suggestions: suggestions.length > 0 ? suggestions : ['Voir plus de résultats', 'Changer de catégorie', 'Modifier mon budget']
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Désolé, une erreur est survenue. Réessayez !',
        suggestions: ['Réessayer']
      }]);
    } finally {
      setIsSearching(false);
    }
  };

  const getLogoUrl = (brand: any): string | null => {
    if (brand.logoUrl && !brand.logoUrl.includes('clearbit.com')) return brand.logoUrl;
    if (brand.websiteUrl) {
      try {
        const hostname = new URL(brand.websiteUrl).hostname;
        return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
      } catch { /* URL invalide */ }
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-france-blue/90 backdrop-blur-xl" onClick={onClose} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg">
            <img src="/images/franceialogo.svg" alt="IA" className="w-10 h-10" style={{ transform: 'scale(1.4) translateX(1px)' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Assistant Made in France</h2>
            <p className="text-sm text-white/60">Trouvez le produit parfait</p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-300">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages area */}
      <div ref={messagesContainerRef} className="relative z-10 flex-1 overflow-y-auto px-6">
        <div className="max-w-4xl mx-auto py-6">

          {/* Initial state - suggestions */}
          {messages.length === 0 && !isSearching && (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center animate-fade-in-up">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-xl animate-float">
                <img src="/images/franceialogo.svg" alt="IA" className="w-14 h-14" style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))', transform: 'scale(1.6) translateX(1px)' }} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Comment puis-je vous aider ?</h3>
              <p className="text-white/60 mb-8 max-w-md">Décrivez ce que vous cherchez et je trouverai les meilleurs produits Made in France pour vous.</p>
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {SEARCH_SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => handleSearch(s)}
                    className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white text-sm rounded-xl border border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                    {s}
                  </button>
                ))}
              </div>
              <Link href="/produits" onClick={onClose}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-france-blue font-semibold rounded-xl hover:bg-france-cream hover:shadow-xl transition-all duration-300">
                Parcourir tous les produits <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}

          {/* Messages */}
          {messages.map((message, index) => (
            <div key={index} className="mb-8 animate-fade-in-up">

              {/* User message */}
              {message.role === 'user' && (
                <div className="flex justify-end mb-4">
                  <div className="bg-white text-france-blue px-6 py-4 rounded-2xl rounded-br-md max-w-[85%] shadow-lg font-medium">
                    {message.content}
                  </div>
                </div>
              )}

              {/* Assistant message */}
              {message.role === 'assistant' && (
                <div className="space-y-5">
                  {/* Text response */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-france-red to-france-blue flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl rounded-tl-md p-5 border border-white/10 flex-1">
                      <p className="text-white/90 whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                  </div>

                  {/* Brands grid */}
                  {message.brands && message.brands.length > 0 && (
                    <div className="ml-14">
                      <p className="text-white/40 text-xs mb-4 flex items-center gap-2 font-semibold uppercase tracking-wider">
                        <Building2 className="w-4 h-4" />
                        {message.brands.length} marque{message.brands.length > 1 ? 's' : ''} trouvée{message.brands.length > 1 ? 's' : ''}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {message.brands.slice(0, 8).map((brand: any) => {
                          const logoUrl = getLogoUrl(brand);
                          return (
                            <Link key={brand.id} href={`/marques/${brand.slug}`} onClick={onClose}
                              className="group bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                                  style={{ backgroundColor: brand.sectorColor ? `${brand.sectorColor}15` : '#f3f4f6' }}>
                                  {logoUrl && (
                                    <img src={logoUrl} alt={brand.name} className="w-8 h-8 object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        const sibling = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                                        if (sibling) sibling.classList.remove('hidden');
                                      }} />
                                  )}
                                  <span className={`text-lg font-bold ${logoUrl ? 'hidden' : ''}`} style={{ color: brand.sectorColor || '#0D2B4E' }}>
                                    {brand.name.charAt(0)}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-france-blue truncate group-hover:text-france-red transition-colors">{brand.name}</p>
                                  {brand.sectorName && (
                                    <p className="text-xs truncate" style={{ color: brand.sectorColor || '#6b7280' }}>{brand.sectorName}</p>
                                  )}
                                  {brand.city && (
                                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-3 h-3" />{brand.city}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Products grid */}
                  {message.products && message.products.length > 0 && (() => {
                    const expandLevel = expandedMessages.get(index) || 0;
                    const displayCount = Math.min(8 + expandLevel * 8, message.products.length, 40);
                    const hasMore = message.products.length > displayCount && displayCount < 40;
                    const canCollapse = expandLevel > 0;
                    return (
                      <div className="ml-14">
                        <p className="text-white/40 text-xs mb-4 flex items-center gap-2 font-semibold uppercase tracking-wider">
                          <ShoppingBag className="w-4 h-4" />
                          {message.products.length} produit{message.products.length > 1 ? 's' : ''} trouvé{message.products.length > 1 ? 's' : ''}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {message.products.slice(0, displayCount).map((p: any) => (
                            <Link key={p.id} href={`/produits/${p.slug}`} onClick={onClose}
                              className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ShoppingBag className="w-10 h-10 text-gray-200" />
                                  </div>
                                )}
                              </div>
                              <div className="p-4">
                                <p className="font-semibold text-france-blue text-sm truncate group-hover:text-france-red transition-colors">{p.name}</p>
                                <p className="text-xs text-gray-500 truncate">{p.brandName}</p>
                                {p.priceMin && (
                                  <p className="text-sm font-bold mt-2 text-france-red">{p.priceMin}€</p>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                        {(hasMore || canCollapse) && (
                          <div className="flex gap-4 mt-4">
                            {hasMore && (
                              <button
                                onClick={() => setExpandedMessages(prev => new Map(prev).set(index, expandLevel + 1))}
                                className="text-sm text-white/60 hover:text-white transition-colors font-medium"
                              >
                                Voir plus (+8)
                              </button>
                            )}
                            {canCollapse && (
                              <button
                                onClick={() => setExpandedMessages(prev => new Map(prev).set(index, 0))}
                                className="text-sm text-white/40 hover:text-white/60 transition-colors"
                              >
                                Réduire
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Suggestions */}
                  {index === messages.length - 1 && message.suggestions && message.suggestions.length > 0 && !isSearching && (
                    <div className="ml-14 pt-4">
                      <p className="text-white/40 text-xs mb-3 font-semibold uppercase tracking-wider">Suggestions</p>
                      <div className="flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => handleSearch(suggestion)}
                            className="px-5 py-2.5 bg-white/10 hover:bg-white text-white hover:text-france-blue text-sm rounded-xl border border-white/20 hover:border-transparent transition-all duration-300 hover:scale-105 font-medium"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Loading */}
          {isSearching && (
            <div className="flex gap-4 mb-6 animate-fade-in">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-france-red to-france-blue flex items-center justify-center flex-shrink-0">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl rounded-tl-md p-5 border border-white/10">
                <p className="text-white/60">Recherche en cours...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="relative z-10 px-6 py-5 bg-gradient-to-t from-france-blue/50 to-transparent">
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }}
          className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-2 flex items-center gap-3 shadow-2xl">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={messages.length > 0 ? "Affiner ma recherche..." : "Décris ce que tu cherches..."}
              className="flex-1 bg-transparent text-france-blue placeholder-gray-400 outline-none text-base py-3 px-4"
            />
            <Button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="rounded-xl px-6 py-3 bg-gradient-to-r from-france-blue to-france-red hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {isSearching ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== HERO SLIDER =====
function HeroSlider() {
  const [brands, setBrands] = useState<WeeklyBrand[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/brands/featured`).then(r => r.json())
      .then(data => setBrands((data.data || []).slice(0, 3)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isPlaying || brands.length === 0) return;
    const timer = setInterval(() => setCurrentSlide(p => (p + 1) % brands.length), 6000);
    return () => clearInterval(timer);
  }, [isPlaying, brands.length]);

  const currentBrand = brands[currentSlide];
  if (loading || !currentBrand) return (
    <section className="relative min-h-[90vh] hero-gradient flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-france-blue/20 mb-4" />
        <div className="h-4 bg-france-blue/20 rounded w-32" />
      </div>
    </section>
  );

  const bg = HERO_BACKGROUNDS[currentSlide % HERO_BACKGROUNDS.length];

  return (
    <>
      <section className="relative min-h-[90vh] overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 transition-all duration-1000">
          <img src={bg} alt={currentBrand.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-france-blue via-france-blue/60 to-france-blue/30" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full min-h-[90vh] flex flex-col justify-center px-6 md:px-16 pb-32">
          <div className="max-w-7xl mx-auto w-full">
            {/* Badge */}
            <div className="mb-8 animate-fade-in-up">
              <span className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full text-white text-sm border border-white/20 font-medium">
                <Star className="w-4 h-4 text-france-gold fill-france-gold" />
                Marque de la semaine
              </span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              {currentBrand.name}
            </h1>

            {/* Description */}
            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              {currentBrand.description || 'Découvrez cette marque française d\'exception'}
            </p>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-white/70 mb-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              {currentBrand.city && (
                <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                  <MapPin className="w-4 h-4" />
                  {currentBrand.city}{currentBrand.region && `, ${currentBrand.region}`}
                </span>
              )}
              {currentBrand.sector && (
                <span className="px-4 py-2 rounded-full text-sm text-white bg-white/10 backdrop-blur-sm border border-white/10">
                  {currentBrand.sector}
                </span>
              )}
              {currentBrand.yearFounded && (
                <span className="px-4 py-2 rounded-full text-sm text-white bg-white/10 backdrop-blur-sm border border-white/10">
                  Depuis {currentBrand.yearFounded}
                </span>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Link href={`/marques/${currentBrand.slug}`}>
                <Button size="lg" className="btn-primary rounded-full px-8 py-4 text-base">
                  Découvrir la marque
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <FavoriteButton brandId={currentBrand.id} size="lg" className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 rounded-full" />
            </div>
          </div>
        </div>

        {/* AI Search button */}
        <button onClick={() => setIsSearchOpen(true)} className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 group">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full bg-white shadow-2xl group-hover:scale-110 transition-all duration-500 flex items-center justify-center ai-btn-glass"
              style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 -2px 6px rgba(0, 0, 0, 0.05), inset 0 8px 16px -4px rgba(255, 255, 255, 0.8)' }}
            >
              <img
                src="/images/franceialogo.svg"
                alt="Recherche IA"
                className="w-14 h-14 group-hover:animate-spin-fast"
                style={{ filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4))', transform: 'scale(1.6) translateX(1px)' }}
              />
            </div>
            <div className="absolute inset-0 rounded-full bg-white animate-ping opacity-30" />
          </div>
          <p className="text-white text-sm mt-4 font-semibold tracking-wide">Recherche IA</p>
        </button>

        {/* Slider controls */}
        <div className="absolute bottom-8 right-6 md:right-16 flex items-center gap-3 z-20">
          <button onClick={() => setCurrentSlide(p => (p - 1 + brands.length) % brands.length)}
            className="p-3 rounded-xl bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20 transition-all duration-300">
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="hidden md:flex gap-2 px-2">
            {brands.map((_, i) => (
              <button key={i} onClick={() => { setCurrentSlide(i); setIsPlaying(false); }}
                className="relative w-12 h-1.5 rounded-full overflow-hidden bg-white/30 transition-all">
                {i === currentSlide && isPlaying && (
                  <div className="absolute inset-0 bg-white rounded-full" style={{ animation: 'progress 6s linear forwards' }} />
                )}
                {i < currentSlide && <div className="absolute inset-0 bg-white rounded-full" />}
                {i === currentSlide && !isPlaying && <div className="absolute inset-0 bg-white rounded-full" />}
              </button>
            ))}
          </div>

          <button onClick={() => setCurrentSlide(p => (p + 1) % brands.length)}
            className="p-3 rounded-xl bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20 transition-all duration-300">
            <ChevronRight className="w-5 h-5" />
          </button>

          <button onClick={() => setIsPlaying(!isPlaying)}
            className="hidden md:flex p-3 rounded-xl bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20 transition-all duration-300">
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
        </div>

        <style jsx>{`@keyframes progress { from { width: 0%; } to { width: 100%; } }`}</style>
      </section>

      <AISearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

// ===== TRENDING PRODUCTS =====
function TrendingProducts() {
  const [products, setProducts] = useState<TrendingProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/products/trending?limit=8`).then(r => r.json())
      .then(d => setProducts(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-soft animate-pulse">
          <div className="aspect-square bg-gray-100" />
          <div className="p-5 space-y-3">
            <div className="h-4 bg-gray-100 rounded-full w-3/4" />
            <div className="h-3 bg-gray-100 rounded-full w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {products.map(p => (
        <Link key={p.id} href={`/produits/${p.slug}`} className="product-card group">
          <div className="aspect-square bg-gray-50 relative overflow-hidden">
            {p.imageUrl ? (
              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain p-4" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white" style={{ backgroundColor: p.brand.sectorColor }}>
                {p.name.charAt(0)}
              </div>
            )}
            {p.isFeatured && (
              <div className="absolute top-3 left-3 bg-france-red text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                <TrendingUp className="w-3.5 h-3.5" />
                Tendance
              </div>
            )}
          </div>
          <div className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: p.brand.sectorColor }}>
              {p.brand.name}
            </span>
            <h3 className="font-semibold text-france-blue mt-2 line-clamp-2 group-hover:text-france-red transition-colors">
              {p.name}
            </h3>
            {p.priceMin && (
              <p className="text-lg font-bold mt-3" style={{ color: p.brand.sectorColor }}>
                {p.priceMin === p.priceMax || !p.priceMax ? `${p.priceMin.toFixed(2)} €` : `${p.priceMin.toFixed(2)} - ${p.priceMax.toFixed(2)} €`}
              </p>
            )}
            <div className="mt-4 flex items-center gap-1.5 text-sm text-gray-500 group-hover:text-france-blue transition-colors">
              <ShoppingBag className="w-4 h-4" />
              Voir le produit
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ===== SECTORS GRID =====
function SectorsGrid() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  const ICONS: Record<string, string> = {
    'mode-accessoires': '👗', 'maison-jardin': '🏠', 'gastronomie': '🍽️',
    'cosmetique': '✨', 'enfance': '🧸', 'loisirs-sport': '⚽',
    'animaux': '🐾', 'sante-nutrition': '💚', 'high-tech': '💻'
  };

  useEffect(() => {
    fetch(`${API_URL}/api/v1/sectors/with-counts`).then(r => r.json())
      .then(d => setSectors(d.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-6 bg-white rounded-2xl shadow-soft animate-pulse h-36" />
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
      {sectors.slice(0, 6).map(s => (
        <Link key={s.id} href={`/secteurs/${s.slug}`}
          className="group p-5 md:p-6 rounded-2xl border-2 border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-400 bg-white">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 mx-auto transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
            style={{ backgroundColor: `${s.color || '#0D2B4E'}15` }}>
            {ICONS[s.slug] || '📦'}
          </div>
          <h3 className="font-semibold text-france-blue text-center text-sm md:text-base mb-1 group-hover:text-france-red transition-colors">
            {s.name}
          </h3>
          <p className="text-xs md:text-sm text-gray-500 text-center">
            {s.brandCount} marques
          </p>
        </Link>
      ))}
    </div>
  );
}

// ===== COLLECTIONS GRID =====
function CollectionsGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {COLLECTIONS.map(c => (
        <Link key={c.id} href={`/collections/${c.slug}`}
          className="group relative h-52 md:h-72 rounded-3xl overflow-hidden shadow-soft hover:shadow-xl transition-all duration-500">
          <img src={c.image} alt={c.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${c.color}DD 0%, ${c.color}60 100%)` }} />
          <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
            <span className="text-white/80 text-xs md:text-sm mb-2 font-medium">{c.count} marques</span>
            <h3 className="text-white text-lg md:text-2xl font-bold">{c.title}</h3>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ===== MAIN PAGE =====
export default function HomePage() {
  return (
    <main className="bg-france-cream">
      <HeroSlider />

      {/* Trending Products Section */}
      <section className="py-20 md:py-24 px-4 md:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12 md:mb-16">
            <div>
              <div className="section-label">
                <TrendingUp className="w-5 h-5" />
                <span>Tendances</span>
              </div>
              <h2 className="section-title">Produits du moment</h2>
            </div>
            <Link href="/produits" className="hidden md:flex items-center gap-2 text-france-blue font-semibold hover:text-france-red hover:gap-3 transition-all">
              Voir tout <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <TrendingProducts />
          <div className="text-center mt-10 md:hidden">
            <Link href="/produits" className="text-france-blue font-semibold hover:text-france-red transition-colors">
              Voir tous les produits →
            </Link>
          </div>
        </div>
      </section>

      {/* Collections Section */}
      <section className="py-20 md:py-24 px-4 md:px-16 bg-france-cream">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12 md:mb-16">
            <div>
              <div className="section-label">
                <Sparkles className="w-5 h-5" />
                <span>Sélections</span>
              </div>
              <h2 className="section-title">Collections inspirantes</h2>
            </div>
          </div>
          <CollectionsGrid />
        </div>
      </section>

      {/* Sectors Section */}
      <section className="py-20 md:py-24 px-4 md:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="section-header">
            <h2 className="section-title">Explorez par univers</h2>
            <p className="section-subtitle">900+ marques dans 6 secteurs d'excellence française</p>
          </div>
          <SectorsGrid />
          <div className="text-center mt-10">
            <Link href="/secteurs" className="text-france-blue font-semibold hover:text-france-red transition-colors">
              Voir tous les secteurs →
            </Link>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 md:py-24 px-4 md:px-16 bg-gradient-to-br from-france-blue to-france-blue/90">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div>
              <div className="flex items-center gap-2 text-france-gold mb-6">
                <MapPin className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wider">Géolocalisation</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Découvrez les marques près de chez vous
              </h2>
              <p className="text-white/70 text-lg mb-10 leading-relaxed">
                Explorez la carte interactive et trouvez les entreprises françaises de votre région. Soutenez l'économie locale !
              </p>
              <Link href="/carte">
                <Button size="lg" className="bg-white text-france-blue hover:bg-france-cream rounded-full px-8 py-4 font-semibold hover:shadow-xl transition-all">
                  Ouvrir la carte
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl bg-france-blue/30">
                <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80" alt="Carte" className="w-full h-full object-cover opacity-70" />
                <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-france-red rounded-full animate-ping shadow-lg" />
                <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-france-red rounded-full animate-ping shadow-lg" style={{ animationDelay: '0.5s' }} />
                <div className="absolute bottom-1/3 left-1/4 w-4 h-4 bg-france-red rounded-full animate-ping shadow-lg" style={{ animationDelay: '1s' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-24 px-4 md:px-16 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 rounded-3xl bg-france-red/10 flex items-center justify-center mx-auto mb-8">
            <Heart className="w-10 h-10 text-france-red" />
          </div>
          <h2 className="section-title mb-6">Prêt à consommer français ?</h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Rejoignez le mouvement et découvrez les marques qui font la richesse de notre patrimoine
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/marques">
              <Button size="lg" className="btn-primary rounded-full px-10 py-4 text-base">
                Explorer les marques
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/a-propos">
              <Button size="lg" variant="outline" className="btn-secondary rounded-full px-10 py-4 text-base">
                Notre mission
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
