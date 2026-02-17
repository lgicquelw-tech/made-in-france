'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  CheckCircle,
  ArrowRight,
  Search,
  FileText,
  Package,
  BarChart3,
  Star,
  Sparkles,
  Rocket
} from 'lucide-react';

const API_URL = 'http://localhost:4000';

interface Brand {
  name: string;
  slug: string;
}

export default function StudioBienvenuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userBrands, setUserBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/studio/connexion');
      return;
    }

    if (status === 'authenticated' && session?.user?.email) {
      fetchUserBrands();
    }
  }, [status, session]);

  const fetchUserBrands = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/user/brands?email=${encodeURIComponent(session!.user!.email!)}`);
      if (res.ok) {
        const data = await res.json();
        setUserBrands(data.brands || []);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      icon: FileText,
      title: 'Complétez votre fiche',
      description: 'Ajoutez une description, vos coordonnées et votre histoire.',
      color: 'blue',
    },
    {
      icon: Package,
      title: 'Ajoutez vos produits',
      description: 'Présentez vos produits phares à notre communauté.',
      color: 'green',
    },
    {
      icon: BarChart3,
      title: 'Suivez vos statistiques',
      description: 'Analysez les vues et clics sur votre fiche.',
      color: 'purple',
    },
    {
      icon: Star,
      title: 'Passez Premium',
      description: 'Débloquez toutes les fonctionnalités pour booster votre visibilité.',
      color: 'amber',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
        <div className="w-full max-w-3xl">
          {/* Success message */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Bienvenue sur Made in France Studio ! 🎉
            </h1>
            <p className="text-xl text-slate-400">
              {session?.user?.name ? `${session.user.name}, votre` : 'Votre'} compte a été créé avec succès.
            </p>
          </div>

          {/* Next steps */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Rocket className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Prochaines étapes</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const colors: Record<string, string> = {
                  blue: 'bg-blue-500/20 text-blue-400',
                  green: 'bg-green-500/20 text-green-400',
                  purple: 'bg-purple-500/20 text-purple-400',
                  amber: 'bg-amber-500/20 text-amber-400',
                };
                return (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-xl"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[step.color]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white mb-1">{step.title}</h3>
                      <p className="text-sm text-slate-400">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {userBrands.length > 0 ? (
              <Link
                href={`/studio/marque/${userBrands[0].slug}`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                Accéder à mon dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/studio/revendiquer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  <Search className="w-5 h-5" />
                  Rechercher mon entreprise
                </Link>
                <Link
                  href="/studio/inscription"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transition"
                >
                  <Sparkles className="w-5 h-5" />
                  Créer une nouvelle fiche
                </Link>
              </>
            )}
          </div>

          {/* Help */}
          <p className="text-center text-slate-500 text-sm mt-8">
            Besoin d'aide ?{' '}
            <Link href="/contact" className="text-blue-400 hover:underline">
              Contactez-nous
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}