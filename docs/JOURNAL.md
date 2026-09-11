# Journal de reconstruction

> Trace **étape par étape** de ce qui est fait, pourquoi, et ce que ça a donné.
>
> Ce fichier est le récit détaillé. Les deux autres ont un rôle différent :
>
> | Fichier | Rôle | Granularité |
> |---|---|---|
> | `REBUILD.md` | Le **plan** : cases à cocher, décisions ouvertes, journal de synthèse | une ligne par session |
> | `docs/JOURNAL.md` | Le **récit** : chaque étape, sa vérification, son résultat | une entrée par étape |
> | `git log` | La **preuve** : le diff exact | un commit par tâche |
>
> Règle de tenue : une entrée est écrite **quand l'étape est faite et vérifiée**, jamais
> par anticipation. Une étape qui échoue reste dans le journal avec son échec — c'est
> précisément ce qui manquait au projet de janvier 2026.

---

## Format d'une entrée

```
### AAAA-MM-JJ · Tn.m — Titre
**But.** Ce qu'on cherche à obtenir, en une phrase.
**Fait.** Les modifications réelles.
**Vérifié.** La commande lancée et son résultat chiffré.
**Découvert.** Ce que l'étape a appris et qui n'était pas prévu. (facultatif)
**Commit.** `hash`
```

---

## Phases 0 à 4 — 1er au 11 septembre 2026

Ces phases sont antérieures à la création de ce fichier. Leur récit détaillé est réparti
entre les **51 commits** de `7878ad4..HEAD` (messages longs, une tâche par commit) et les
sections « découvertes » de `REBUILD.md`. Résumé :

| Phase | Objet | État |
|---|---|---|
| 0 | Sécuriser et geler : secrets retirés du dépôt, base recherchée (absente) | 8/8 |
| 1 | Un seul chemin par fonctionnalité : doublons B2B supprimés, documentation refaite | 6/6 |
| 2 | Base reproductible : `pnpm bootstrap`, seed idempotent, 903 marques importées | 10/10 |
| 3 | Backend et autorisation : Express vidé de 92 → 28 routes, gardes serveur | 20/24 |
| 4 | Frontend public et référencement : rendu serveur, métadonnées, JSON-LD, 942 URL | 11/13 |

**Les sept constats critiques de l'audit sont fermés**, plus un huitième non listé :
`POST /api/auth/claim-brand` accordait le rôle `OWNER` depuis le corps de la requête,
sans aucune authentification — il contournait toutes les gardes construites au-dessus.

---

## Phase 5 — Qualité des données

