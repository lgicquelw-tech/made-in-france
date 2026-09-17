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
**Commit.** `sujet du commit`
```

> **Le sujet, pas le hash.** Un `git commit --amend` change le hash : l'entree pointerait
> alors vers un commit qui n'existe plus. C'est arrive des la premiere entree. Le sujet,
> lui, survit — et `git log --grep` le retrouve.

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

**Commit.** `phase 5 (1/n): audit de qualite des donnees (T5.1)`

### 2026-09-11 · T5.2 — Vérificateur de liens et désactivation automatique

**But.** Cesser d'afficher les liens qui ne répondent plus. Un lien mort coûte plus de
confiance qu'un lien absent : l'utilisateur a cliqué, il attendait une boutique, il
obtient une erreur — et personne côté projet ne le sait tant qu'il ne le signale pas.

**Fait.**

- Migration **additive** `20260911090738_sante_des_liens` : table `link_checks` (un état
  par URL) et deux colonnes nullables, `brands.website_dead_at` et
  `products.buy_url_dead_at`. Vérifié : 0 instruction destructive dans le SQL généré.
- `scripts/links/policy.ts` — la règle de décision, **module pur** : ni base, ni réseau,
  ni horloge implicite. Tout entre par les paramètres.
- `scripts/links/policy.test.ts` — 10 tests.
- `scripts/links/run.ts` — la commande `pnpm data:links`, avec `--simuler`, `--usage`,
  `--echantillon`, `--simultanes`, `--delai`.
- Front : le bouton « Visiter le site » (deux endroits), le bouton d'achat, et l'offre
  JSON-LD ne s'affichent plus si le lien est mort.

**La règle, et pourquoi elle est prudente.** Désactiver retire du contenu ; se tromper
coûte donc plus cher que ne rien faire. Il faut **deux** conditions cumulées : 3 échecs
consécutifs, **et** un premier échec vieux d'au moins 72 h.

La seconde est la plus importante. Sans elle, relancer la commande trois fois pendant une
panne d'hébergeur viderait l'annuaire. Un test couvre exactement ce scénario.

**Et l'URL n'est jamais effacée.** On pose une date, l'affichage cesse, la donnée reste.
Un lien qui répond de nouveau est réactivé tout seul au passage suivant.

**Vérifié.**

| Contrôle | Résultat |
|---|---|
| `pnpm test:links` | **10 / 10** |
| `pnpm typecheck` | 7 / 7 |
| `pnpm build` | code 0, 991 pages |
| Migration destructive ? | 0 instruction `DROP` / `DELETE` / `RENAME` |
| Premier passage réel | 902 URL enregistrées, **0 désactivée** |
| Marques en base après | **903** (inchangé) |

Le premier passage ne désactive rien : c'est le comportement attendu, une première
observation ne prouve rien.

Les deux chemins que les tests unitaires ne couvrent pas — l'écriture en base — ont été
vérifiés sur la vraie base, avec une **histoire simulée** (2 échecs, le premier il y a
4 jours), faute de pouvoir attendre 72 h :

- désactivation : le produit reçoit `buyUrlDeadAt`, et `externalBuyUrl` est **conservée** ;
- réactivation : un site vivant déclaré mort à tort est remis en ligne seul au passage
  suivant.

**L'état vrai a ensuite été rétabli** : 0 URL désactivée, 0 marque marquée morte, premier
échec du lien Saint James daté de sa première observation réelle. La base ne garde aucune
trace de l'histoire fabriquée pour le test.

**Découvert.**

1. **Le délai d'attente change le verdict.** Même parc de sites : 826 vivants à 10 s,
   **845 à 15 s**. Dix-neuf sites étaient simplement lents. C'est la raison d'être du
   verdict `indetermine` pour les délais dépassés — les compter comme morts aurait
   désactivé dix-neuf marques vivantes.
2. La forme fragile `new URL(brand.websiteUrl).hostname`, écrite sur place, était encore
   dans `brand-detail.tsx` : elle **lève** sur une URL invalide et emporte toute la page.
   Remplacée par `brandLogoUrl()`. Il reste 12 fichiers à reprendre.

**Reste à traiter, consigné :** la désactivation effective demandera trois passages
espacés sur plus de 72 h. Aucun n'est planifié — il n'y a pas d'ordonnanceur sur ce
projet. À rattacher au déploiement (phase 7).

**Commit.** `phase 5 (2/n): verificateur de liens morts (T5.2)`

### 2026-09-11 · T5.3 — Filtre de bruit et dédoublonnage

**But.** Empêcher les cartes cadeaux, échantillons, frais de port et produits de test
d'entrer dans le catalogue, et écarter les doublons de nom au sein d'une marque.

**Fait.** `scripts/catalogue/noise.ts`, module pur : `detecterBruit()` renvoie `null`
ou la **raison** du rejet (un filtre muet est un filtre qu'on ne peut pas corriger) ;
`dedoublonner()` garde le premier et rattache les suivants. 13 tests dans
`noise.test.ts` — dont une famille « à garder », qui compte plus que l'autre : un
filtre trop large rend des produits invisibles sans que personne ne s'en aperçoive.
Branché dans `pnpm data:audit`, qui annonce désormais ce qu'il écarterait.

**Principe :** en cas de doute, on garde. « Coffret cadeau », « Miniature eau de
parfum », « Testeur de pH » sont des produits. Les motifs sont étroits et testés dans
les deux sens.

**Vérifié.** `pnpm test:catalogue` **13 / 13**, `pnpm typecheck` 7 / 7. Sur les 2
produits actuels : 0 bruit, 0 doublon — le filtre attend le catalogue.

**Découvert.**

1. **`\b` en JavaScript ne connaît que l'ASCII.** Devant « É », il ne voit aucune
   frontière de mot : « Échantillon crème mains » passait, « Echantillon 5 ml » était
   rejeté. Trouvé par le test, pas par relecture. Correction : désaccentuer le texte
   avant de comparer, et écrire les motifs sans accent.
2. **`import-all-shopify.ts` duplique `shopify-scraper.ts`** — mêmes `cleanHtml`,
   `fetchShopifyProducts`, même écriture — avec une liste de 181 marques en dur. Trois
   copies de `cleanHtml` dans `scripts/`. À fusionner en T5.5, pas maintenant.
3. **Le chemin d'écriture des scrapers écrase tout** : `update({ data: productData })`
   réécrit `descriptionLong`. Un enrichissement payé en appels de modèle serait effacé au
   passage suivant. C'est exactement le défaut que T5.5 décrit ; il est confirmé dans le
   code.

**Ce que T5.3 ne fait pas encore :** le filtre n'est pas appelé par les scrapers. Il le
sera quand T5.5 réécrira leur chemin d'écriture — c'est là qu'il doit vivre, et il n'y a
pas de sens à le brancher deux fois dans trois fichiers qui vont fusionner.

**Reste à traiter, consigné :** `scripts/audit/index.ts` est à 298 lignes. Toute
addition devra d'abord le scinder (règle 7).

**Commit.** `phase 5 (3/n): filtre de bruit et dedoublonnage (T5.3)`

### 2026-09-11 · T5.5 + T5.6 — Import idempotent et provenance

**But.** Qu'un scraping relancé N fois donne le même résultat qu'une fois, sans jamais
détruire un travail éditorial ; et que chaque produit dise d'où il vient et de quand.

**Fait.**

- Migration additive `20260911100500_provenance_produit` : colonne
  `products.collected_at` et clé unique `(brand_id, external_source, external_id)`.
  **Écrite à la main** — `prisma migrate dev` exige une confirmation interactive pour
  toute contrainte unique sur une table existante, et refuse sans terminal. Vérifiée
  par `prisma migrate diff` : **écart vide** entre la base et le schéma.
- `scripts/catalogue/merge.ts` — la règle de fusion, pure : deux listes, ce que la
  boutique connaît mieux que nous (prix, images, lien, données brutes) et tout le reste,
  posé une fois et jamais réécrit. 4 tests, dont le scénario complet
  *création → enrichissement → rescrape*.
- `scripts/catalogue/upsert.ts` — **le seul point d'écriture** d'un produit scrappé.
  Filtre le bruit (T5.3), dédoublonne, retrouve par clé stable, applique la règle, pose
  la date. Un produit collecté naît en `DRAFT` : c'est l'audit qui publie (T5.8), pas le
  seul fait d'avoir été scrappé.
- `scripts/catalogue/html.ts` — `texteDepuisHtml`, qui remplace **trois copies**
  identiques de `cleanHtml`.
- Les deux scrapers ne touchent plus `prisma.product`. `import-all-shopify.ts` est
  supprimé : il dupliquait `shopify-scraper.ts` avec une liste de 181 marques figée ;
  `--all` refait la détection à chaque passage sur les marques réellement en base.

**Vérifié.**

| Contrôle | Résultat |
|---|---|
| `pnpm test:scripts` | **27 / 27** |
| `pnpm typecheck` | 7 / 7 |
| `prisma migrate diff` base ↔ schéma | vide |
| Copies de `cleanHtml` dans `scripts/` | 3 → **0** |
| Accès directs à `prisma.product` dans les scrapers | **0** |

**Preuve d'idempotence, sur une vraie boutique** (`www.airpurlabs.com`, 10 produits) :

| Étape | Résultat |
|---|---|
| Passage 1 | 10 créés, 0 mis à jour |
| Entre les deux : `descriptionLong` remplacée à la main, statut passé à `ACTIVE` sur une fiche | — |
| Passage 2 | **0 créé, 10 mis à jour** |
| Produits en base après | **10** (pas 20) |
| Texte éditorial | **intact** |
| Statut `ACTIVE` | **intact** |
| `collectedAt` | avancé |
| Liens d'achat | **10 / 10**, HTTP 200 |

Le texte de test a ensuite été retiré (suppression des 10 fiches, passage propre). Les
10 produits Airpur Labs restent en base, en `DRAFT`, avec leur provenance — ce sont de
vraies fiches d'une vraie marque de l'annuaire, et T5.8 aura besoin de matière.

**Découvert.**

1. **Le scraper Shopify ne renseignait jamais le lien d'achat.** WooCommerce le prend
   dans `permalink` ; Shopify n'avait que la poignée, rangée dans `externalData`. Tout
   produit Shopify arrivait donc sans bouton d'achat. Le lien est désormais construit,
   avec le nom d'hôte **tel que la marque le déclare** (`www.` compris) — un lien
   canonique vaut mieux qu'un lien qui redirige.
2. **`--all` WooCommerce ne traitait que les marques sans aucun produit**
   (`products: { none: {} }`). Une relance ne mettait donc jamais rien à jour — l'exact
   inverse de l'idempotence. Filtre retiré.
3. **Les erreurs de `--all` étaient avalées** (`// Skip silently`). Elles sont affichées.
4. Le heredoc de cet environnement convertit `\uXXXX` en caractère réel, même quoté.
   Deux caractères combinants invisibles se sont retrouvés dans une regex ; corrigé par
   construction explicite de l'échappement. Sans conséquence fonctionnelle, mais
   illisible — noté pour ne pas le rechercher deux fois.

**Compromis assumé et signalé :** le **nom** est un champ collecté — c'est la boutique
qui nomme son produit. Un renommage éditorial serait donc écrasé au rescrape. Choix
documenté dans `merge.ts`, à revoir si le besoin apparaît.

**Ce que T5.5 ne fait pas :** détecter un produit **disparu** de la boutique. Un
produit retiré du catalogue marchand reste en base tel qu'il était. À traiter avec la
planification des passages (phase 7).

**Commit.** `phase 5 (4/n): import idempotent et provenance (T5.5, T5.6)`

### 2026-09-11 · T5.8 — Publication au seuil de complétude

**But.** Que le statut `ACTIVE` d'un produit découle de l'audit, et non du seul fait
d'avoir été scrappé ou saisi.

**Fait.** `scripts/publish/policy.ts`, règle pure : `DRAFT` complet → `ACTIVE` ;
`ACTIVE` incomplet → `DRAFT` ; `OUT_OF_STOCK` et `DISCONTINUED` jamais touchés — ce sont
des décisions, pas des mesures. Elle importe **les mêmes contrôles** que `pnpm data:audit` :
l'audit mesure, la règle décide, `pnpm data:publish` applique, un seul critère. 7 tests.
Le contrôle « lien d'achat » tient désormais compte de `buyUrlDeadAt` : T5.2 pose la
date, T5.8 en tire la conséquence.

**Vérifié.**

| Contrôle | Résultat |
|---|---|
| `pnpm test:scripts` | **34 / 34** |
| `pnpm typecheck` | 7 / 7 |
| Pages publiques filtrant sur `ACTIVE` | 7 / 7 requêtes |
| Passage 1 | 10 publiés, 2 retirés |
| Passage 2 | **0 / 0 / 12 inchangés** — idempotent |
| Audit ↔ base | 10 publiables, 10 `ACTIVE` |
| `/produits` dans l'aperçu | 10 produits, images via `/_next/image` (14 requêtes, 200) |
| Fiche produit | JSON-LD `Product` avec offre 109 € et lien vivant |
| Fiche retirée (`saint-james-pull-binic`) | HTTP 404 |

**Ce qui a changé sur le site.** Les 2 seuls produits publics — Saint James, sans image
et en 404 — sont retirés. Les 10 produits Airpur Labs, complets, sont publiés. Pour la
première fois depuis la reconstruction, `next/image` a quelque chose à optimiser.

**Ce que T5.8 ne fait pas, à dessein :** les marques. 902 sur 903 sont en
`PENDING_REVIEW` et servies publiquement quand même. Les publier, ou cesser de les
servir, est une **décision éditoriale** — pas une mesure de complétude — et elle reste
en attente d'arbitrage (voir `REBUILD.md`).

**À part :** `.claude/launch.json` contenait un chemin absolu propre à cette machine
(fnm ne met pas `pnpm` sur le PATH de l'aperçu). Retiré de git, ajouté à `.gitignore`.

**Commit.** `phase 5 (5/n): publication au seuil de completude (T5.8)`

### 2026-09-11 · T5.4 — Contrôles sur les marques : géolocalisation et URL

**But.** Remplir la carte (3 marques placées sur 903) et retirer les paramètres de
suivi des URL de site. Les autres contrôles de T5.4 — URL valide, secteur et région
reconnus, doublons — sont déjà mesurés par `pnpm data:audit` (T5.1).

**Fait.**

- `scripts/brands/choix-commune.ts`, module pur : parmi les résultats de l'API Adresse
  nationale, garde celui **dont le contexte contient la région de la marque**. Le
  problème résolu : les homonymes. « Saint-Denis » existe à La Réunion, en
  Seine-Saint-Denis, dans l'Aude, le Gard et le Loiret, tous avec un score voisin. Sans
  correspondance de région, **on ne devine pas**. 9 tests.
- `scripts/brands/geocode.ts` — `pnpm data:geocode`. Ne réécrit jamais des coordonnées
  existantes sans `--forcer`. Repli sur la première partie avant `/` ou `(` quand la
  colonne contient deux lieux (« Paris / Vincennes »).
- `scripts/brands/urls.ts` — `retirerParametresDeSuivi`, 6 tests, branché dans
  `cleanUrl` de l'import.
- **L'import ne réécrit plus le statut** d'une marque existante. `brandData.status`
  valait `PENDING_REVIEW` pour toute ligne : chaque `pnpm bootstrap` remettait en
  attente toute marque validée. Même défaut que les scrapers avant T5.5, côté marques.
- `geocode-api.cjs` (premier résultat, sans score ni type) et `geocode-brands.cjs`
  (546 lignes de coordonnées en dur) supprimés.

**Vérifié.**

| Contrôle | Résultat |
|---|---|
| `pnpm test:scripts` | **49 / 49** |
| `pnpm typecheck` | 7 / 7 |
| Marques géolocalisées | 3 → **868 / 903** (96 %) |
| `/carte` dans l'aperçu | « 868 marques affichées », points sur toute la métropole |
| `pnpm db:import` relancé | 903 mises à jour, statut `ACTIVE` intact, 868 coordonnées intactes |
| URL avec `utm_` / `fbclid` | 1 → **0** |

**Précision à connaître :** les coordonnées sont **le centre de la commune**, pas
l'adresse — la base n'a qu'une ville pour 902 marques sur 903. Suffisant pour une carte
de France ; à savoir avant de zoomer sur un quartier.

**Les 35 marques non placées sont des défauts de la source, pas du géocodage.** La
colonne `city` de `data/brands.xlsx` y contient une région, un département, une
commune fusionnée, un hameau, ou rien. Plus d'heuristique ne les résoudra pas ; c'est
une correction à faire dans le fichier, ligne par ligne :

| Marque | Colonne `city` | Région |
|---|---|---|
| 1+3 | `France` | Occitanie |
| ALOHÉ | `Martinique` | Martinique |
| AMEWAT | `Guyane` | Guyane |
| ANCRÉE | `Île-de-France` | Île-de-France |
| CAMADOUE | `Raphèle-lès-Arles` | Provence-Alpes-Côte d'Azur |
| CAPS ME | `Île-de-France` | Île-de-France |
| CHOCOLATERIE DE PUYRICARD | `Puyricard / Aix` | Provence-Alpes-Côte d'Azur |
| DE CLERMONT | `Clermont-Clermont` | Auvergne-Rhône-Alpes |
| ÉBÉNISTERIE VUILLEMIN | `Franche-Comté` | Bourgogne-Franche-Comté |
| EUGÉNIE DE JAHAM | `Martinique / Paris` | Île-de-France |
| FLANM & SAVEURS | `Guadeloupe` | Guadeloupe |
| FRANCE FOULARDS | `Comelles` | Auvergne-Rhône-Alpes |
| GROIX ET NATURE | `Île de Groix` | Bretagne |
| HELIX ATELIER | `France` | Hauts-de-France |
| HUGO | `Bourré` | Centre-Val de Loire |
| KADALYS | `Martinique` | Martinique |
| LA MADELEINE BASQUE D'IBAN | `Pays Basque` | Nouvelle-Aquitaine |
| LA ROSE TRÉMIÈRE | `Île de Ré` | Nouvelle-Aquitaine |
| LE SAC DU BERGER | `Laysoleil` | Occitanie |
| LES CONFITURES DU CLOCHER | `Arèches-Beaufort` | Auvergne-Rhône-Alpes |
| LILIBELLULE | `Alsace` | Grand Est |
| MARCUS SPURWAY | `Gasse` | Provence-Alpes-Côte d'Azur |
| MAROQUINIÈRE CRÉATIVE | `France` | Nouvelle-Aquitaine |
| MEUBLES AUGER | `Charente-Maritime` | Nouvelle-Aquitaine |
| MONTLIMART | `Saint-Pierre-Montlimart` | Pays de la Loire |
| NANNETTA | `Monaco` | — |
| ‘ŌTEO TAHITI | `Tahiti` | Polynésie française |
| POM’ POM’ | `Manche` | Normandie |
| RECYCLED BY LISA | `(Boutique en ligne)` | — |
| SESSILE | `Montjean-sur-Loire` | Pays de la Loire |
| SÈVE & COPEAUX | `Jura` | Bourgogne-Franche-Comté |
| TEARDROP LA BOURIQUETTE | `Saint-Germain-de-Marencennes` | Nouvelle-Aquitaine |
| TERRE DE ROSE DISTILLERIE | `Doué-la-Fontaine` | Pays de la Loire |
| VELOURS DE L’ABBAYE | `Hauts-de-France` | Hauts-de-France |
| WIA | `—` | — |

**Commit.** `phase 5 (6/n): geolocalisation et controles sur les marques (T5.4)`

### 2026-09-11 · T5.7 — Enrichissement IA sur les champs manquants (préparé, non lancé)

**But.** Compléter les fiches produit — mots-clés, matières, arguments, titre et
description pour les moteurs — **sans jamais réécrire un champ existant**, et sans
dépenser un centime avant un feu vert explicite.

**Fait.**

- `scripts/enrich/champs.ts`, pur : `champsManquants` dit ce qui est vide,
  `appliquerEnrichissement` ne remplit **que** ça. Si le modèle propose une valeur pour
  un champ déjà rempli, elle est ignorée. Même discipline que la fusion des scrapers
  (T5.5). 7 tests.
- `scripts/enrich/requete.ts`, pur : le message système (stable, donc mis en cache) et le
  message utilisateur (le produit tel qu'on le connaît, et la liste des champs demandés).
  Consigne centrale : **ne rien inventer** — une matière absente du texte est une matière
  inventée, la liste reste vide. Schéma de réponse en zod, sortie structurée. 6 tests.
- `scripts/enrich/run.ts` — `pnpm data:enrich`. **Sans `--appliquer`, rien n'est envoyé** :
  la simulation liste les produits, les champs manquants, et une estimation du coût. Le
  client n'est même pas construit avant `--appliquer`. Provenance tracée dans
  `attributes.enrichissement` (modèle, date, champs).
- SDK `@anthropic-ai/sdk` **0.71.2 → 0.125.0** (racine, api, scripts) : l'ancienne version
  n'avait ni sorties structurées ni les identifiants de modèle courants. Le chat
  d'`index.ts` compile toujours. `zod` 4 ajouté au paquet scripts (l'aide du SDK l'exige).
- `enrich-all-products.ts` supprimé : il appelait **OpenAI `gpt-4o-mini`** avec une clé
  `OPENAI_API_KEY` que le projet ne déclare nulle part comme stack, et réécrivait tags,
  matières et arguments en bloc.

**Vérifié.**

| Contrôle | Résultat |
|---|---|
| `pnpm test:scripts` | **62 / 62** |
| `pnpm typecheck` (SDK mis à jour) | 7 / 7 |
| Simulation, 10 produits `ACTIVE` | 5 champs manquants chacun |
| Coût estimé, `claude-opus-5` | ~0,10 $ |
| Coût estimé, `claude-haiku-4-5` | ~0,02 $ |
| Appels réseau pendant la simulation | **0** |

**Non fait, à dessein : aucun appel réel.** La clé Anthropic du `.env` fait partie des
rotations en attente (T0.7). Lancer `pnpm data:enrich --appliquer` est une dépense et une
décision : quelle clé, quel modèle, quel périmètre. Elle appartient au propriétaire du
projet.

**Compromis signalé :** `--modele` vaut `claude-opus-5` par défaut. Pour du remplissage de
métadonnées en volume, `claude-haiku-4-5` coûte cinq fois moins ; la qualité sur
« ne rien inventer » reste à comparer sur un échantillon avant de généraliser.

**Commit.** `phase 5 (7/n): enrichissement IA prepare, sans appel (T5.7 partiel)`

---

## Phase 6 — Tests et intégration continue

### 2026-09-16 · T6.1 — Vitest

**But.** Un lanceur de tests unique pour tout le monorepo, branché sur `pnpm test`.

**Fait.** Vitest 5 à la racine, dans `apps/web` et dans `scripts`, avec une config par
paquet (`vitest.config.ts` ; alias `@/` → `src` côté web). `pnpm test` passe par Turbo ;
la tâche `test` ne dépend plus d'aucun `build` — les tests unitaires lisent les sources.
Les **62 tests de la phase 5** sont passés à Vitest en changeant **une ligne par fichier**
(`import { test } from 'node:test'` → `'vitest'`) : leurs assertions viennent de
`node:assert/strict`, que Vitest exécute telles quelles. C'était le but du choix de
septembre — ne pas préempter le framework, sans rien avoir à réécrire.

**Vérifié.** `pnpm test` : scripts **62 / 62**, web 24 / 24 (voir T6.2). `pnpm typecheck` 7 / 7.

**Découvert.** `apps/web` n'a **aucune configuration ESLint** : `pnpm lint` ouvre un
assistant interactif au lieu de linter. Il n'a jamais tourné. À régler en T6.6, où le
lint doit passer en CI.

**Commit.** `phase 6 (1/n): Vitest, et les gardes d'autorisation testees (T6.1, T6.2 partiel)`

### 2026-09-16 · T6.2 (partiel) — Gardes d'autorisation et enveloppe de réponse

**But.** Tester ce dont la casse silencieuse coûte le plus cher : une garde qui laisse
passer ne lève aucune erreur, elle laisse passer.

**Fait.** `apps/web/src/lib/guards.test.ts` (18 tests) et `api-response.test.ts` (6).
Session et base simulées : on teste la logique de la garde, pas NextAuth ni Prisma.
Ce qui est vérifié, c'est le **refus** : USER → 403 sur `requireAdmin`, ADMIN → 403 sur
`requireSuperAdmin`, compte désactivé → 401 malgré une session valide, `VIEWER` → 403,
invitation non acceptée → 403, lien désactivé → 403, marque inconnue → 404, non connecté
→ 401 **sans même chercher la marque**. Et le test décisif : la session prétend
`SUPER_ADMIN`, la base dit `USER`, **la base gagne**.

Côté enveloppe : une exception interne contenant un mot de passe de connexion produit
une 500 dont le corps ne contient **pas** ce mot de passe.

**Vérifié — par mutation, pas seulement par exécution.** Trois gardes cassées à la main,
une à la fois, chacune attrapée par exactement le test prévu :

| Mutation | Test qui casse |
|---|---|
| `requireAdmin` laisse passer `USER` | « USER : 403 », « le rôle vient de la base » |
| `VIEWER` peut écrire | « VIEWER : 403 » |
| compte désactivé accepté | « compte désactivé : 401 » |

`guards.ts` restauré à l'identique (`git diff` vide).

**Commit.** `phase 6 (1/n): Vitest, et les gardes d'autorisation testees (T6.1, T6.2 partiel)`

### 2026-09-16 · T6.2 (fin) — Recherche et logique d'import

**But.** Deux extractions pour rendre testable sans base ni import réel, puis les tests.

**Fait.**

- **Recherche.** La construction des requêtes `Prisma.sql` sort de `recherche/page.tsx`
  (113 → 53 lignes) vers `lib/search.ts` : `construireRequetes(query)` renvoie les deux
  objets `Prisma.Sql`, `rechercher()` les exécute. Le test décisif est celui du
  **constat n°4** (injection SQL par la recherche) : avec la saisie
  `l'apostrophe'; DROP TABLE brands; --`, le texte SQL ne contient ni `DROP` ni
  l'apostrophe, et la saisie se trouve dans `values`. 8 tests.
- **Import.** `slugify`, `cleanUrl`, `normalizeColumnName` et `lireNom` sortent de
  `import-brands.ts` (722 → 675 lignes, qui lance `main()` à l'import et ne pouvait donc
  pas être importé par un test) vers `scripts/import/normalisation.ts`. 13 tests, chacun
  lié à un défaut qui a réellement existé : les 899 émojis en `https://`, les trois
  marques numériques perdues, les paramètres de suivi.

**Vérifié.**

| Contrôle | Résultat |
|---|---|
| `pnpm test` | **107 / 107** (web 32, scripts 75) |
| `pnpm typecheck` | 7 / 7 |
| Mutation : `Prisma.raw` réintroduit dans la requête marques | **2 tests tombent**, ceux prévus |
| `pnpm db:import` après refactor | 903 mises à jour, 0 erreur ; marques / ACTIVE / géoloc / noms numériques **identiques** avant et après (903/1/868/3) |

**Incident sans conséquence, consigné :** pendant la mutation, la copie de sauvegarde est
partie dans `$OLDPWD` au lieu du scratchpad. Mutation défaite par remplacement inverse,
fichier égaré supprimé, `git status` propre.

**Commit.** `phase 6 (2/n): recherche et import testes, constat n°4 prouve par un test (T6.2)`

### 2026-09-16 · T6.3 — Tests d'intégration sur une base PostgreSQL dédiée

**But.** Prouver ce que les tests unitaires ne peuvent pas prouver : que la garde relit
**réellement** le rôle en base, qu'une revendication crée **réellement** une ligne
`PENDING` et aucun `BrandOwner`, qu'un favori crédite **réellement** 5 points une seule
fois.

**Fait.** `pnpm test:integration` (`vitest.integration.config.ts`) : les Route Handlers
sont appelés comme des fonctions ; la session est simulée, **la base ne l'est pas**. Base
`madeinfrance_test`, migrée avant la suite par `prisma migrate deploy` (la seule commande
de migration autorisée), vidée avant chaque test par un `TRUNCATE` en gabarit statique —
pas de `$executeRawUnsafe`, la règle 3 ne connaît pas d'exception. Fichiers en série.

**Deux garde-fous**, parce que vider les tables sur la mauvaise base coûterait les 903
marques : l'adresse de la base de test est dérivée de `DATABASE_URL` (suffixe `_test`) ou
lue dans `DATABASE_URL_TEST`, et la suite **refuse de démarrer** si elle est identique à
la base de dev ou si son nom ne finit pas par `_test`. Testé : `DATABASE_URL_TEST` pointée
sur la dev → « identique à DATABASE_URL : refus », 903 marques intactes.

**Vérifié.**

| Contrôle | Résultat |
|---|---|
| `pnpm test:integration` | **19 / 19** en 3 fichiers |
| Admin rétrogradé en base, session inchangée | 200 → **403** à la requête suivante ; désactivé → **401** |
| Inscription avec `claimBrandSlug` | 1 `BrandClaimRequest` `PENDING`, **0 `BrandOwner`** (règle 0) |
| Marque inconnue à l'inscription | 404 et **aucun compte orphelin** |
| Mot de passe stocké | haché bcrypt, jamais en clair |
| Favori ajouté deux fois | 1 ligne, **+5 points une seule fois** |
| Deux utilisateurs | chacun ne voit que ses favoris |
| Base de dev après la suite | 903 marques, 12 produits — **intacte** |

**Découvert.**

1. Le chemin du dépôt contient un espace (`1 Projets`) : `execSync` découpait le chemin
   absolu du schéma. Chemin relatif au `cwd`.
2. `users = 0` sur la base de dev a d'abord semblé être un débordement du `TRUNCATE`.
   Vérifié : les 15 utilisateurs des tests sont dans la base de test, les 903 marques de
   la dev sont intactes (un `CASCADE` les aurait emportées), et les 10 suppressions
   cumulées sur `users` datent du nettoyage des comptes de vérification de T4.6. Pas
   d'incident — mais **la base de dev n'a plus de compte administrateur** :
   `pnpm admin:create` avant toute vérification manuelle de l'admin.

**Commit.** `phase 6 (3/n): tests d'integration sur une base dediee (T6.3)`

### 2026-09-16 · T6.6 — Intégration continue

**But.** Que les 126 tests, le typecheck, le lint et le build tournent **ailleurs que
sur ma machine**, à chaque poussée et chaque PR. Tant qu'ils ne tournent qu'ici, ils ne
protègent rien.

**Pourquoi maintenant, avant Playwright (T6.4).** L'ordre du plan met les parcours
navigateur avant la CI. Mais une preuve concrète est arrivée pendant T6.3 : j'ai commité
un test d'intégration avec une **erreur de type** (`string | null` vers `string`). Vitest
ne vérifie pas les types, et je n'avais pas relancé le typecheck après l'avoir écrit. La
CI l'aurait attrapé à la poussée. Playwright se branchera sur cette CI, pas l'inverse.

**Fait.**

- `.github/workflows/ci.yml` : un travail, en séquence, du moins cher au plus cher —
  install → `prisma generate` → typecheck → lint → tests unitaires → tests d'intégration
  sur un service PostgreSQL 16 → build. Le premier échec arrête tout. Le **build** y est
  parce qu'il a échoué sept mois sans que personne ne le sache. Aucun secret réel : les
  valeurs sont factices et se présentent comme telles.
- **`pnpm lint` n'avait jamais tourné.** `apps/web` n'avait pas de configuration ESLint
  (`next lint` ouvrait un assistant), `database` et `shared` non plus, `api` et `scripts`
  n'avaient pas de script. Désormais : une config racine (`@typescript-eslint/recommended`)
  pour les paquets TypeScript, `next/core-web-vitals` pour le web, un script `lint` partout.
- Premier passage du lint : **78 erreurs, une seule règle** — `react/no-unescaped-entities`,
  les apostrophes du texte français en JSX. Désactivée, avec un `.eslintrc.md` qui explique
  pourquoi : la règle attrape une guillemet JSX oubliée, pas la langue française. Puis
  **5 erreurs réelles** corrigées plutôt qu'assouplies : un `catch` vide dans `index.ts`,
  deux `let` jamais réassignés, deux `while (true)`.
- 75 avertissements restent, connus et assumés : 58 `<img>` sur des favicons de 64 px
  (T4.10), 15 `exhaustive-deps` dans les pages admin (à traiter avec le Studio), 2
  `alt-text` qui prennent l'icône lucide `<Image>` pour une image.

**Vérifié — localement.**

| Contrôle | Résultat |
|---|---|
| `pnpm install --frozen-lockfile` | cohérent |
| `pnpm typecheck` | 7 / 7 |
| `pnpm lint` | 7 / 7, **0 erreur**, 75 avertissements |
| `pnpm test` | 107 / 107 |
| `pnpm test:integration` | 19 / 19 |

Le premier passage **en CI** est celui de la poussée de ce commit ; son résultat est
consigné dans l'entrée suivante — un workflow qui n'a jamais tourné n'est pas vérifié.

**T6.7 — le rouge bloque la fusion — n'est pas activé.** La protection de branche
imposerait de passer par des PR ; aujourd'hui tout est poussé directement sur `main`.
C'est un changement de façon de travailler, donc une décision du propriétaire.

**Commit.** `phase 6 (4/n): integration continue, et un lint qui tourne enfin (T6.6)`

### 2026-09-16 · T6.6 (fin) — Premier passage en CI

**Passage 1 : rouge — sur mon propre garde-fou.** J'avais donné la même adresse à
`DATABASE_URL` et `DATABASE_URL_TEST`. La règle « identiques → refus », écrite en T6.3
contre le vidage de la base de développement, a fait exactement ce pour quoi elle
existe. Correction : en CI, une seule base déjà nommée `_test`, et `DATABASE_URL_TEST`
n'est pas définie. Le garde-fou reste.

**Passage 2 : vert, en 2 min 11.**

| Étape | Résultat en CI |
|---|---|
| Types | 7 / 7 |
| Lint | 0 erreur |
| Tests unitaires | **107** (web 32, scripts 75) |
| Tests d'intégration, PostgreSQL 16 éphémère | **19** |
| Build | compilé, 57 pages (la base de CI est vide — 991 en local) |

Exécution : https://github.com/lgicquelw-tech/made-in-france/actions/runs/35108892767

**Ce que ça change.** À partir de maintenant, chaque poussée sur `main` et chaque PR
vérifie l'ensemble. Une erreur de type comme celle de T6.3 ne peut plus rester sur
`main` sans qu'on le voie — elle sera rouge dans les trois minutes.

**Commit.** `ci: ne pas definir DATABASE_URL_TEST — le garde-fou a refuse, a raison`

### 2026-09-16 · T6.4 + T6.5 (partiel) — Playwright et les parcours navigateur

**But.** Vérifier dans un vrai navigateur les parcours dont la casse rend le site inutile,
quel que soit l'état du reste.

**Fait.** Playwright 1.63, Chromium seul. Le serveur Next est **lancé par Playwright sur
la base `_test`** (mêmes garde-fous que l'intégration), semée d'un jeu de données connu :
une région, un secteur, une marque `ACTIVE`, un produit complet, un utilisateur et un
administrateur avec mot de passe. En local `next dev` ; en CI `next start` sur le build
que la CI vient de produire — on teste ce qui serait déployé.

Neuf parcours :

| Parcours | Ce qu'il prouve |
|---|---|
| recherche → marque → produit → lien d'achat | la chaîne entière tient ; bonne URL, `target=_blank`, `rel=noopener` |
| JSON-LD `Product` sur la fiche | prix et lien d'achat exacts |
| fiche inexistante | 404 |
| anonyme sur `/favoris` | renvoyé vers `/connexion?callbackUrl=%2Ffavoris` |
| anonyme sur `/admin` | renvoyé vers la connexion |
| mauvais mot de passe | refusé, message affiché, on reste sur la page |
| connexion puis favori depuis la fiche marque | apparaît dans `/favoris` |
| utilisateur ordinaire sur `/admin` | **404** |
| administrateur sur `/admin` | 200 |

**Vérifié.** Local **9 / 9** en 15 s. CI **verte en 3 min 12**, parcours compris, sur
`next start`. Base de dev intacte après la suite (903 marques, 12 produits).

**Non couvert, à dessein.** La revendication (`/studio/revendiquer`), l'annuaire filtré et
`/favoris` en partie appellent encore **Express** via `API_URL`, qui ne tourne pas dans
les tests. Ces parcours — revendication, édition Studio — attendent la fin de la migration
(T3.4, T3.8). L'édition admin dans le navigateur n'est pas jouée non plus ; l'accès l'est.

**Découvert.** Le port 3000 était tenu par un autre projet de la machine (« Le P'tit
Studio Pro »). `launch.json` (ignoré par git) prend désormais un port libre.

**Commit.** `phase 6 (5/n): Playwright et les parcours navigateur (T6.4, T6.5 partiel)`

### 2026-09-16 · T3.4 — La recherche, de bout en bout

**But.** Que chaque endroit où l'on peut taper une requête fonctionne, sans défaut, et
sans dépendre d'Express — qui ne tourne ni dans les tests ni, demain, en production.

**Constat de départ.** Quatre points d'entrée sur cinq appelaient encore Express
(`API_URL`) : la barre d'en-tête, la page `/recherche` dès qu'on retape, le filtre de
`/marques`, celui de `/produits`. Seul le rendu initial de `/recherche` lisait la base.
Dans l'aperçu — sans Express — une page blanche, puis `Failed to fetch` à chaque frappe.

**Fait.**

- `lib/catalogue-public.ts` : construction pure des listes de marques et de produits
  (`Prisma.sql`, filtres qui **s'additionnent**, tri en **liste blanche**, paramètres
  validés par Zod — un slug hostile est refusé avant toute requête). `lib/search.ts`
  étendu (limite, `websiteUrl`).
- Trois routes Next, mêmes chemins qu'Express : `/api/v1/search/all`, `/api/v1/brands`,
  `/api/v1/products`. Les clients passent en **URL relative**.
- Six clients corrigés : en-tête, `search-content`, `brand-list`, `product-list`,
  `region-detail` ; `featured-brands.tsx` supprimé (importé nulle part).
- Quatre routes Express retirées (483 lignes) : **28 → 24**. Il compile.

**Neuf défauts trouvés et corrigés en chemin.**

| Défaut | Correction |
|---|---|
| **« creme » ne trouvait pas « CRÈME BRÛLÉE »** — on désaccentuait la saisie, jamais la colonne. **191 marques sur 903** portent un accent dans leur nom, 151 villes aussi | extension `unaccent` (migration additive), comparaison des deux côtés ; trouvé par un test d'intégration |
| Chercher dans `/marques` **perdait les filtres** région et secteur (bascule vers une autre route) | une seule route, tout s'additionne |
| Double appel au montage dans **quatre** composants : `setHydrated(true)` relançait l'effet qui refaisait l'appel que le serveur venait de rendre | référence sur la dernière requête résolue |
| L'URL de `/recherche` ne suivait pas la saisie — un lien copié montrait d'autres résultats | `router.replace` après chaque résultat |
| Lettres à la place des logos dans les résultats (2 fichiers de plus sur les 13) | `brandLogoUrl` |
| Recherche dans `/marques` déclenchée **à chaque touche**, sans délai | 300 ms |
| Une réponse en erreur était lue comme un succès (`res.json()` sans `res.ok`) | vérification du statut |
| Bouton de recherche de l'en-tête **sans nom accessible** | `aria-label`, `aria-expanded` |
| « 1 produits de 9 secteurs » | pluriel |

Et un détail de pertinence : une correspondance dans le **nom** passe avant une
correspondance dans la description.

**Vérifié.**

| Contrôle | Résultat |
|---|---|
| `pnpm lint` | 7 / 7, 0 erreur |
| `pnpm test` | **120** (web 45, scripts 75) — dont la forme des requêtes : saisie hostile dans `values`, jamais dans `sql` ; slug hostile → rejet Zod ; tri hors liste → rejet |
| `pnpm test:integration` | **31** — dont « creme » trouve « CRÈME BRÛLÉE », recherche + région + secteur → 1 résultat exact, brouillon jamais listé, 4 marques toujours là après une saisie `DROP TABLE` |
| `pnpm test:e2e` | **14** — en-tête, `/recherche` (résultats **et** URL), `/marques` combiné, `/produits` |
| Sur les 903 marques réelles | `creme` = `crème` = 6 ; `nere` → NÈRE ATELIER ; `oumami` → OÙMAMI ; `francais` → 122 |
| Entrées hostiles sur les routes | `sort=DROP` → 400, `sector='; drop` → 400, `q` hostile → 200 et 903 marques intactes |
| Express après retrait | compile, 24 routes |

**Incident sans conséquence.** Le serveur d'aperçu avait démarré avant l'installation de
Playwright, qui a changé le chemin résolu de `next` : cache `.next` périmé, page blanche
(« reading 'call' »). Redémarrage propre.

**Restent sur Express, et c'est visible dans l'inventaire :** `/api/v1/brands/search`
(revendication Studio), `/brands/random`, `/with-coords*` (carte), `/regions`, `/sectors`,
`/labels`, `/collections`, `/stats`, le chat et le webhook Stripe — T3.8.

**Commit.** `recherche: tout sur Next, insensible aux accents, filtres combines (T3.4)`

### 2026-09-17 · T3.8 (1/2) — Express vidé de ses lectures

**But.** Que plus rien de ce que le site affiche ne dépende d'Express.

**Constat.** 24 routes restaient. Le site en appelait **10** ; **14 n'étaient appelées par
personne** — mortes depuis la migration des pages en rendu serveur (phase 4).

**Fait.** Neuf lectures portées sur Next aux mêmes chemins ; 23 appels dans 12 fichiers
basculés en URL relative ; **22 routes `GET` retirées** d'Express (1 609 → 716 lignes).
Il n'y reste que deux `POST` : le chat et le webhook Stripe.

**Trois comportements changés, à dessein.**

| Route | Avant | Après |
|---|---|---|
| `/brands/[slug]` | le **modèle entier** : `stripeCustomerId`, `stripeSubscriptionId`, affiliation, à quiconque connaissait un slug | forme publique, sans identifiant de paiement |
| `/brands/[slug]/products/all` | **publique** : les brouillons de n'importe quelle marque | `requireBrandOwner` — 401 anonyme, 403 sans lien, 200 propriétaire |
| `/brands/search` (revendication) | filtrait `ACTIVE` : avec 902 marques `PENDING_REVIEW`, **une marque ne trouvait pas sa propre fiche** pour la revendiquer | toutes les marques — la propriété ne dépend pas de la publication |

**Découvert.**

1. L'admin produits appelait `/api/sectors` — une route qui **n'a jamais existé**
   (c'était `/api/v1/sectors`). Le filtre par secteur n'a jamais chargé. Corrigé.
2. La page produits du Studio envoie des `PUT /api/v1/products/:id` avec
   `status: 'INACTIVE'`, `isTrending`, `isNewProduct`, `salePrice` : **aucun de ces champs
   n'existe dans le schéma**, `INACTIVE` n'est pas dans l'énumération, et aucune route
   d'écriture n'existe côté Express. Ces boutons n'ont jamais pu fonctionner. Consigné,
   pas comblé : ce serait ajouter des champs, donc une fonctionnalité (phase 8).
3. `lib/api.ts` n'est plus importé que pour `API_URL`, lui-même utilisé par le seul chat.

**Vérifié.** Typecheck 7/7. Smoke sur l'aperçu : 868 points de carte, `products/all`
anonyme → 401, NANNETTA (`PENDING_REVIEW`) trouvée par la recherche de revendication,
fiche marque **sans champ `stripe*`**. `pnpm test:integration` **37** (6 nouveaux : pas de
secret Stripe dans la fiche, `PENDING_REVIEW` trouvable, 401/403/200 sur la liste Studio).
`pnpm test:e2e` **15** (nouveau : `/carte` annonce ses marques géolocalisées).

**Commit.** `phase 3 (T3.8, 1/2): Express vide de ses lectures, trois comportements corriges`

### 2026-09-17 · T3.7 + T3.8 (2/2) — Le chat, le webhook, et la fin d'Express

**But.** Porter les deux derniers `POST` et supprimer `apps/api`.

**Le chat (T3.7).** Trois modules courts : `lib/chat/outils.ts` (les deux outils, requêtes
construites à part et testées), `lib/chat/conversation.ts` (la boucle, les réglages),
`api/v1/chat/route.ts` (Zod, limiteur : 30 messages par 10 minutes). Quatre défauts
corrigés en portant :

| Défaut | Correction |
|---|---|
| Le prompt exige d'appeler **les deux outils** sur une demande ambiguë, mais la boucle ne traitait que le **premier** `tool_use` — le second restait sans `tool_result`, l'API refusait le tour suivant | tous les résultats d'un tour dans **un** message ; testé |
| L'énumération des secteurs était **l'ancienne taxonomie** : quatre valeurs sur huit sans correspondance en base | les 9 secteurs canoniques |
| `search_brands` filtrait `ACTIVE` : **une** marque visible sur 903 | le chat voit ce que le site montre |
| « Marques de pulls » ne trouvait pas une marque qui *vend* des pulls | correspondance par les produits |

Et : le prompt n'affirme plus « 902 marques, 40 000 produits » ; la liste de modèles de
l'admin ne propose plus des modèles retirés ni des GPT jamais branchés ; la température
n'est envoyée qu'à Haiku (400 sur Sonnet 5 / Opus 5). La **clé** vient de l'environnement
seul — testé : un `apiKey` glissé dans les réglages ne sort jamais.

**Aucun appel réel au modèle** : le feu vert T5.7 est toujours en attente, et une dépense
reste une décision. Le test d'intégration rejoue un modèle simulé sur la vraie base ; la
route est vérifiée sur ce qui ne coûte rien (400 sur corps invalide, 429 au 31e message).

**Le webhook Stripe.** Corps lu **brut** avant `constructEvent` ; un webhook non
vérifiable échoue. 5 tests avec de **vraies signatures** (aide de test du SDK, sans
réseau) : signé → palier activé ; non signé ou mal signé → 400 et **rien ne change** ;
palier inconnu ignoré ; résiliation → gratuit ; secret absent → 500, jamais de repli.

**`apps/api` supprimé** : 3 821 lignes, `lib/api.ts`, `NEXT_PUBLIC_API_URL`, le port 4000,
762 lignes de lockfile. Le monorepo passe de 7 à 6 tâches.

**Vérifié.**

| Contrôle | Résultat |
|---|---|
| `pnpm typecheck` / `pnpm lint` | 6 / 6, 0 erreur |
| `pnpm test` | **128** (web 53, scripts 75) |
| `pnpm test:integration` | **47** (chat 5, webhook 5) |
| `pnpm test:e2e` | 15 |
| `pnpm install --frozen-lockfile` | cohérent |

**Bilan de la phase 3, ouverte le 1er septembre :** 92 routes Express au départ. Toutes
migrées derrière une garde, ou retirées parce que mortes. Il n'y a plus qu'une
application.

**Commit.** `phase 3 (T3.7, T3.8): le chat, le webhook, et la fin d'Express`

### 2026-09-17 · Correctif — les routes d'API étaient figées au build

**Trouvé par la CI, invisible en local.** Le parcours « la carte annonce ses marques »
était vert en `next dev`, rouge sur `next start` : « 0 marques affichées ». Cause : un
Route Handler `GET` qui **ne lit pas la requête** est prérendu au build par Next et sert à
jamais la réponse de ce moment. La route de la carte avait été construite sur une base
vide. En production, `/api/v1/labels`, `/regions`, `/sectors`, `/brands/random` et la
carte auraient servi un instantané figé.

**Et une seconde cause, plus profonde.** Au build, Next tente aussi de prérendre les
`GET` de l'admin ; `requireAdmin` lit les en-têtes ; Next lève son signal interne
`DYNAMIC_SERVER_USAGE` pour dire « cette route est dynamique »… et **mon enveloppe
`route()` l'attrapait** et le transformait en 500 JSON. Le journal du build en portait la
trace depuis le premier `pnpm build` du 10 septembre — « erreur non gérée : Dynamic
server usage » — sans que je le lise comme ce qu'il était.

**Fait.** `toErrorResponse` relance les signaux de Next (`DYNAMIC_SERVER_USAGE`, `NEXT_*`),
3 tests. `export const dynamic = 'force-dynamic'` sur les **58** routes d'API. Build local :
toutes les routes `/api` en ƒ, **0** « erreur non gérée », 979 pages.

**Au passage.** Le build local a d'abord échoué : ~1 000 pages prérendues en parallèle
ont épuisé les 100 connexions de mon PostgreSQL. `connection_limit=5` dans
`DATABASE_URL` pour le build ; consigné dans `CLAUDE.md`.

**Commit.** `correctif: aucune route d'API n'est figee au build, et route() laisse passer les signaux de Next`

### 2026-09-17 · T3.14 — Piste d'audit, et clôture de la phase 3

**But.** Savoir qui a modifié quoi, quand, sur les fiches — et fermer les quatre tâches de
la phase 3 qui portaient une raison périmée.

**Vérifié par script, pas par relecture.** Sur les 58 `route.ts` : aucune route admin,
écriture Studio ou `/me/*` sans garde (T3.10) ; toute route lisant un corps ou une query
string passe par Zod (T3.16) — les deux routes d'envoi de fichier validaient à la main,
alignées. T3.2 ne portait plus que « routes publiques à migrer » : fait ce matin.

**T3.14.** Table `audit_logs` (migration additive) ; `lib/audit.ts` calcule les
**différences** entre avant et après — champs modifiés seulement, **jamais** un secret
(`password`, `stripe*`, affiliation exclus quoi qu'il arrive), textes longs tronqués ;
`journaliser(tx, …)` s'appelle **dans la transaction** de l'écriture qu'il trace : une
modification sans trace, ou une trace sans modification, est impossible. Branché sur :
marque (création, modification, suppression admin ; modification Studio), produit
(création, modification, suppression, mise en avant, activation en masse — une ligne
avec le nombre), palier d'abonnement changé par Stripe (acteur « système »). Lecture
`GET /api/admin/audit`, filtrable par fiche ou par acteur, réservée aux administrateurs.

**Vérifié.** Typecheck 6/6. `pnpm test` 134 (6 sur `differences`). `pnpm test:integration`
**52** — dont : une modification admin laisse **une** trace, avec `city` et
`descriptionShort` et sans `name` (inchangé) ni `stripeCustomerId` (secret) ; une
suppression garde l'état complet, sans secret ; une modification Studio porte l'identité
du propriétaire ; **une écriture qui échoue (slug déjà pris) ne laisse aucune trace** ;
un `USER` reçoit 403 sur la lecture.

**Phase 3 : 24 tâches sur 24.** Ouverte le 1er septembre avec 92 routes Express sans
garde ; close le 17 avec zéro route Express, chaque écriture gardée, validée et tracée.

**Commit.** `phase 3 (T3.14) : piste d'audit, et cloture de la phase`

---

## Phase 8 (avancée) — Le fil de produits

### 2026-09-17 · T8.9 — Des produits d'entrée, et un fil qui s'adapte

**Décision du propriétaire.** « Les gens doivent avoir une sorte d'algorithme comme sur
Vinted : des produits en fonction de leur profil, de leurs dernières recherches ; il faut
proposer des produits d'entrée. » C'est T8.9 du plan, avancé ; c'est aussi un écart avec
`docs/SPEC-V1.md`, qui reportait le catalogue produit. Consigné dans `REBUILD.md`. Deux
choix validés : signaux **dans le navigateur, sans compte** ; **produits d'abord**,
carrousel réduit dessous.

**Le constat de départ.** L'accueil : un carrousel plein écran sur une seule marque, un
bouton « Recherche IA », des « collections inspirantes » — **pas un produit dans le
premier écran**, 838 lignes en `'use client'`, et cinq composants `components/home/*`
importés nulle part. Et une base à **10 produits d'une marque** : le prérequis d'un fil
n'est pas l'algorithme, c'est le catalogue. La collecte complète a été lancée sur les
903 marques au début de la tâche (scrapers idempotents, T5.5).

**Fait.**

- `lib/signaux.ts` (navigateur) : recherches récentes, secteurs et marques consultés,
  dans `localStorage`, plafonnés. `resumer()` en tire **3 secteurs, 5 marques, 6 mots** —
  rien d'identifiant — qui partent en query string et **ne sont pas stockés** côté
  serveur. Pas de profil, pas de consentement à demander. Noté depuis la recherche, le
  catalogue, la fiche marque, la fiche produit. 7 tests.
- `lib/feed.ts` (serveur) : un score déterministe — +4 marque consultée, +3 secteur
  consulté, +2 mot d'une recherche récente, +1 récent, +1 mis en avant — puis une
  **pénalité de diversité** (le n-ième produit d'une même marque perd 1,5 × (n−1)) : une
  marque de 200 produits ne peut pas occuper l'écran. Départage par **hachage du produit
  et de la date**, jamais `RANDOM()` : le fil change chaque jour mais reste stable dans la
  journée, sinon le défilement infini remontrerait les mêmes produits. Seuls les produits
  `ACTIVE` avec image, prix et lien d'achat vivant. 7 tests.
- `GET /api/v1/feed` ; `components/produit-card.tsx` partagée entre fil et catalogue ;
  `home-feed.tsx` (première page rendue par le serveur, personnalisation au montage
  annoncée — « Pour vous · d'après vos recherches et vos visites · réinitialiser » —,
  défilement infini) ; `home-content.tsx` réécrit en **composant serveur** de 110 lignes :
  fil, univers, trois marques, carte. `components/home/*` supprimé.

**Vérifié.**

| Contrôle | Résultat |
|---|---|
| `pnpm test` | **150** (web 75, scripts 75) |
| `pnpm test:integration` | 52 |
| `pnpm test:e2e` | **18** — dont : produits dans le premier écran **dans le HTML servi** ; après une recherche, « Pour vous » et le produit cherché en tête ; « réinitialiser » efface le stockage ; visiter une marque nourrit le fil |
| Fil, pages 1 et 2 | identifiants **disjoints** |
| Fil avec `q=voiture` | le purificateur pour voiture en tête (score 3) |
| Console de l'accueil | 0 erreur |

**Ce que ce n'est pas encore.** Un « algorithme » au sens apprentissage demande des
mois de signaux réels ; celui-ci est déterministe et lisible, ce que fait Vinted à 80 %.
Les signaux **serveur** (vues, clics sortants, favoris → statistiques des marques) sont
T8.2 et attendent le consentement de T7.5. Et le fil vaut ce que vaut le catalogue : il
prendra sa forme quand la collecte aura fini et que `pnpm data:publish` aura publié.

**Incident.** Un `next build` local pendant que le serveur dev tournait a écrasé `.next/`
partagé : page en HTML nu, scripts en 500. Consigné dans `CLAUDE.md`.

**Commit.** `accueil: des produits d'entree, un fil personnalise par le navigateur (T8.9)`

### 2026-09-17 · Le premier catalogue complet, et ce qu'il a révélé

**La collecte.** Lancée en début de tâche sur les 903 marques. Shopify terminé :
**199 marques importées, 23 328 produits créés, 150 lignes de bruit écartées** (119
cartes cadeaux, 22 échantillons, 7 frais), **2 935 doublons de nom**, 5 erreurs.
WooCommerce en cours : 40 225 produits pour 392 marques au moment de cette entrée.

**Ce que 37 000 vraies fiches ont montré que 10 ne pouvaient pas.**

| Défaut | Ampleur | Correction |
|---|---|---|
| **Du HTML dans les noms** — « Cuillère à café `<br/>` Corinthe », « Lacets `&#8211;` embouts gris » | **4 627** fiches | `texteDepuisHtml` sur le titre dans les deux scrapers ; entités nommées et numériques décodées ; `reparer-noms.ts` pour l'existant → 0 restant |
| **Prix invraisemblables** — un « Offer » à 99 999 999 999 € | 1 au-dessus de 20 000 € | borne haute à 20 000 € dans l'audit et la publication. **Pas de borne basse** : une spatule à 0,80 €, une aiguillette à 0,40 € existent |
| Produits de test — « A produit test », « NBK-SPL-TEST » | 3 | deux motifs de plus, étroits : « La Véritable Histoire du **test** de Bechdel » est un livre et doit rester |
| **`next/image` fait tomber la page** dès qu'un hôte n'est pas déclaré | **172 hôtes** d'images distincts, un par boutique WooCommerce | une seule liste `hotes-images.js` partagée entre `next.config.js` et `image-optimisable.ts` ; `<ImageProduit>` optimise les hôtes connus (22 000 images sur `cdn.shopify.com`) et sert le reste en `<img loading="lazy">`. On n'ouvre pas `**` : l'optimiseur deviendrait un proxy d'images public |

**Publication.** `pnpm data:publish` : **34 919 publiés**, 0 retiré. Restent en brouillon :
2 832 descriptions trop courtes, 701 prix absents ou implausibles, 270 sans image.

**Le fil à l'échelle.** 20 marques distinctes sur les 20 premières cartes ; ~100 ms par
page en mode dev ; pages 1 et 2 disjointes ; « voiture » en signal remonte le purificateur
pour voiture. Accueil : 13 images optimisées, 7 brutes, 0 erreur.

**Vérifié.** Typecheck 6/6, lint 0 erreur, **156** tests unitaires, 52 d'intégration, 18
parcours.

**Commit.** `catalogue: 35 000 produits publies, et ce qu'ils ont revele`
