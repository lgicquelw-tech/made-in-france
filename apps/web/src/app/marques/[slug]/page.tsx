'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, ExternalLink, Globe, Instagram, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Brand {
  id: string;
  name: string;
  slug: string;
  descriptionShort: string | null;
  descriptionLong: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  websiteUrl: string | null;
  city: string | null;
  postalCode: string | null;
  address: string | null;
  region: { id: string; name: string; slug: string } | null;
  sector: { id: string; name: string; slug: string } | null;
  labels: { label: { id: string; name: string; slug: string } }[];
  socialLinks: {
    instagram?: string;
    linkedin?: string;
    facebook?: string;
  } | null;
  madeInFranceLevel: string;
}

export default function MarqueDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBrand() {
      try {
        const response = await fetch(`http://localhost:4000/api/v1/brands/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Marque non trouvée');
          } else {
            setError('Erreur lors du chargement');
          }
          return;
        }
        const data = await response.json();
        setBrand(data.data);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchBrand();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container py-12">
          <Link href="/marques" className="inline-flex items-center text-france-blue hover:underline mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux marques
          </Link>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {error || 'Marque non trouvée'}
            </h1>
            <p className="text-gray-500">
              Cette marque n'existe pas ou a été supprimée.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container py-6">
          <Link href="/marques" className="inline-flex items-center text-france-blue hover:underline mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux marques
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Logo */}
            <div className="w-32 h-32 bg-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-5xl font-bold text-france-blue">
                {brand.name.charAt(0)}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {brand.name}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                {brand.city && (
                  <span className="flex items-center gap-1 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {brand.city}
                    {brand.postalCode && ` (${brand.postalCode})`}
                  </span>
                )}
                {brand.region && (
                  <span className="bg-blue-50 text-france-blue px-3 py-1 rounded-full text-sm font-medium">
                    {brand.region.name}
                  </span>
                )}
                {brand.sector && (
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {brand.sector.name}
                  </span>
                )}
                {brand.labels && brand.labels.map((bl) => (
                  <span key={bl.label.id} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    {bl.label.name}
                  </span>
                ))}
              </div>

              {brand.descriptionShort && (
                <p className="text-gray-600 text-lg mb-4">
                  {brand.descriptionShort}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {brand.websiteUrl && (
                  <Button asChild>
                    <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      Visiter le site
                    </a>
                  </Button>
                )}
                {brand.socialLinks?.instagram && (
                  <Button variant="outline" asChild>
                    <a href={brand.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                      <Instagram className="h-4 w-4 mr-2" />
                      Instagram
                    </a>
                  </Button>
                )}
                {brand.socialLinks?.linkedin && (
                  <Button variant="outline" asChild>
                    <a href={brand.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-4 w-4 mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="md:col-span-2">
            {brand.descriptionLong ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  À propos
                </h2>
                <div className="prose text-gray-600">
                  {brand.descriptionLong}
                </div>
              </div>
            ) : brand.descriptionShort ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  À propos
                </h2>
                <div className="prose text-gray-600">
                  {brand.descriptionShort}
                </div>
              </div>
            ) : null}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Infos */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Informations</h3>
              <dl className="space-y-3 text-sm">
                {brand.city && (
                  <div>
                    <dt className="text-gray-500">Ville</dt>
                    <dd className="text-gray-900 font-medium">{brand.city}</dd>
                  </div>
                )}
                {brand.region && (
                  <div>
                    <dt className="text-gray-500">Région</dt>
                    <dd className="text-gray-900 font-medium">{brand.region.name}</dd>
                  </div>
                )}
                {brand.sector && (
                  <div>
                    <dt className="text-gray-500">Secteur</dt>
                    <dd className="text-gray-900 font-medium">{brand.sector.name}</dd>
                  </div>
                )}
                {brand.madeInFranceLevel && (
                  <div>
                    <dt className="text-gray-500">Fabrication</dt>
                    <dd className="text-gray-900 font-medium">
                      {brand.madeInFranceLevel === 'FABRICATION_100_FRANCE' && '100% France'}
                      {brand.madeInFranceLevel === 'ASSEMBLE_FRANCE' && 'Assemblé en France'}
                      {brand.madeInFranceLevel === 'CONCU_FRANCE' && 'Conçu en France'}
                      {brand.madeInFranceLevel === 'MIXTE' && 'Mixte'}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* CTA */}
            {brand.websiteUrl && (
              <div className="bg-france-blue rounded-2xl p-6 text-white">
                <h3 className="font-semibold mb-2">Découvrir {brand.name}</h3>
                <p className="text-blue-100 text-sm mb-4">
                  Visitez le site officiel pour découvrir tous leurs produits.
                </p>
                <Button variant="outline" className="w-full bg-white text-france-blue hover:bg-blue-50" asChild>
                  <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visiter le site
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
