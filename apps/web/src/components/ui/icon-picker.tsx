'use client';

import { useState } from 'react';
import {
  BookOpen,
  Award,
  Heart,
  Star,
  Sparkles,
  Leaf,
  Factory,
  Users,
  Target,
  Lightbulb,
  Shield,
  Gem,
  Crown,
  Flame,
  Zap,
  Globe,
  MapPin,
  Clock,
  Calendar,
  Gift,
  Package,
  Truck,
  Recycle,
  TreePine,
  Sun,
  Mountain,
  Waves,
  Hammer,
  Wrench,
  Scissors,
  Palette,
  Camera,
  Music,
  Coffee,
  Wine,
  UtensilsCrossed,
  Shirt,
  Watch,
  Home,
  Building,
  Store,
  X
} from 'lucide-react';

export const AVAILABLE_ICONS = {
  BookOpen: { icon: BookOpen, label: 'Livre' },
  Award: { icon: Award, label: 'Récompense' },
  Heart: { icon: Heart, label: 'Cœur' },
  Star: { icon: Star, label: 'Étoile' },
  Sparkles: { icon: Sparkles, label: 'Étincelles' },
  Leaf: { icon: Leaf, label: 'Feuille' },
  Factory: { icon: Factory, label: 'Usine' },
  Users: { icon: Users, label: 'Équipe' },
  Target: { icon: Target, label: 'Cible' },
  Lightbulb: { icon: Lightbulb, label: 'Idée' },
  Shield: { icon: Shield, label: 'Bouclier' },
  Gem: { icon: Gem, label: 'Gemme' },
  Crown: { icon: Crown, label: 'Couronne' },
  Flame: { icon: Flame, label: 'Flamme' },
  Zap: { icon: Zap, label: 'Éclair' },
  Globe: { icon: Globe, label: 'Globe' },
  MapPin: { icon: MapPin, label: 'Localisation' },
  Clock: { icon: Clock, label: 'Horloge' },
  Calendar: { icon: Calendar, label: 'Calendrier' },
  Gift: { icon: Gift, label: 'Cadeau' },
  Package: { icon: Package, label: 'Colis' },
  Truck: { icon: Truck, label: 'Livraison' },
  Recycle: { icon: Recycle, label: 'Recyclage' },
  TreePine: { icon: TreePine, label: 'Sapin' },
  Sun: { icon: Sun, label: 'Soleil' },
  Mountain: { icon: Mountain, label: 'Montagne' },
  Waves: { icon: Waves, label: 'Vagues' },
  Hammer: { icon: Hammer, label: 'Marteau' },
  Wrench: { icon: Wrench, label: 'Clé' },
  Scissors: { icon: Scissors, label: 'Ciseaux' },
  Palette: { icon: Palette, label: 'Palette' },
  Camera: { icon: Camera, label: 'Caméra' },
  Music: { icon: Music, label: 'Musique' },
  Coffee: { icon: Coffee, label: 'Café' },
  Wine: { icon: Wine, label: 'Vin' },
  UtensilsCrossed: { icon: UtensilsCrossed, label: 'Restaurant' },
  Shirt: { icon: Shirt, label: 'Vêtement' },
  Watch: { icon: Watch, label: 'Montre' },
  Home: { icon: Home, label: 'Maison' },
  Building: { icon: Building, label: 'Bâtiment' },
  Store: { icon: Store, label: 'Boutique' },
};

export type IconName = keyof typeof AVAILABLE_ICONS;

interface IconPickerProps {
  value: IconName;
  onChange: (icon: IconName) => void;
  color?: string;
}

export function IconPicker({ value, onChange, color = '#002395' }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const SelectedIcon = AVAILABLE_ICONS[value]?.icon || BookOpen;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-300 hover:border-france-blue flex items-center justify-center transition-colors"
        style={{ borderColor: isOpen ? color : undefined }}
      >
        <SelectedIcon className="w-6 h-6" style={{ color }} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-14 left-0 z-50 bg-white rounded-xl shadow-xl border p-4 w-80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Choisir une icône</span>
              <button onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
              {Object.entries(AVAILABLE_ICONS).map(([key, { icon: Icon, label }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onChange(key as IconName);
                    setIsOpen(false);
                  }}
                  className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                    value === key ? 'bg-france-blue/10 ring-2 ring-france-blue' : ''
                  }`}
                  title={label}
                >
                  <Icon className="w-5 h-5" style={{ color: value === key ? color : '#6b7280' }} />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function getIconComponent(iconName: IconName) {
  return AVAILABLE_ICONS[iconName]?.icon || BookOpen;
}
