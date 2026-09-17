/** Tests des signaux de personnalisation (REBUILD.md T8.9) — la partie pure. */

import { describe, expect, test } from 'vitest';
import { aDesPreferences, ajouterRecherche, ajouterVueMarque, ajouterVueSecteur, enQuery, motsDe, resumer, vides } from './signaux';

describe('signaux', () => {
  test('les recherches : la plus recente en premier, sans doublon, dix au plus', () => {
    let s = vides();
    for (let i = 0; i < 12; i++) s = ajouterRecherche(s, `mot${i}`, i);
    s = ajouterRecherche(s, 'MOT11', 99);
    expect(s.recherches).toHaveLength(10);
    expect(s.recherches[0].q).toBe('MOT11');
    expect(s.recherches.filter((r) => r.q.toLowerCase() === 'mot11')).toHaveLength(1);
  });
  test('une recherche vide est ignoree', () => {
    expect(ajouterRecherche(vides(), '   ').recherches).toEqual([]);
  });
  test('les secteurs se comptent, les marques se datent', () => {
    let s = ajouterVueSecteur(ajouterVueSecteur(vides(), 'mode-accessoires'), 'mode-accessoires');
    s = ajouterVueSecteur(s, 'gastronomie');
    s = ajouterVueMarque(s, 'saint-james', 5); s = ajouterVueMarque(s, 'armor-lux', 9);
    expect(s.secteurs).toEqual({ 'mode-accessoires': 2, gastronomie: 1 });
    expect(Object.keys(s.marques)).toEqual(['armor-lux', 'saint-james']);
  });
  test('resumer : 3 secteurs, 5 marques, 6 mots, rien d identifiant', () => {
    let s = vides();
    for (const [k, n] of [['a', 5], ['b', 4], ['c', 3], ['d', 2]] as const) for (let i = 0; i < n; i++) s = ajouterVueSecteur(s, k);
    for (let i = 0; i < 8; i++) s = ajouterVueMarque(s, `m${i}`, i);
    s = ajouterRecherche(s, 'Pull en laine Mérinos', 1); s = ajouterRecherche(s, 'savon de Marseille bio', 2);
    const p = resumer(s);
    expect(p.secteurs).toEqual(['a', 'b', 'c']);
    expect(p.marques).toEqual(['m7', 'm6', 'm5', 'm4', 'm3']);
    expect(p.mots).toEqual(['savon', 'marseille', 'bio', 'pull', 'laine', 'merinos']);
    expect(JSON.stringify(p)).not.toMatch(/email|user|id/);
  });
  test('motsDe : sans accent, minuscules, trois lettres et plus', () => {
    expect(motsDe("L'ÉTÉ à la mer")).toEqual(['ete', 'mer']);
  });
  test('aDesPreferences et enQuery', () => {
    expect(aDesPreferences(resumer(vides()))).toBe(false);
    const p = { secteurs: ['mode-accessoires'], marques: [], mots: ['pull', 'laine'] };
    expect(aDesPreferences(p)).toBe(true);
    expect(enQuery(p)).toBe('s=mode-accessoires&q=pull%2Claine');
  });
});
