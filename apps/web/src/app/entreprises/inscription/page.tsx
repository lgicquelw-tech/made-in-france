'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const API_URL = 'http://localhost:4000';

export default function InscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const claimSlug = searchParams.get('claim');
  const plan = searchParams.get('plan') || 'free';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [claimedBrand, setClaimedBrand] = useState<any>(null);

  const getLogoUrl = (brand: any): string | null => {
    if (brand?.logoUrl && !brand.logoUrl.includes('clearbit.com')) {
      return brand.logoUrl;
    }
    if (brand?.websiteUrl) {
      try {
        const hostname = new URL(brand.websiteUrl).hostname;
        return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
      } catch {
        return null;
      }
    }
    return null;
  };

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    companyName: '',
    contactName: '',
    phone: '',
    siret: '',
  });

  // Charger la marque à réclamer si présente
  useEffect(() => {
    if (claimSlug) {
      fetch(`${API_URL}/api/v1/brands/${claimSlug}`)
        .then(res => res.json())
        .then(response => {
          const brand = response.data || response.brand || response;
          if (brand && brand.name) {
            setClaimedBrand(brand);
            setFormData(prev => ({
              ...prev,
              companyName: brand.name || '',
            }));
          }
        })
        .catch(console.error);
    }
  }, [claimSlug]);

  // Rediriger si déjà connecté
  useEffect(() => {
    if (session?.user && claimSlug) {
      // Utilisateur connecté et veut réclamer une fiche - associer directement
      const associateBrand = async () => {
        try {
          await fetch(`${API_URL}/api/auth/claim-brand`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: session.user.id,
              brandSlug: claimSlug,
            }),
          });
          router.push(`/espace-marque/${claimSlug}`);
        } catch (error) {
          console.error('Claim error:', error);
        }
      };
      associateBrand();
    }
  }, [session, claimSlug, router]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateStep1 = () => {
    if (!formData.email) {
      setError('L\'email est requis');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Email invalide');
      return false;
    }
    if (!formData.password) {
      setError('Le mot de passe est requis');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    if (formData.password !== formData.passwordConfirm) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.companyName) {
      setError('Le nom de l\'entreprise est requis');
      return false;
    }
    if (!formData.contactName) {
      setError('Le nom du contact est requis');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Créer le compte utilisateur
      const registerRes = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.contactName,
          companyName: formData.companyName,
          phone: formData.phone,
          siret: formData.siret,
          claimBrandSlug: claimSlug,
          plan: plan,
        }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        setError(registerData.error || 'Erreur lors de l\'inscription');
        setLoading(false);
        return;
      }

      // 2. Connecter l'utilisateur
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError('Erreur de connexion après inscription');
        setLoading(false);
        return;
      }

      // 3. Rediriger vers le dashboard ou la vérification
      if (claimSlug) {
        router.push(`/espace-marque/${claimSlug}`);
      } else {
        router.push('/entreprises/bienvenue');
      }

    } catch (err) {
      console.error('Registration error:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const getPlanLabel = () => {
    switch (plan) {
      case 'premium': return 'Premium (29€/mois)';
      case 'sponsored': return 'Sponsorisé (99€/mois)';
      default: return 'Gratuit';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-xl mx-auto px-6 py-4">
          <Link href="/entreprises" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-12">
        {/* Titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl mb-6 overflow-hidden">
            {claimedBrand && getLogoUrl(claimedBrand) ? (
              <img src={getLogoUrl(claimedBrand)!} alt={claimedBrand.name} className="w-full h-full object-contain p-2" />
            ) : (
              <Building2 className="w-8 h-8" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {claimedBrand ? 'Réclamez votre fiche' : 'Créez votre compte'}
          </h1>
          <p className="text-gray-600">
            {claimedBrand 
              ? `Vous réclamez la fiche de ${claimedBrand.name}`
              : 'Inscrivez votre entreprise sur Made in France'
            }
          </p>
          {plan !== 'free' && (
            <div className="mt-3 inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              Formule : {getPlanLabel()}
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
            <span className="font-medium">Compte</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-200" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="font-medium">Entreprise</span>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl border p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email professionnel *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="contact@votre-entreprise.fr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Minimum 8 caractères"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe *</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.passwordConfirm}
                      onChange={(e) => updateField('passwordConfirm', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Confirmez votre mot de passe"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition mt-6"
                >
                  Continuer
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'entreprise *</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => updateField('companyName', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Votre Entreprise SAS"
                      disabled={!!claimedBrand}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du contact *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => updateField('contactName', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Jean Dupont"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone (optionnel)</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="01 23 45 67 89"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SIRET (optionnel)</label>
                  <input
                    type="text"
                    value={formData.siret}
                    onChange={(e) => updateField('siret', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="123 456 789 00012"
                  />
                  <p className="text-xs text-gray-500 mt-1">Le SIRET permet de vérifier votre entreprise plus rapidement</p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Inscription...
                      </>
                    ) : (
                      'Créer mon compte'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Vous avez déjà un compte ?{' '}
            <Link href="/connexion" className="text-blue-600 hover:underline font-medium">
              Connectez-vous
            </Link>
          </div>
        </div>

        {/* Mentions légales */}
        <p className="text-center text-xs text-gray-500 mt-6">
          En vous inscrivant, vous acceptez nos{' '}
          <Link href="/cgu" className="text-blue-600 hover:underline">conditions d'utilisation</Link>
          {' '}et notre{' '}
          <Link href="/confidentialite" className="text-blue-600 hover:underline">politique de confidentialité</Link>.
        </p>
      </div>
    </div>
  );
}