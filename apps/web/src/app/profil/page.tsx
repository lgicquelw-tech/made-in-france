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
  Shield
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
  { name: 'Explorateur', minPoints: 0, icon: '🌱', color: '#22C55E' },
  { name: 'Découvreur', minPoints: 50, icon: '🔍', color: '#3B82F6' },
  { name: 'Connaisseur', minPoints: 150, icon: '⭐', color: '#8B5CF6' },
  { name: 'Expert', minPoints: 300, icon: '🏆', color: '#F59E0B' },
  { name: 'Ambassadeur', minPoints: 500, icon: '👑', color: '#EC4899' },
  { name: 'Légende', minPoints: 1000, icon: '💎', color: '#EF4444' },
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
      <main className="min-h-screen bg-gray-50">
        <div className="container py-12">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="bg-white rounded-2xl p-8">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gray-200 rounded-full" />
                  <div className="space-y-3">
                    <div className="h-6 w-48 bg-gray-200 rounded" />
                    <div className="h-4 w-32 bg-gray-200 rounded" />
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
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Session expirée ou profil introuvable</p>
        <Link href="/connexion">
          <Button>Se reconnecter</Button>
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
    <main className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Admin Access - Visible uniquement pour l'admin */}
          {isAdmin && (
            <Link href="/admin">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-sm p-6 text-white hover:shadow-lg transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg">Administration</h2>
                      <p className="text-gray-400 text-sm">Gérer les marques, collections et tendances</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </Link>
          )}

          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div 
              className="h-32 relative"
              style={{ 
                background: `linear-gradient(135deg, ${currentRank.color}90, ${currentRank.color}40)`
              }}
            >
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
              </div>
            </div>
            
            <div className="px-8 pb-8">
              <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-12">
                {/* Avatar */}
                <div className="relative">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'Avatar'}
                      className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg bg-france-blue flex items-center justify-center">
                      <User className="h-12 w-12 text-white" />
                    </div>
                  )}
                  <div 
                    className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg"
                    style={{ backgroundColor: currentRank.color }}
                  >
                    {currentRank.icon}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.name || 'Utilisateur'}
                  </h1>
                  <p className="text-gray-500">{profile.email}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Membre depuis {memberSince}
                    </span>
                  </div>
                </div>

                {/* Points */}
                <div className="text-center md:text-right">
                  <div className="text-3xl font-bold" style={{ color: currentRank.color }}>
                    {profile.points}
                  </div>
                  <div className="text-sm text-gray-500">points</div>
                </div>
              </div>
            </div>
          </div>

          {/* Rank & Progress */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h2 className="font-semibold text-gray-900">Votre rang</h2>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${currentRank.color}20` }}
              >
                {currentRank.icon}
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color: currentRank.color }}>
                  {currentRank.name}
                </div>
                {nextRank && (
                  <div className="text-sm text-gray-500">
                    Prochain rang : {nextRank.name} ({nextRank.minPoints - profile.points} points restants)
                  </div>
                )}
              </div>
            </div>

            {nextRank && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Progression vers {nextRank.name}</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${progress}%`,
                      backgroundColor: currentRank.color 
                    }}
                  />
                </div>
              </div>
            )}

            {/* All ranks */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Tous les rangs</h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {RANKS.map((rank) => {
                  const isUnlocked = profile.points >= rank.minPoints;
                  const isCurrent = currentRank.name === rank.name;
                  
                  return (
                    <div 
                      key={rank.name}
                      className={`text-center p-3 rounded-xl transition-all ${
                        isCurrent 
                          ? 'ring-2 ring-offset-2' 
                          : isUnlocked 
                            ? 'bg-gray-50' 
                            : 'bg-gray-50 opacity-50'
                      }`}
                      style={{ 
                        ringColor: isCurrent ? rank.color : undefined 
                      }}
                    >
                      <div className="text-2xl mb-1">{rank.icon}</div>
                      <div className="text-xs font-medium text-gray-700">{rank.name}</div>
                      <div className="text-xs text-gray-400">{rank.minPoints}pts</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{profile.favoritesCount}</div>
                  <div className="text-sm text-gray-500">favoris</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{profile.viewsCount}</div>
                  <div className="text-sm text-gray-500">marques vues</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{profile.points}</div>
                  <div className="text-sm text-gray-500">points gagnés</div>
                </div>
              </div>
            </div>
          </div>

          {/* Comment gagner des points */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <h2 className="font-semibold text-gray-900">Comment gagner des points ?</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Ajouter un favori</div>
                  <div className="text-sm text-gray-500">+5 points par marque</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Découvrir une marque</div>
                  <div className="text-sm text-gray-500">+1 point par visite</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl opacity-50">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Target className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Compléter un défi</div>
                  <div className="text-sm text-gray-500">Bientôt disponible</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl opacity-50">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Medal className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Laisser un avis</div>
                  <div className="text-sm text-gray-500">Bientôt disponible</div>
                </div>
              </div>
            </div>
          </div>

          {/* Favoris récents */}
          {favorites.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-red-500" />
                  <h2 className="font-semibold text-gray-900">Vos derniers favoris</h2>
                </div>
                <Link href="/favoris" className="text-sm text-france-blue hover:underline flex items-center gap-1">
                  Voir tout
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                {favorites.slice(0, 3).map((fav) => (
                  <Link
                    key={fav.id}
                    href={`/marques/${fav.brand.slug}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: fav.brand.sectorColor ? `${fav.brand.sectorColor}15` : '#f3f4f6' }}
                    >
                      <span 
                        className="text-lg font-bold"
                        style={{ color: fav.brand.sectorColor || '#6b7280' }}
                      >
                        {fav.brand.name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">{fav.brand.name}</div>
                      <div className="text-xs text-gray-500 truncate">{fav.brand.city}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA Explorer */}
          <div className="bg-gradient-to-r from-france-blue to-blue-600 rounded-2xl shadow-sm p-8 text-white text-center">
            <h2 className="text-xl font-bold mb-2">Continuez à explorer !</h2>
            <p className="text-white/80 mb-6">
              Découvrez de nouvelles marques Made in France et gagnez des points.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/marques">
                <Button className="bg-white text-france-blue hover:bg-gray-100">
                  Explorer les marques
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/carte">
                <Button variant="outline" className="border-white/50 text-white hover:bg-white/20">
                  Voir la carte
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}