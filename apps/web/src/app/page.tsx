import { Suspense } from 'react';
import { HeroSection } from '@/components/home/hero-section';
import { InspirationSection } from '@/components/home/inspiration-section';
import { FeaturedBrands } from '@/components/home/featured-brands';
import { MapPreview } from '@/components/home/map-preview';
import { SectorsSection } from '@/components/home/sectors-section';
import { WhyMadeInFrance } from '@/components/home/why-made-in-france';

export default function HomePage() {
  return (
    <>
      {/* Hero Section with Search */}
      <HeroSection />

      {/* Inspiration Blocks */}
      <InspirationSection />

      {/* Featured Brands */}
      <Suspense fallback={<FeaturedBrandsSkeleton />}>
        <FeaturedBrands />
      </Suspense>

      {/* Map Preview */}
      <MapPreview />

      {/* Browse by Sector */}
      <SectorsSection />

      {/* Why Made in France */}
      <WhyMadeInFrance />
    </>
  );
}

function FeaturedBrandsSkeleton() {
  return (
    <section className="py-16">
      <div className="container">
        <div className="h-8 w-64 skeleton mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 skeleton rounded-lg" />
          ))}
        </div>
      </div>
    </section>
  );
}
