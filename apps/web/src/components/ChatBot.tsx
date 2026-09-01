'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, MapPin, Package, Building2 } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  priceMin: number | null;
  priceMax: number | null;
  buyUrl: string | null;
  brandName: string;
  brandSlug: string;
  sectorColor: string;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  city: string | null;
  sectorName: string | null;
  sectorColor: string;
  regionName?: string | null;
  productCount?: number;
  websiteUrl?: string | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
  brands?: Brand[];
  searchMode?: 'brands' | 'products' | 'both';
}

// Fonction pour obtenir le logo
const getLogoUrl = (brand: Brand): string | null => {
  if (brand.logoUrl) return brand.logoUrl;
  if (brand.websiteUrl) {
    try {
      const hostname = new URL(brand.websiteUrl).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
    } catch {
      return null;
    }
  }
  return null;
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage || input.trim();
    if (!messageToSend || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message || 'Désolé, une erreur est survenue.',
        products: data.products || [],
        brands: data.brands || [],
        searchMode: data.context?.searchMode || 'both',
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Désolé, je ne peux pas répondre pour le moment.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Bulle flottante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen 
            ? 'bg-gray-600 hover:bg-gray-700' 
            : 'bg-france-blue hover:bg-blue-700'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[420px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-france-blue to-blue-700 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Assistant Made in France</h3>
                <p className="text-xs text-blue-100">Trouvez des produits et marques 🇫🇷</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-4">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-300" />
                <p className="font-medium">Bonjour ! 👋</p>
                <p className="text-sm mt-2">
                  Je suis votre assistant shopping Made in France.
                </p>
                <div className="mt-4 space-y-2">
                  {[
                    'Marques de chaussures françaises',
                    'Idée cadeau à moins de 30€',
                    'Cosmétiques bio made in france',
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(suggestion)}
                      className="block w-full text-left px-3 py-2 text-sm bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className="space-y-3">
                {/* Message texte */}
                <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-france-blue text-white rounded-br-md'
                        : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>

                {/* ========== GRILLE DE MARQUES ========== */}
                {message.brands && message.brands.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                      <Building2 className="w-3 h-3" />
                      <span>{message.brands.length} marque{message.brands.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {message.brands.slice(0, 6).map((brand) => {
                        const logoUrl = getLogoUrl(brand);
                        return (
                          <Link
                            key={brand.id}
                            href={`/marques/${brand.slug}`}
                            className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md hover:border-france-blue/30 transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              {/* Logo */}
                              <div 
                                className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                                style={{ backgroundColor: brand.sectorColor ? `${brand.sectorColor}15` : '#f3f4f6' }}
                              >
                                {logoUrl ? (
                                  <img
                                    src={logoUrl}
                                    alt={brand.name}
                                    className="w-8 h-8 object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <span 
                                    className="text-lg font-bold"
                                    style={{ color: brand.sectorColor || '#002395' }}
                                  >
                                    {brand.name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              
                              {/* Infos */}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-france-blue transition-colors">
                                  {brand.name}
                                </p>
                                {brand.sectorName && (
                                  <p 
                                    className="text-xs truncate"
                                    style={{ color: brand.sectorColor || '#6b7280' }}
                                  >
                                    {brand.sectorName}
                                  </p>
                                )}
                                {brand.city && (
                                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3" />
                                    {brand.city}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Compteur produits */}
                            {brand.productCount && brand.productCount > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1 text-xs text-gray-500">
                                <Package className="w-3 h-3" />
                                {brand.productCount} produit{brand.productCount > 1 ? 's' : ''}
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                    
                    {/* Voir plus de marques */}
                    {message.brands.length > 6 && (
                      <div className="text-center">
                        <Link
                          href={`/marques`}
                          className="text-xs text-france-blue hover:underline"
                        >
                          Voir toutes les marques →
                        </Link>
                      </div>
                    )}
                  </>
                )}

                {/* ========== GRILLE DE PRODUITS ========== */}
                {message.products && message.products.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                      <Package className="w-3 h-3" />
                      <span>{message.products.length} produit{message.products.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {message.products.slice(0, 4).map((product) => (
                        <Link
                          key={product.id}
                          href={`/produits/${product.slug}`}
                          className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
                        >
                          <div className="aspect-square relative bg-gray-100">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Sparkles className="w-8 h-8" />
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium text-gray-900 line-clamp-1">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {product.brandName}
                            </p>
                            {product.priceMin && (
                              <p className="text-sm font-bold text-france-blue mt-1">
                                {product.priceMin}€
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                    
                    {/* Voir plus de produits */}
                    {message.products.length > 4 && (
                      <div className="text-center">
                        <Link
                          href={`/recherche?q=${encodeURIComponent(messages[index - 1]?.content || '')}`}
                          className="text-xs text-france-blue hover:underline"
                        >
                          Voir les {message.products.length} produits →
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                  <Loader2 className="w-5 h-5 animate-spin text-france-blue" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-france-blue focus:border-transparent text-sm"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-france-blue text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}