'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  BarChart3,
  Package,
  Settings,
  Check,
  X,
  Star,
  Crown,
  Zap,
  ArrowLeft,
  CreditCard,
  Shield,
  TrendingUp,
  Image as ImageIcon,
  Video,
  Users,
  Bell,
  Award,
  BarChart,
  Search,
  Megaphone,
  Loader2
} from 'lucide-react';


type SubscriptionTier = 'FREE' | 'PREMIUM' | 'ROYALE';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  subscriptionTier: SubscriptionTier;
}

// Ce tableau ne porte que la présentation — nom, icône, couleur, ce que le palier
// contient. **Les tarifs viennent de `/api/v1/plans`**, donc de la même table que la
// caisse : un prix écrit ici finirait par mentir le jour où le tarif change en base.
const PLANS = [
  {
    id: 'FREE',
    name: 'Gratuit',
    description: 'Pour découvrir la plateforme',
    icon: Zap,
    color: 'slate',
    features: [
      { name: 'Fiche entreprise basique', included: true },
      { name: '1 photo', included: true },
      { name: 'Lien vers votre site', included: true },
      { name: 'Statistiques de base (vues)', included: true },
      { name: '5 produits maximum', included: true },
      { name: 'Photos illimitées', included: false },
      { name: 'Vidéo de présentation', included: false },
      { name: 'Produits illimités', included: false },
      { name: 'Badges Tendance/Nouveau/Promo', included: false },
      { name: 'Statistiques avancées', included: false },
      { name: 'Réseaux sociaux', included: false },
      { name: 'SEO personnalisé', included: false },
      { name: 'Badge vérifié', included: false },
      { name: 'Priorité dans les recherches', included: false },
      { name: 'Alertes clients', included: false },
      { name: 'Mise en avant homepage', included: false },
    ],
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    description: 'Pour développer votre visibilité',
    icon: Star,
    color: 'blue',
    popular: true,
    features: [
      { name: 'Fiche entreprise complète', included: true },
      { name: '10 photos', included: true },
      { name: 'Lien vers votre site', included: true },
      { name: 'Statistiques de base (vues)', included: true },
      { name: '100 produits maximum', included: true },
      { name: 'Photos illimitées', included: true },
      { name: 'Vidéo de présentation', included: true },
      { name: 'Produits illimités', included: false },
      { name: 'Badges Tendance/Nouveau/Promo', included: true },
      { name: 'Statistiques avancées', included: true },
      { name: 'Réseaux sociaux', included: true },
      { name: 'SEO personnalisé', included: true },
      { name: 'Badge vérifié', included: true },
      { name: 'Priorité dans les recherches', included: true },
      { name: 'Alertes clients', included: false },
      { name: 'Mise en avant homepage', included: false },
    ],
  },
  {
    id: 'ROYALE',
    name: 'Royale',
    description: 'Pour dominer votre marché',
    icon: Crown,
    color: 'amber',
    features: [
      { name: 'Fiche entreprise premium', included: true },
      { name: '50 photos', included: true },
      { name: 'Lien vers votre site', included: true },
      { name: 'Statistiques de base (vues)', included: true },
      { name: 'Produits illimités', included: true },
      { name: 'Photos illimitées', included: true },
      { name: 'Vidéo de présentation', included: true },
      { name: 'Produits illimités', included: true },
      { name: 'Badges Tendance/Nouveau/Promo', included: true },
      { name: 'Statistiques avancées', included: true },
      { name: 'Réseaux sociaux', included: true },
      { name: 'SEO personnalisé', included: true },
      { name: 'Badge vérifié', included: true },
      { name: 'Priorité dans les recherches', included: true },
      { name: 'Alertes clients', included: true },
      { name: 'Mise en avant homepage', included: true },
    ],
  },
];

const PLAN_COLORS: Record<string, { bg: string; text: string; border: string; button: string }> = {
  slate: {
    bg: 'bg-slate-800',
    text: 'text-slate-400',
    border: 'border-slate-700',
    button: 'bg-slate-700 hover:bg-slate-600 text-white',
  },
  blue: {
    bg: 'bg-blue-600/10',
    text: 'text-blue-400',
    border: 'border-blue-500/50',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/50',
    button: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white',
  },
};

export default function StudioAbonnementPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Les tarifs viennent de la base, jamais de cette page : c'est la caisse qui les
  // applique, et un prix affiché différent de celui facturé serait mensonger.
  const [tarifs, setTarifs] = useState<Record<string, { mensuel: number | null; annuel: number | null }> | null>(null);
  const [ouverturePortail, setOuverturePortail] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/studio/connexion');
      return;
    }

    // Gérer les paramètres de retour Stripe
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('success') === 'true') {
      setSuccessMessage('🎉 Votre abonnement a été activé avec succès !');
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (searchParams.get('canceled') === 'true') {
      setSuccessMessage(null);
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (slug) {
      fetchBrand();
      fetchTarifs();
    }
  }, [slug, status]);

  const fetchTarifs = async () => {
    try {
      const res = await fetch('/api/v1/plans');
      if (!res.ok) return;
      const { data } = await res.json();
      const parTier: Record<string, { mensuel: number | null; annuel: number | null }> = {};
      for (const p of data as { tier: string; priceMonthly: number | null; priceYearly: number | null }[]) {
        parTier[p.tier] = { mensuel: p.priceMonthly, annuel: p.priceYearly };
      }
      setTarifs(parTier);
    } catch (error) {
      console.error('Erreur chargement des tarifs:', error);
    }
  };

  const ouvrirLePortail = async () => {
    setOuverturePortail(true);
    try {
      const res = await fetch('/api/v1/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandSlug: slug }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      alert("Impossible d'ouvrir la gestion de l'abonnement pour le moment.");
    } catch (error) {
      console.error('Stripe portal error:', error);
      alert("Impossible d'ouvrir la gestion de l'abonnement pour le moment.");
    } finally {
      setOuverturePortail(false);
    }
  };

  const fetchBrand = async () => {
    try {
      const res = await fetch(`/api/v1/brands/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setBrand(data.data || data);
      }
    } catch (error) {
      console.error('Error fetching brand:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!brand || planId === brand.subscriptionTier || planId === 'FREE') return;

    setProcessingPlan(planId);

    try {
      const res = await fetch(`/api/v1/stripe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // L'adresse e-mail vient de la session côté serveur : l'envoyer d'ici était
          // précisément la forme de la faille fermée en T8.6.
          brandSlug: slug,
          plan: planId,
          billingCycle,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Erreur lors de la création de la session de paiement');
        setProcessingPlan(null);
      }
    } catch (error) {
      console.error('Stripe checkout error:', error);
      alert('Erreur lors de la redirection vers le paiement');
      setProcessingPlan(null);
    }
  };

  const getLogoUrl = (brand: Brand): string | null => {
    if (brand.logoUrl && !brand.logoUrl.includes('clearbit.com')) {
      return brand.logoUrl;
    }
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

  const currentPlan = brand?.subscriptionTier || 'FREE';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Marque non trouvée</h1>
          <Link href="/studio" className="text-blue-400 hover:underline">Retour</Link>
        </div>
      </div>
    );
  }

  const logoUrl = getLogoUrl(brand);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/studio/marque/${slug}`}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Retour au dashboard</span>
              </Link>
            </div>
            <Link href="/studio" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">MiF</span>
                <span className="text-lg font-light text-blue-400 ml-1">Studio</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Success message */}
        {successMessage && (
          <div className="mb-8 p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-center">
            <p className="text-green-400 font-medium">{successMessage}</p>
          </div>
        )}

        {/* Gérer un abonnement en cours (T8.5) — la route du portail existait déjà mais
            aucun écran ne l'appelait : une marque abonnée n'avait aucun moyen de changer
            de carte, de télécharger ses factures ou de résilier. */}
        {currentPlan !== 'FREE' && (
          <div className="mb-8 p-5 bg-slate-800 border border-slate-700 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-white font-medium">Abonnement {currentPlan === 'ROYALE' ? 'Royale' : 'Premium'} en cours</p>
              <p className="text-slate-400 text-sm">Moyen de paiement, factures, résiliation : tout se gère chez notre prestataire de paiement.</p>
            </div>
            <button
              type="button"
              onClick={ouvrirLePortail}
              disabled={ouverturePortail}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition disabled:opacity-50"
            >
              {ouverturePortail ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              Gérer mon abonnement
            </button>
          </div>
        )}

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Développez votre visibilité et atteignez plus de consommateurs engagés pour le Made in France.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-500'}`}>
            Mensuel
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="relative w-14 h-8 bg-slate-700 rounded-full transition"
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-blue-600 rounded-full transition-all ${
                billingCycle === 'yearly' ? 'left-7' : 'left-1'
              }`}
            />
          </button>
          <span className={`text-sm ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-500'}`}>
            Annuel
            <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
              -17%
            </span>
          </span>
        </div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {PLANS.map((plan) => {
            const colors = PLAN_COLORS[plan.color];
            const isCurrentPlan = currentPlan === plan.id;
            const tarif = tarifs?.[plan.id];
            const mensuel = tarif?.mensuel ?? null;
            const annuel = tarif?.annuel ?? null;
            const price = billingCycle === 'monthly' ? mensuel : annuel === null ? null : Math.round(annuel / 12);
            const Icon = plan.icon;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 ${colors.border} ${colors.bg} p-8 transition ${
                  plan.popular ? 'scale-105 shadow-xl shadow-blue-500/20' : ''
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                    Le plus populaire
                  </div>
                )}

                {/* Current plan badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                    Plan actuel
                  </div>
                )}

                {/* Header */}
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${
                    plan.color === 'amber' ? 'bg-amber-500/20' : plan.color === 'blue' ? 'bg-blue-500/20' : 'bg-slate-700'
                  } mb-4`}>
                    <Icon className={`w-7 h-7 ${colors.text}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-slate-400 text-sm">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  {price === null ? (
                    // Pas de tarif connu : on ne devine pas un prix, on le dit.
                    <p className="text-slate-400 py-4">Tarif indisponible</p>
                  ) : (
                    <div className="flex items-end justify-center gap-1">
                      <span className="text-5xl font-bold text-white">{price}</span>
                      <span className="text-slate-400 mb-2">€/mois</span>
                    </div>
                  )}
                  {billingCycle === 'yearly' && annuel !== null && annuel > 0 && (
                    <p className="text-sm text-slate-500 mt-1">
                      Facturé {annuel}€/an
                    </p>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrentPlan || processingPlan !== null || (plan.id !== 'FREE' && price === null)}
                  className={`w-full py-3 rounded-xl font-semibold transition mb-6 flex items-center justify-center gap-2 ${
                    isCurrentPlan
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : colors.button
                  } disabled:opacity-50`}
                >
                  {processingPlan === plan.id ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Traitement...
                    </>
                  ) : isCurrentPlan ? (
                    'Plan actuel'
                  ) : currentPlan === 'FREE' ? (
                    <>
                      Choisir {plan.name}
                    </>
                  ) : (
                    <>
                      {PLANS.findIndex(p => p.id === plan.id) > PLANS.findIndex(p => p.id === currentPlan)
                        ? 'Upgrader'
                        : 'Downgrader'
                      }
                    </>
                  )}
                </button>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-slate-300' : 'text-slate-600'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-800 rounded-xl p-6 text-center border border-slate-700">
            <Shield className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h4 className="font-semibold text-white mb-1">Paiement sécurisé</h4>
            <p className="text-sm text-slate-400">Transactions cryptées via Stripe</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 text-center border border-slate-700">
            <CreditCard className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <h4 className="font-semibold text-white mb-1">Sans engagement</h4>
            <p className="text-sm text-slate-400">Annulez à tout moment</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 text-center border border-slate-700">
            <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-3" />
            <h4 className="font-semibold text-white mb-1">ROI garanti</h4>
            <p className="text-sm text-slate-400">Satisfait ou remboursé 30 jours</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Questions fréquentes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-white mb-2">Puis-je changer de plan à tout moment ?</h3>
              <p className="text-slate-400 text-sm">
                Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Le changement prend effet immédiatement.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Comment fonctionne la facturation ?</h3>
              <p className="text-slate-400 text-sm">
                Vous êtes facturé au début de chaque période (mensuelle ou annuelle). La facturation annuelle vous fait économiser 2 mois.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Que se passe-t-il si j'annule ?</h3>
              <p className="text-slate-400 text-sm">
                Votre plan reste actif jusqu'à la fin de la période payée, puis repasse automatiquement en plan Gratuit.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Y a-t-il un essai gratuit ?</h3>
              <p className="text-slate-400 text-sm">
                Le plan Gratuit vous permet de découvrir la plateforme. Vous pouvez ensuite upgrader quand vous êtes prêt.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}