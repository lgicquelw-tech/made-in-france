'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  BarChart3,
  Package,
  Settings,
  LogIn,
  UserPlus,
  ArrowRight,
  Star,
  TrendingUp,
  Eye
} from 'lucide-react';

export default function StudioHomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Si connecté, rediriger vers le dashboard
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Vérifier si l'utilisateur a des marques
      const checkBrands = async () => {
        try {
          const res = await fetch(`http://localhost:4000/api/v1/user/brands?email=${encodeURIComponent(session.user.email!)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.brands && data.brands.length > 0) {
              router.push(`/studio/marque/${data.brands[0].slug}`);
              return;
            }
          }
        } catch (error) {
          console.error('Error checking brands:', error);
        }
      };
      checkBrands();
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
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

          <div className="flex items-center gap-4">
            <Link
              href="/studio/connexion"
              className="text-slate-300 hover:text-white transition flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Connexion
            </Link>
            <Link
              href="/studio/inscription"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              S'inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium mb-8">
            <Star className="w-4 h-4" />
            Espace professionnel
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-6">
            Gérez votre présence sur<br />
            <span className="text-blue-400">Made in France</span>
          </h1>
          
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Tableau de bord complet pour gérer votre fiche entreprise, 
            vos produits et analyser vos performances.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/studio/inscription"
              className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition flex items-center gap-2"
            >
              Commencer gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/studio/connexion"
              className="px-8 py-4 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transition"
            >
              J'ai déjà un compte
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-slate-700">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Tout ce dont vous avez besoin
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="w-14 h-14 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Statistiques détaillées</h3>
              <p className="text-slate-400">
                Suivez vos vues, clics et favoris. Comparez vos performances avec votre secteur.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="w-14 h-14 bg-green-600/20 rounded-xl flex items-center justify-center mb-6">
                <Package className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Gestion des produits</h3>
              <p className="text-slate-400">
                Ajoutez, modifiez et organisez votre catalogue produits en quelques clics.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <div className="w-14 h-14 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Visibilité maximale</h3>
              <p className="text-slate-400">
                Optimisez votre fiche pour apparaître en tête des recherches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-slate-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Votre entreprise est déjà référencée ?
          </h2>
          <p className="text-slate-400 mb-8">
            Réclamez votre fiche pour en prendre le contrôle gratuitement.
          </p>
          <Link
            href="/studio/revendiquer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transition"
          >
            <TrendingUp className="w-5 h-5" />
            Rechercher mon entreprise
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-slate-500 text-sm">
          <p>© 2025 Made in France Studio</p>
          <Link href="/" className="hover:text-white transition">
            ← Retour au site public
          </Link>
        </div>
      </footer>
    </div>
  );
}