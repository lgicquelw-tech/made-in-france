'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Heart,
  Eye,
  Trophy,
  Star,
  Calendar,
  ArrowRight,
  Sparkles,
  Target,
  Medal,
  Shield,
  ChevronRight,
  MapPin,
  TrendingUp,
  Gift,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Email admin autorisé
const ADMIN_EMAIL = 'lgicquelw@gmail.com';

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  points: number;
  rank: string;
  favoritesCount: number;
  viewsCount: number;
  createdAt: string;
}

const RANKS = [
  { name: 'Explorateur', minPoints: 0, icon: '🌱', color: '#22C55E', gradient: 'from-green-400 to-emerald-600' },
  { name: 'Découvreur', minPoints: 50, icon: '🔍', color: '#3B82F6', gradient: 'from-blue-400 to-blue-600' },
  { name: 'Connaisseur', minPoints: 150, icon: '⭐', color: '#8B5CF6', gradient: 'from-violet-400 to-purple-600' },
  { name: 'Expert', minPoints: 300, icon: '🏆', color: '#F59E0B', gradient: 'from-amber-400 to-orange-600' },
  { name: 'Ambassadeur', minPoints: 500, icon: '👑', color: '#EC4899', gradient: 'from-pink-400 to-rose-600' },
  { name: 'Légende', minPoints: 1000, icon: '💎', color: '#EF4444', gradient: 'from-red-400 to-red-600' },
];

function getCurrentRank(points: number) {
  let currentRank = RANKS[0];
  for (const rank of RANKS) {
    if (points >= rank.minPoints) {
      currentRank = rank;
    }
  }
  return currentRank;
}

function getNextRank(points: number) {
  for (const rank of RANKS) {
    if (points < rank.minPoints) {
      return rank;
    }
  }
  return null;
}

function getProgressToNextRank(points: number) {
  const currentRank = getCurrentRank(points);
  const nextRank = getNextRank(points);

  if (!nextRank) return 100;

  const pointsInCurrentRank = points - currentRank.minPoints;
  const pointsNeededForNext = nextRank.minPoints - currentRank.minPoints;

  return Math.round((pointsInCurrentRank / pointsNeededForNext) * 100);
}

export default function ProfilPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { favorites } = useFavorites();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur est admin
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/connexion');
      return;
    }

    async function fetchProfile() {
      if (!session?.user?.id) return;

      try {
        const res = await fetch(`${API_URL}/api/v1/users/${session.user.id}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.data);
        }
      } catch (error) {
        console.error('Erreur chargement profil:', error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <main className="min-h-screen bg-france-cream">
        {/* Decorative background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-france-blue/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-france-red/5 rounded-full blur-3xl" />
        </div>

        <div className="relative container py-12">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="glass-card rounded-3xl p-8">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gray-200 rounded-2xl" />
                  <div className="space-y-3">
                    <div className="h-6 w-48 bg-gray-200 rounded-lg" />
                    <div className="h-4 w-32 bg-gray-200 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!session || !profile) {
    return (
      <main className="min-h-screen bg-france-cream flex items-center justify-center">
        {/* Decorative background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-france-blue/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-france-red/5 rounded-full blur-3xl" />
        </div>

        <div className="relative text-center glass-card rounded-3xl p-12">
          <div className="w-20 h-20 rounded-2xl bg-france-blue/10 flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-france-blue" />
          </div>
          <h2 className="text-xl font-bold text-france-blue mb-2">Session expirée</h2>
          <p className="text-gray-500 mb-6">Veuillez vous reconnecter pour accéder à votre profil</p>
          <Link href="/connexion">
            <Button className="btn-primary">Se reconnecter</Button>
          </Link>
        </div>
      </main>
    );
  }

  const currentRank = getCurrentRank(profile.points);
  const nextRank = getNextRank(profile.points);
  const progress = getProgressToNextRank(profile.points);
  const memberSince = new Date(profile.createdAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <main className="min-h-screen bg-france-cream">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-france-blue/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-france-red/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-france-blue/3 to-france-red/3 rounded-full blur-3xl" />
      </div>

      <div className="relative container py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Admin Access - Visible uniquement pour l'admin */}
          {isAdmin && (
            <Link href="/admin" className="block group">
              <div className="glass-card rounded-2xl p-5 bg-gradient-to-r from-france-blue to-france-blue/90 text-white border-0 hover:shadow-glow-blue transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">Panel Administration</h2>
                      <p className="text-white/70 text-sm">Gérer les marques, collections et tendances</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 group-hover:translate-x-1 transition-all">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Profile Header */}
          <div className="glass-card rounded-3xl overflow-hidden">
            {/* Header gradient with rank color */}
            <div
              className={`h-36 md:h-44 relative bg-gradient-to-br ${currentRank.gradient}`}
            >
              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
              </div>

              {/* Floating elements */}
              <div className="absolute top-4 right-4 flex gap-2">
                <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                  {currentRank.icon} {currentRank.name}
                </div>
              </div>
            </div>

            <div className="px-6 md:px-8 pb-8">
              <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 -mt-16 md:-mt-12">
                {/* Avatar */}
                <div className="relative">
                  <div className="relative">
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'Avatar'}
                        className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-4 border-white shadow-soft-lg object-cover"
                      />
                    ) : (
                      <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-4 border-white shadow-soft-lg bg-gradient-to-br from-france-blue to-france-blue/80 flex items-center justify-center">
                        <User className="h-14 w-14 text-white" />
                      </div>
                    )}
                    {/* Rank badge */}
                    <div
                      className={`absolute -bottom-2 -right-2 w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg bg-gradient-to-br ${currentRank.gradient}`}
                    >
                      {currentRank.icon}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 pt-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-france-blue">
                    {profile.name || 'Utilisateur'}
                  </h1>
                  <p className="text-gray-500">{profile.email}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                      <Calendar className="h-3.5 w-3.5" />
                      Membre depuis {memberSince}
                    </span>
                  </div>
                </div>

                {/* Points display */}
                <div className="glass-card rounded-2xl p-4 text-center bg-white/80">
                  <div className="flex items-center gap-2 justify-center">
                    <Zap className="w-5 h-5" style={{ color: currentRank.color }} />
                    <span className="text-3xl font-bold" style={{ color: currentRank.color }}>
                      {profile.points}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 font-medium">points</div>
                </div>
              </div>
            </div>
          </div>

          {/* Rank Progress */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${currentRank.gradient}`}>
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-france-blue">Votre progression</h2>
                <p className="text-sm text-gray-500">Rang actuel : {currentRank.name}</p>
              </div>
            </div>

            {nextRank ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{currentRank.icon}</span>
                    <span className="font-medium text-gray-700">{currentRank.name}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">{nextRank.name}</span>
                    <span className="text-xl">{nextRank.icon}</span>
                  </span>
                </div>
                <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${currentRank.gradient} transition-all duration-700`}
                    style={{ width: `${progress}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white drop-shadow-sm">{progress}%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Plus que <span className="font-semibold text-france-blue">{nextRank.minPoints - profile.points}</span> points pour atteindre {nextRank.name} !
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">🎉</div>
                <p className="font-semibold text-france-blue">Félicitations !</p>
                <p className="text-sm text-gray-500">Vous avez atteint le rang maximum !</p>
              </div>
            )}

            {/* All ranks display */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Tous les rangs
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {RANKS.map((rank) => {
                  const isUnlocked = profile.points >= rank.minPoints;
                  const isCurrent = currentRank.name === rank.name;

                  return (
                    <div
                      key={rank.name}
                      className={`text-center p-3 rounded-xl transition-all ${
                        isCurrent
                          ? `ring-2 ring-offset-2 bg-gradient-to-br ${rank.gradient} text-white`
                          : isUnlocked
                            ? 'bg-gray-50 hover:bg-gray-100'
                            : 'bg-gray-50 opacity-40'
                      }`}
                      style={{
                        ringColor: isCurrent ? rank.color : undefined
                      }}
                    >
                      <div className={`text-2xl mb-1 ${!isCurrent && !isUnlocked ? 'grayscale' : ''}`}>{rank.icon}</div>
                      <div className={`text-xs font-medium ${isCurrent ? 'text-white' : 'text-gray-700'}`}>{rank.name}</div>
                      <div className={`text-xs ${isCurrent ? 'text-white/70' : 'text-gray-400'}`}>{rank.minPoints}pts</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-5 group hover:shadow-soft-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-france-red/10 to-france-red/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Heart className="h-6 w-6 text-france-red" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-france-blue">{profile.favoritesCount}</div>
                  <div className="text-sm text-gray-500">favoris</div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 group hover:shadow-soft-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-france-blue/10 to-france-blue/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Eye className="h-6 w-6 text-france-blue" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-france-blue">{profile.viewsCount}</div>
                  <div className="text-sm text-gray-500">marques vues</div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 group hover:shadow-soft-lg transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-france-gold/20 to-amber-200/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-6 w-6 text-france-gold" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-france-blue">{profile.points}</div>
                  <div className="text-sm text-gray-500">points gagnés</div>
                </div>
              </div>
            </div>
          </div>

          {/* Comment gagner des points */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-france-blue">Comment gagner des points ?</h2>
                <p className="text-sm text-gray-500">Explorez et interagissez pour progresser</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-france-red/5 to-transparent rounded-xl border border-france-red/10 hover:border-france-red/20 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-france-red/10 to-france-red/20 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-france-red" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Ajouter un favori</div>
                  <div className="text-sm text-gray-500">Sauvegardez vos marques préférées</div>
                </div>
                <div className="px-3 py-1 bg-france-red/10 text-france-red rounded-full text-sm font-semibold">
                  +5 pts
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-france-blue/5 to-transparent rounded-xl border border-france-blue/10 hover:border-france-blue/20 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-france-blue/10 to-france-blue/20 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-france-blue" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Découvrir une marque</div>
                  <div className="text-sm text-gray-500">Visitez de nouvelles pages</div>
                </div>
                <div className="px-3 py-1 bg-france-blue/10 text-france-blue rounded-full text-sm font-semibold">
                  +1 pt
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl opacity-60 relative overflow-hidden">
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                  Bientôt
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Target className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-700">Compléter un défi</div>
                  <div className="text-sm text-gray-400">Des défis hebdomadaires arrivent</div>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-semibold">
                  +20 pts
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl opacity-60 relative overflow-hidden">
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                  Bientôt
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Medal className="h-5 w-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-700">Laisser un avis</div>
                  <div className="text-sm text-gray-400">Partagez votre expérience</div>
                </div>
                <div className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold">
                  +10 pts
                </div>
              </div>
            </div>
          </div>

          {/* Favoris récents */}
          {favorites.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-france-red/10 to-france-red/20 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-france-red" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-france-blue">Vos derniers favoris</h2>
                    <p className="text-sm text-gray-500">{favorites.length} marques sauvegardées</p>
                  </div>
                </div>
                <Link href="/favoris" className="flex items-center gap-1 text-sm text-france-blue hover:text-france-red transition-colors font-medium">
                  Voir tout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                {favorites.slice(0, 3).map((fav) => (
                  <Link
                    key={fav.id}
                    href={`/marques/${fav.brand.slug}`}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-france-blue/20 hover:shadow-soft transition-all group"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: fav.brand.sectorColor ? `${fav.brand.sectorColor}15` : '#f3f4f6' }}
                    >
                      <span
                        className="text-lg font-bold"
                        style={{ color: fav.brand.sectorColor || '#6b7280' }}
                      >
                        {fav.brand.name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate group-hover:text-france-blue transition-colors">{fav.brand.name}</div>
                      <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {fav.brand.city}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-france-blue group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA Explorer */}
          <div className="relative overflow-hidden rounded-3xl">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-france-blue via-france-blue to-france-blue/90" />

            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-france-red/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
              {/* French flag accent */}
              <div className="absolute top-0 right-0 w-2 h-full flex flex-col">
                <div className="flex-1 bg-france-blue/50" />
                <div className="flex-1 bg-white/20" />
                <div className="flex-1 bg-france-red/30" />
              </div>
            </div>

            <div className="relative p-8 md:p-10 text-center text-white">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Continuez à explorer !</h2>
              <p className="text-white/80 mb-8 max-w-md mx-auto">
                Découvrez de nouvelles marques Made in France et gagnez des points pour débloquer des rangs exclusifs.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/marques">
                  <Button className="bg-white text-france-blue hover:bg-france-cream px-6 py-3 h-auto font-semibold shadow-lg hover:shadow-xl transition-all">
                    Explorer les marques
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/carte">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-6 py-3 h-auto font-semibold backdrop-blur-sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    Voir la carte
                  </Button>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
