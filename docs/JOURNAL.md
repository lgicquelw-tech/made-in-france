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

### 2026-09-11 · T5.1 — Script d'audit `pnpm data:audit`

**But.** Remplacer « 903 marques » par un chiffre exploitable : combien de fiches sont
réellement affichables, et qu'est-ce qui bloque les autres.

**Fait.** Quatre modules courts dans `scripts/audit/` — `checks.ts` (les contrôles),
`links.ts` (vérification réseau), `report.ts` (mise en forme), `index.ts` (orchestration).
Le script est en **lecture seule** : il mesure, il ne corrige pas. Options `--liens`,
`--echantillon N`, `--simultanes N`, `--delai N`, `--json <fichier>`.

Chaque contrôle est **bloquant** (la fiche ne doit pas être publiée) ou **recommandé**
(publiable mais incomplète). C'est cette séparation qui transforme un taux en plan de
travail.

**Vérifié.** `pnpm typecheck` 7/7. `pnpm data:audit` sur les 903 marques et 2 produits.
Balayage réseau complet : 901 sites interrogés, 10 simultanés.

| Mesure | Résultat |
|---|---|
| Marques publiables | **899 / 903** |
| Produits publiables | **0 / 2** |
| Sites de marque vivants | 826 / 900 |
| Sites morts (confirmés deux fois) | **37** |
| Sites indéterminés (pare-feu anti-robot) | 37 |
| Liens d'achat vivants | **0 / 2** |
| Marques géolocalisées | **3 / 903** |
| Marques avec un visuel en propre | **0 / 903** |
| Noms de marque en double | 0 |

**Découvert — cinq choses, dont deux erreurs de ma part.**

1. **La carte est vide.** 3 marques sur 903 ont des coordonnées. `/carte` existe,
   fonctionne, et n'a presque rien à montrer. Ce n'était listé nulle part.

2. **Les deux seuls produits ont un lien d'achat mort.** `saint-james.com/pull-binic` et
   `/mariniere-guildo` répondent 404. Combinés à l'absence d'image, cela donne 0 produit
   publiable sur 2 — le catalogue est à reconstruire, pas à réparer.

3. **Erreur de conception, corrigée.** J'avais rendu « URL de site valide » *bloquante*.
   Cela écartait CHEZ GIOVANNI et MAY'SAPE : deux artisans sans site web, mais avec
   Instagram, une ville, une région, un secteur et une vraie description — exactement les
   fiches qu'un annuaire existe pour montrer. Le contrôle bloquant est devenu « un point
   de contact (site **ou** réseau social) » ; l'URL de site est passée en recommandé.
   Les publiables sont passées de 897 à 899.

4. **Un 403 n'est pas un site mort.** Sept sites répondent 403 et quatre 503 : un
   pare-feu a reconnu un robot, pas une page absente. Les confondre avec les 404 ferait
   désactiver automatiquement (T5.2) des marques vivantes. D'où un troisième verdict,
   `indetermine`, et une consigne explicite : **T5.2 ne désactive que les « morts »**.
   Les délais dépassés tombent aussi dans `indetermine` — un serveur lent n'est pas mort.

5. **Erreur d'affichage, corrigée.** Le taux était arrondi : 899 sur 903 s'affichait
   « 100 % » alors qu'il manquait quatre fiches. L'arrondi se fait désormais vers le bas
   sauf compte exact — le manque doit rester visible au moment précis où il compte.

**Les 4 marques bloquées sont des décisions, pas des bugs.** Trois attendent un
arbitrage de région (NANNETTA / Monaco, RECYCLED BY LISA / « France », WIA /
« Occitanie / Normandie ») ; OBSTINNÉE a une description de 39 caractères.

**Reste à traiter, consigné :** un seul passage ne suffit pas à condamner un lien pour
T5.2 — un site peut être indisponible une journée. Il faudra N échecs consécutifs sur
plusieurs jours, pas un verdict unique.

**Commit.** `4c96d94`
