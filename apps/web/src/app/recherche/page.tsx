import { Suspense } from 'react';

import SearchContent from './search-content';

/**
 * ⚠️ `useSearchParams()` impose une frontière `Suspense` dès lors que la page
 * est prérendue : sans elle, `next build` échoue avec « useSearchParams()
 * should be wrapped in a suspense boundary ».
 *
 * Le mode développement ne le signale pas. Ce défaut existait depuis le commit
 * de février 2026 : le projet n'était donc pas constructible, et par
 * conséquent pas déployable.
 */
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Chargement…</div>}>
      <SearchContent />
    </Suspense>
  );
}
