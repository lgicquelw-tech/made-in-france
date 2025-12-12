import Link from 'next/link';

const footerLinks = {
  decouvrir: {
    title: 'Découvrir',
    links: [
      { name: 'Toutes les marques', href: '/marques' },
      { name: 'Carte interactive', href: '/carte' },
      { name: 'Par secteur', href: '/secteurs' },
      { name: 'Par région', href: '/regions' },
      { name: 'Labels & Certifications', href: '/labels' },
    ],
  },
  marques: {
    title: 'Pour les marques',
    links: [
      { name: 'Référencer ma marque', href: '/espace-marque' },
      { name: 'Nos offres', href: '/offres' },
      { name: 'Connexion marque', href: '/espace-marque/connexion' },
    ],
  },
  apropos: {
    title: 'À propos',
    links: [
      { name: 'Notre mission', href: '/a-propos' },
      { name: 'Contact', href: '/contact' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Blog', href: '/blog' },
    ],
  },
  legal: {
    title: 'Légal',
    links: [
      { name: 'Mentions légales', href: '/mentions-legales' },
      { name: 'CGU', href: '/cgu' },
      { name: 'Politique de confidentialité', href: '/confidentialite' },
      { name: 'Cookies', href: '/cookies' },
    ],
  },
};

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container py-12 md:py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-france-blue">
                <span className="text-xl font-bold text-white">M</span>
              </div>
              <span className="font-semibold">Made in France</span>
            </Link>
            <p className="mt-4 text-sm text-gray-600">
              La plateforme de découverte des marques et produits fabriqués en France.
            </p>
            {/* French flag decoration */}
            <div className="mt-4 flex h-1 w-24 overflow-hidden rounded">
              <div className="w-1/3 bg-france-blue" />
              <div className="w-1/3 bg-white" />
              <div className="w-1/3 bg-france-red" />
            </div>
          </div>

          {/* Link columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-900">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-france-blue"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Made in France. Tous droits réservés.
            </p>
            <p className="text-sm text-gray-500">
              Créé avec 💙 par{' '}
              <a
                href="https://leptitstudio.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-france-blue hover:underline"
              >
                Le P'tit Studio
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
