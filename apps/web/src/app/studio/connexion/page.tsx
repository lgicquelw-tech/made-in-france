'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

export default function StudioConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email ou mot de passe incorrect');
        setLoading(false);
        return;
      }

      // Récupérer les marques de l'utilisateur
      const API_URL = 'http://localhost:4000';
      const res = await fetch(`${API_URL}/api/v1/user/brands?email=${encodeURIComponent(email)}`);
      
      if (res.ok) {
        const data = await res.json();
        if (data.brands && data.brands.length > 0) {
          router.push(`/studio/marque/${data.brands[0].slug}`);
          return;
        }
      }

      // Si pas de marque, rediriger vers revendiquer
      router.push('/studio/revendiquer');

    } catch (err) {
      console.error('Login error:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/studio" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">Made in France</span>
              <span className="text-xl font-light text-blue-400 ml-1">Studio</span>
            </div>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link href="/studio" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Connexion</h1>
            <p className="text-slate-400">Accédez à votre espace professionnel</p>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email professionnel
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="contact@votre-entreprise.fr"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre mot de passe"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-400">
                  <input type="checkbox" className="rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500" />
                  Se souvenir de moi
                </label>
                <Link href="/studio/mot-de-passe-oublie" className="text-blue-400 hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-700 text-center">
              <p className="text-slate-400 text-sm">
                Pas encore de compte ?{' '}
                <Link href="/studio/inscription" className="text-blue-400 hover:underline font-medium">
                  Inscrivez-vous gratuitement
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}