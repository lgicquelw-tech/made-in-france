import { Factory, Leaf, Heart, Users } from 'lucide-react';

const reasons = [
  {
    icon: Factory,
    title: 'Emploi local',
    description:
      'Acheter Made in France, c\'est soutenir les emplois et les savoir-faire dans nos territoires.',
  },
  {
    icon: Leaf,
    title: 'Impact écologique',
    description:
      'Des circuits courts qui réduisent l\'empreinte carbone et favorisent une production responsable.',
  },
  {
    icon: Heart,
    title: 'Qualité & Durabilité',
    description:
      'Des produits conçus pour durer, avec des normes de qualité parmi les plus exigeantes au monde.',
  },
  {
    icon: Users,
    title: 'Savoir-faire unique',
    description:
      'Des artisans et entreprises qui perpétuent des traditions et innovent avec passion.',
  },
];

export function WhyMadeInFrance() {
  return (
    <section className="py-20 bg-france-blue text-white">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">
            Pourquoi choisir le Made in France ?
          </h2>
          <p className="mt-3 text-blue-100 max-w-2xl mx-auto">
            Consommer français, c'est faire un choix engagé pour l'économie, 
            l'environnement et la qualité.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white/10 mb-4">
                <reason.icon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{reason.title}</h3>
              <p className="text-blue-100 text-sm">{reason.description}</p>
            </div>
          ))}
        </div>

        {/* French flag accent */}
        <div className="mt-12 flex justify-center">
          <div className="flex h-1 w-32 overflow-hidden rounded">
            <div className="w-1/3 bg-white/30" />
            <div className="w-1/3 bg-white" />
            <div className="w-1/3 bg-france-red" />
          </div>
        </div>
      </div>
    </section>
  );
}
