import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, ExternalLink, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import { siteUrl } from '@/lib/site';
import { brandLogoUrl } from '@/lib/brand-logo';

/**
 * Page d'un secteur (REBUILD.md T4.3, T4.8).
 *
 * Deux défauts corrigés :
 *  - la liste des secteurs était **écrite en dur ici**, en plus du seed, du
 *    script d'import et de `sitemap.ts`. C'est exactement la divergence de
 *    taxonomie qui avait laissé 687 marques sans secteur ; elle est lue en base.
 *  - les marques venaient de l'API avec `?limit=100` : le secteur « Mode &
 *    Accessoires » en compte **263**, dont 163 n'apparaissaient jamais.
 */

export const revalidate = 3600;

async function getSector(slug: string) {
  return prisma.sector.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, color: true },
  });
}

export async function generateStaticParams() {
  const sectors = await prisma.sector.findMany({ select: { slug: true } });
  return sectors.map((sector) => ({ slug: sector.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const sector = await getSector(params.slug);
  if (!sector) return { title: 'Secteur introuvable' };

  const count = await prisma.brand.count({ where: { sectorId: sector.id } });
  const title = `${sector.name} — marques françaises`;
  const description = `${count} marque${count > 1 ? 's' : ''} française${count > 1 ? 's' : ''} du secteur ${sector.name}, fabriquant en France.`;
  const url = `${siteUrl()}/secteurs/${sector.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: `${title} | Made in France`,
      description,
      url,
      siteName: 'Made in France',
      locale: 'fr_FR',
    },
  };
}

export default async function SecteurDetailPage({ params }: { params: { slug: string } }) {
  const sector = await getSector(params.slug);
  if (!sector) notFound();

  const brands = await prisma.brand.findMany({
    where: { sectorId: sector.id },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      descriptionShort: true,
      city: true,
      websiteUrl: true,
      region: { select: { name: true } },
    },
  });

  const color = sector.color ?? '#002395';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section 
        className="text-white py-16"
        style={{ backgroundColor: color }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <Link 
            href="/secteurs" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tous les secteurs
          </Link>
          <h1 className="text-4xl font-bold mb-4">{sector.name}</h1>
          <p className="mt-4 text-white/80">
            {brands.length} marque{brands.length > 1 ? 's' : ''} dans ce secteur
          </p>
        </div>
      </section>

      {/* Liste des marques */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {brands.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucune marque trouvée dans ce secteur.</p>
            <Button asChild className="mt-4">
              <Link href="/secteurs">Voir tous les secteurs</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/marques/${brand.slug}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 group border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-2">
                <div
                  className="h-14 w-14 shrink-0 rounded-xl flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: '#f3f4f6' }}
                >
                  {brandLogoUrl(brand) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={brandLogoUrl(brand)!} alt="" className="w-8 h-8 object-contain" />
                  ) : (
                    <span className="text-xl font-bold text-gray-400">{brand.name.charAt(0)}</span>
                  )}
                </div>
                  <h2 className="text-xl font-bold text-gray-900 group-hover:text-france-blue transition-colors">
                    {brand.name}
                  </h2>
                </div>
                
                {brand.descriptionShort && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {brand.descriptionShort}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{brand.city || brand.region?.name || 'France'}</span>
                  </div>
                  
                  {brand.websiteUrl && (
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}