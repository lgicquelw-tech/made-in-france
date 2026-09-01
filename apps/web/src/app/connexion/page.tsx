'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import { Chrome, Mail, ArrowLeft, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ConnexionPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading('google');
    await signIn('google', { callbackUrl: '/' });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-france-blue to-blue-600 rounded-2xl mb-4">
              <span className="text-2xl">🇫🇷</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Connexion
            </h1>
            <p className="text-gray-600">
              Accédez à vos favoris et recommandations personnalisées
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-blue-900 mb-2">
              En créant un compte, vous pourrez :
            </p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>❤️ Sauvegarder vos marques favorites</li>
              <li>🎯 Recevoir des recommandations personnalisées</li>
              <li>🏆 Cumuler des points et monter en rang</li>
              <li>🔔 Être notifié des nouvelles marques</li>
            </ul>
          </div>

          {/* Sign in buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading !== null}
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm"
            >
              {isLoading === 'google' ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Chrome className="h-5 w-5 mr-2 text-blue-500" />
              )}
              Continuer avec Google
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Bientôt disponible</span>
              </div>
            </div>

            {/* Other providers (disabled for now) */}
            <Button
              disabled
              className="w-full h-12 bg-gray-100 text-gray-400 cursor-not-allowed"
            >
              <Mail className="h-5 w-5 mr-2" />
              Continuer avec Email
            </Button>

            <Button
              disabled
              className="w-full h-12 bg-gray-100 text-gray-400 cursor-not-allowed"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
              </svg>
              Continuer avec Apple
            </Button>
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-500 text-center mt-6">
            En continuant, vous acceptez nos{' '}
            <Link href="/mentions-legales" className="text-france-blue hover:underline">
              conditions d'utilisation
            </Link>{' '}
            et notre{' '}
            <Link href="/mentions-legales" className="text-france-blue hover:underline">
              politique de confidentialité
            </Link>
          </p>
        </div>

        {/* Espace Pro Link */}
        <div className="mt-6 text-center">
          <p className="text-white/70 mb-3">Vous êtes une entreprise ?</p>
          <Link 
            href="/studio" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-colors shadow-lg"
          >
            <Building2 className="h-5 w-5 text-blue-600" />
            Accédez à l'Espace Pro
          </Link>
        </div>
      </div>
    </main>
  );
}