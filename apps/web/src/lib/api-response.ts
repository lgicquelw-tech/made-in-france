import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Erreurs HTTP et réponses JSON uniformes pour les Route Handlers.
 *
 * Règle appliquée ici : un défaut interne ne dit jamais au client ce qui a
 * échoué. Il est journalisé côté serveur et renvoyé en 500 générique. Seules
 * les erreurs explicitement levées par le code métier portent un message.
 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const unauthorized = (message = 'Authentification requise') =>
  new HttpError(401, message);

export const forbidden = (message = 'Accès refusé') => new HttpError(403, message);

export const notFound = (message = 'Ressource introuvable') =>
  new HttpError(404, message);

export const badRequest = (message = 'Requête invalide') => new HttpError(400, message);

export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  // Zod : on renvoie le détail par champ, c'est une erreur du client, pas une
  // fuite d'information interne.
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Requête invalide', details: error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  console.error('[api] erreur non gérée', error);
  return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
}

type Handler<Ctx> = (request: Request, context: Ctx) => Promise<NextResponse | Response>;

/**
 * Enveloppe un Route Handler : toute erreur levée — y compris par les gardes
 * de `lib/guards.ts` — devient une réponse HTTP correcte. Sans elle, un
 * `throw` dans une garde produirait une 500 opaque au lieu d'une 401 ou 403.
 */
export function route<Ctx>(handler: Handler<Ctx>): Handler<Ctx> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}
