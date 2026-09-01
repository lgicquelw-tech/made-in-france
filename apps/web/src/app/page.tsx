'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, Sparkles, ArrowRight, Heart, MapPin, Star,
  ChevronLeft, ChevronRight, Play, Pause, TrendingUp, ShoppingBag, X,
  Building2, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/components/ui/favorite-button';

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
  { id: '1', title: 'Noël Made in France', slug: 'noel', count: 48, image: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=600&q=80', color: '#DC2626' },
  { id: '2', title: 'Mode Éthique', slug: 'mode-ethique', count: 127, image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80', color: '#059669' },
  { id: '3', title: 'Artisanat d\'Art', slug: 'artisanat', count: 84, image: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600&q=80', color: '#7C3AED' },
  { id: '4', title: 'Gastronomie', slug: 'gastronomie', count: 156, image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80', color: '#D97706' },
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
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) { 
      setSearchQuery(''); 
      setMessages([]); 
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
        suggestions: suggestions.length > 0 ? suggestions : ['Voir plus', 'Autre catégorie', 'Modifier le budget']
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
    if (brand.logoUrl) return brand.logoUrl;
    if (brand.websiteUrl) {
      try {
        const hostname = new URL(brand.websiteUrl).hostname;
        return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
      } catch { return null; }
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      {/* Header fixe avec recherche */}
      <div className="relative z-10 bg-gradient-to-b from-black/50 to-transparent pt-6 pb-8 px-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Assistant Made in France</h2>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }} 
            className="bg-white rounded-2xl p-2 flex items-center gap-3 shadow-2xl">
            <input 
              ref={inputRef} 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={messages.length > 0 ? "Affiner ma recherche..." : "Décrivez ce que vous cherchez..."}
              className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-base py-2 px-3" 
            />
            <Button 
              type="submit" 
              disabled={isSearching || !searchQuery.trim()}
              className="rounded-xl px-5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
            >
              {isSearching ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Search className="w-5 h-5 md:mr-2" /><span className="hidden md:inline">Rechercher</span></>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Zone de conversation scrollable */}
<div className={`relative z-10 flex-1 overflow-y-auto px-6 pb-6 ${messages.length === 0 ? 'flex items-center justify-center' : ''}`}>
  <div className={`max-w-4xl mx-auto ${messages.length === 0 ? 'w-full' : ''}`}>
    
    {/* État initial - suggestions */}
    {messages.length === 0 && !isSearching && (
            <div className="text-center py-8 animate-fade-in">
              <p className="text-white/50 text-sm mb-4">Suggestions pour commencer</p>
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {SEARCH_SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => handleSearch(s)}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full border border-white/20 transition-all hover:scale-105">
                    {s}
                  </button>
                ))}
              </div>
              <Link href="/produits" onClick={onClose}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-medium rounded-full hover:bg-gray-100 transition-all">
                Parcourir tous les produits <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Messages de conversation */}
          {messages.map((message, index) => (
            <div key={index} className="mb-6 animate-fade-in">
              
              {/* Message utilisateur */}
              {message.role === 'user' && (
                <div className="flex justify-end mb-4">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-3 rounded-2xl rounded-br-sm max-w-[85%] shadow-lg">
                    {message.content}
                  </div>
                </div>
              )}

              {/* Message assistant */}
              {message.role === 'assistant' && (
                <div className="space-y-4">
                  {/* Réponse texte */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl rounded-tl-sm p-4 border border-white/10 flex-1">
                      <p className="text-white/90 whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                  </div>

                  {/* Grille de marques */}
                  {message.brands && message.brands.length > 0 && (
                    <div className="ml-11">
                      <p className="text-white/40 text-xs mb-3 flex items-center gap-2">
                        <Building2 className="w-3 h-3" />
                        {message.brands.length} marque{message.brands.length > 1 ? 's' : ''} trouvée{message.brands.length > 1 ? 's' : ''}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {message.brands.slice(0, 6).map((brand: any) => {
                          const logoUrl = getLogoUrl(brand);
                          return (
                            <Link key={brand.id} href={`/marques/${brand.slug}`} onClick={onClose}
                              className="group bg-white rounded-xl p-3 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                                  style={{ backgroundColor: brand.sectorColor ? `${brand.sectorColor}15` : '#f3f4f6' }}>
                                  {logoUrl ? (
                                    <img src={logoUrl} alt={brand.name} className="w-7 h-7 object-contain"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                  ) : (
                                    <span className="text-base font-bold" style={{ color: brand.sectorColor || '#002395' }}>
                                      {brand.name.charAt(0)}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 truncate text-sm group-hover:text-purple-600 transition-colors">{brand.name}</p>
                                  {brand.sectorName && (
                                    <p className="text-xs truncate" style={{ color: brand.sectorColor || '#6b7280' }}>{brand.sectorName}</p>
                                  )}
                                  {brand.city && (
                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                      <MapPin className="w-2.5 h-2.5" />{brand.city}
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

                  {/* Grille de produits */}
                  {message.products && message.products.length > 0 && (
                    <div className="ml-11">
                      <p className="text-white/40 text-xs mb-3 flex items-center gap-2">
                        <ShoppingBag className="w-3 h-3" />
                        {message.products.length} produit{message.products.length > 1 ? 's' : ''} trouvé{message.products.length > 1 ? 's' : ''}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {message.products.slice(0, 8).map((p: any) => (
                          <Link key={p.id} href={`/produits/${p.slug}`} onClick={onClose}
                            className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                            <div className="aspect-square bg-gray-100 relative overflow-hidden">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ShoppingBag className="w-8 h-8 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <p className="font-medium text-gray-900 text-xs truncate">{p.name}</p>
                              <p className="text-xs text-gray-500 truncate">{p.brandName}</p>
                              {p.priceMin && (
                                <p className="text-sm font-bold mt-1 text-purple-600">{p.priceMin}€</p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Boutons de suggestion */}
                  {index === messages.length - 1 && message.suggestions && message.suggestions.length > 0 && !isSearching && (
                    <div className="ml-11 flex flex-wrap gap-2 pt-2">
                      {message.suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleSearch(suggestion)}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full border border-white/20 transition-all hover:scale-105 hover:border-purple-400"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Loading */}
          {isSearching && (
            <div className="flex gap-3 mb-6 animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl rounded-tl-sm p-4 border border-white/10">
                <p className="text-white/60">Recherche en cours...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}

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
    <section className="relative h-[90vh] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <div className="animate-pulse text-white/50">Chargement...</div>
    </section>
  );

  const bg = HERO_BACKGROUNDS[currentSlide % HERO_BACKGROUNDS.length];

  return (
    <>
      <section className="relative h-[90vh] overflow-hidden">
        <div className="absolute inset-0 transition-all duration-1000">
          <img src={bg} alt={currentBrand.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
        </div>
        <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-16 pb-24">
          <div className="max-w-7xl mx-auto w-full">
            <div className="mb-6"><span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm border border-white/20">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />Marque de la semaine</span></div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>{currentBrand.name}</h1>
            <p className="text-xl md:text-2xl text-white/80 mb-6 max-w-2xl">{currentBrand.description || 'Découvrez cette marque française d\'exception'}</p>
            <div className="flex flex-wrap items-center gap-4 text-white/70 mb-8">
              {currentBrand.city && <span className="flex items-center gap-2"><MapPin className="w-4 h-4" />{currentBrand.city}{currentBrand.region && `, ${currentBrand.region}`}</span>}
              {currentBrand.sector && <span className="px-3 py-1 rounded-full text-sm text-white" style={{ backgroundColor: `${currentBrand.sectorColor || '#002395'}90` }}>{currentBrand.sector}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link href={`/marques/${currentBrand.slug}`}><Button size="lg" className="rounded-full px-8 bg-white text-gray-900 hover:bg-gray-100">Découvrir la marque<ArrowRight className="w-5 h-5 ml-2" /></Button></Link>
              <FavoriteButton brandId={currentBrand.id} size="lg" className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20" />
            </div>
          </div>
        </div>
        <button onClick={() => setIsSearchOpen(true)} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 group">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 animate-ping opacity-30" />
          </div>
          <p className="text-white/80 text-sm mt-3 font-medium">Recherche IA</p>
        </button>
        <div className="absolute bottom-8 right-6 md:right-8 flex items-center gap-3 z-20">
          <button onClick={() => setCurrentSlide(p => (p - 1 + brands.length) % brands.length)} className="p-2.5 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20"><ChevronLeft className="w-5 h-5" /></button>
          <div className="hidden md:flex gap-2">{brands.map((_, i) => (
            <button key={i} onClick={() => { setCurrentSlide(i); setIsPlaying(false); }} className="relative w-10 h-1 rounded-full overflow-hidden bg-white/30">
              {i === currentSlide && isPlaying && <div className="absolute inset-0 bg-white rounded-full" style={{ animation: 'progress 6s linear forwards' }} />}
              {i < currentSlide && <div className="absolute inset-0 bg-white rounded-full" />}
            </button>
          ))}</div>
          <button onClick={() => setCurrentSlide(p => (p + 1) % brands.length)} className="p-2.5 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20"><ChevronRight className="w-5 h-5" /></button>
          <button onClick={() => setIsPlaying(!isPlaying)} className="hidden md:flex p-2.5 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 border border-white/20">{isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}</button>
        </div>
        <style jsx>{`@keyframes progress { from { width: 0%; } to { width: 100%; } }`}</style>
      </section>
      <AISearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

function TrendingProducts() {
  const [products, setProducts] = useState<TrendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch(`${API_URL}/api/v1/products/trending?limit=8`).then(r => r.json()).then(d => setProducts(d.data || [])).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">{[...Array(8)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl animate-pulse"><div className="aspect-square" /><div className="p-4 space-y-2"><div className="h-4 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded w-1/2" /></div></div>)}</div>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {products.map(p => (
        <Link key={p.id} href={`/produits/${p.slug}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
          <div className="aspect-square bg-gray-50 relative overflow-hidden">
            {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" />
              : <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white" style={{ backgroundColor: p.brand.sectorColor }}>{p.name.charAt(0)}</div>}
            {p.isFeatured && <div className="absolute top-2 left-2 bg-france-red text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"><TrendingUp className="w-3 h-3" />Tendance</div>}
          </div>
          <div className="p-4">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: p.brand.sectorColor }}>{p.brand.name}</span>
            <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2 group-hover:text-france-blue transition-colors">{p.name}</h3>
            {p.priceMin && <p className="text-lg font-bold mt-2" style={{ color: p.brand.sectorColor }}>{p.priceMin === p.priceMax || !p.priceMax ? `${p.priceMin.toFixed(2)} €` : `${p.priceMin.toFixed(2)} - ${p.priceMax.toFixed(2)} €`}</p>}
            <div className="mt-3 flex items-center gap-1 text-sm text-gray-500 group-hover:text-france-blue transition-colors"><ShoppingBag className="w-4 h-4" />Voir le produit</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function SectorsGrid() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const ICONS: Record<string, string> = { 'mode-accessoires': '👗', 'maison-jardin': '🏠', 'gastronomie': '🍽️', 'cosmetique': '✨', 'enfance': '🧸', 'loisirs-sport': '⚽', 'animaux': '🐾', 'sante-nutrition': '💚', 'high-tech': '💻' };
  useEffect(() => { fetch(`${API_URL}/api/v1/sectors/with-counts`).then(r => r.json()).then(d => setSectors(d.data || [])).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="grid grid-cols-3 md:grid-cols-6 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="p-6 bg-gray-100 rounded-2xl animate-pulse h-32" />)}</div>;
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
      {sectors.slice(0, 6).map(s => (
        <Link key={s.id} href={`/secteurs/${s.slug}`} className="group p-4 md:p-6 rounded-xl md:rounded-2xl border-2 border-gray-100 hover:border-transparent hover:shadow-xl transition-all bg-white">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-3 md:mb-4 mx-auto transition-transform group-hover:scale-110" style={{ backgroundColor: `${s.color || '#002395'}15` }}>{ICONS[s.slug] || '📦'}</div>
          <h3 className="font-semibold text-gray-900 text-center text-sm md:text-base mb-1">{s.name}</h3>
          <p className="text-xs md:text-sm text-gray-500 text-center">{s.brandCount} marques</p>
        </Link>
      ))}
    </div>
  );
}

function CollectionsGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {COLLECTIONS.map(c => (
        <Link key={c.id} href={`/collections/${c.slug}`} className="group relative h-48 md:h-72 rounded-2xl md:rounded-3xl overflow-hidden">
          <img src={c.image} alt={c.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${c.color}CC 0%, ${c.color}40 100%)` }} />
          <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6">
            <span className="text-white/80 text-xs md:text-sm mb-1">{c.count} marques</span>
            <h3 className="text-white text-lg md:text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>{c.title}</h3>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="bg-[#FAFAF9]">
      <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap');`}</style>
      <HeroSlider />
      <section className="py-16 md:py-20 px-4 md:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div><div className="flex items-center gap-2 text-france-red mb-2"><TrendingUp className="w-5 h-5" /><span className="text-sm font-semibold uppercase tracking-wider">Tendances</span></div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>Produits du moment</h2></div>
            <Link href="/produits" className="hidden md:flex items-center gap-2 text-france-blue font-medium hover:gap-3 transition-all">Voir tout <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <TrendingProducts />
          <div className="text-center mt-8 md:hidden"><Link href="/produits" className="text-france-blue font-medium">Voir tous les produits →</Link></div>
        </div>
      </section>
      <section className="py-16 md:py-20 px-4 md:px-16 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div><div className="flex items-center gap-2 text-purple-600 mb-2"><Sparkles className="w-5 h-5" /><span className="text-sm font-semibold uppercase tracking-wider">Sélections</span></div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>Collections inspirantes</h2></div>
          </div>
          <CollectionsGrid />
        </div>
      </section>
      <section className="py-16 md:py-20 px-4 md:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Explorez par univers</h2>
            <p className="text-gray-600 text-lg">900+ marques dans 6 secteurs d'excellence</p>
          </div>
          <SectorsGrid />
          <div className="text-center mt-8"><Link href="/secteurs" className="text-france-blue font-medium hover:underline">Voir tous les secteurs →</Link></div>
        </div>
      </section>
      <section className="py-16 md:py-20 px-4 md:px-16 bg-gradient-to-br from-france-blue to-blue-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 text-blue-300 mb-4"><MapPin className="w-5 h-5" /><span className="text-sm font-semibold uppercase tracking-wider">Géolocalisation</span></div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>Découvrez les marques près de chez vous</h2>
              <p className="text-blue-100 text-lg mb-8">Explorez la carte interactive et trouvez les entreprises françaises de votre région.</p>
              <Link href="/carte"><Button size="lg" className="bg-white text-france-blue hover:bg-gray-100 rounded-full px-8">Ouvrir la carte<ArrowRight className="w-5 h-5 ml-2" /></Button></Link>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl bg-blue-900/50">
                <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80" alt="Carte" className="w-full h-full object-cover opacity-60" />
                <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-france-red rounded-full animate-ping" />
                <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-france-red rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 md:py-20 px-4 md:px-16 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <Heart className="w-12 h-12 mx-auto mb-6 text-france-red" />
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>Prêt à consommer français ?</h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">Rejoignez le mouvement et découvrez les marques qui font la richesse de notre patrimoine</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/marques"><Button size="lg" className="rounded-full px-8">Explorer les marques<ArrowRight className="w-5 h-5 ml-2" /></Button></Link>
            <Link href="/a-propos"><Button size="lg" variant="outline" className="rounded-full px-8">Notre mission</Button></Link>
          </div>
        </div>
      </section>
    </main>
  );
}