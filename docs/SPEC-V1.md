# Périmètre de la v1

> Écrit le 1er septembre 2026 (REBUILD.md, T1.1). Une page. Si une demande n'est pas
> dans « Ce qui part », elle ne part pas.

## Le pari

Un **annuaire de marques françaises** qui inspire confiance et que Google indexe.
Rien d'autre. Le catalogue produit, l'espace B2B payant et l'IA conversationnelle
viennent après — dans cet ordre, et seulement une fois la v1 en ligne.

Ce périmètre tient compte d'un fait acquis : **le catalogue produit de janvier 2026 est
perdu** (aucune sauvegarde n'a jamais existé, cf. T0.0). Le seul actif de données
survivant est `data/brands.xlsx`, 996 marques. La v1 se construit donc sur les marques,
pas sur les produits.

## Ce qui part

| # | Fonctionnalité | Critère de réussite |
|---|---|---|
| 1 | **Découverte de marques** — liste paginée, filtres secteur et région, recherche | Trouver une marque connue en moins de trois clics |
| 2 | **Fiche marque** — localisation, secteur, site officiel, labels | Rendue côté serveur, avec `generateMetadata` et JSON-LD `Organization` |
| 3 | **Carte et filtres** région / secteur | La carte charge sans bloquer le reste de la page |
| 4 | **Recherche** de marques (`pg_trgm`) | Tolère les fautes de frappe et les apostrophes |
| 5 | **Comptes et favoris** | Inscription, connexion, mise en favori, suppression de compte |
| 6 | **Revendication de fiche** — une marque demande la sienne, un humain valide, puis elle édite | Aucune édition possible sans propriété vérifiée **en base** |

## Ce qui ne part pas

| Reporté | Pourquoi |
|---|---|
| **Catalogue produit** | À reconstruire par les scrapers, et seulement les produits dont les données passent l'audit de qualité (phase 5). Un catalogue à moitié vide coûte plus de confiance qu'un catalogue absent. |
| **Paiements Stripe** | L'offre Premium repose aujourd'hui sur des analytics fabriquées au `Math.random()`. On ne facture pas un graphique aléatoire. |
| **Analytics B2B** | À reconstruire sur de vrais événements — vues, clics sortants, favoris — avant toute promesse commerciale. |
| **Campagnes sponsorisées** | Dépendent des analytics. |
| **Chat IA** | Fonctionne, mais le catalogue ne doit jamais dépendre d'un appel de modèle. Recommandation déterministe d'abord. |
| **Recherche sémantique** | `pgvector` n'est pas installé, et la qualité des données produit n'est pas évaluée. |
| **Synchronisation automatique Shopify / WooCommerce** | Import manuel maîtrisé et idempotent d'abord. |

## Les trois conditions non négociables avant la mise en ligne

1. **Aucune route API sans garde-fou d'authentification vérifié côté serveur.** Aujourd'hui les 92 routes sont ouvertes, y compris l'administration et les suppressions.
2. **Les pages publiques rendues côté serveur, avec métadonnées.** Aujourd'hui 42 pages sur 45 sont en `'use client'` et il existe un seul `generateMetadata` : pour un annuaire, le référencement *est* le produit.
3. **Une chaîne de tests qui bloque la fusion.** Aujourd'hui : zéro test, zéro CI.

## Ce que la v1 n'est pas

Ce n'est ni un SaaS B2B, ni une place de marché, ni un assistant IA. Vouloir les quatre
en même temps est précisément ce qui a fait échouer la première tentative.
