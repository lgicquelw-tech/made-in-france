import { NextResponse } from 'next/server';
import { z } from 'zod';

import { route } from '@/lib/api-response';
import { enforceRateLimit } from '@/lib/rate-limit';
import { repondre } from '@/lib/chat/conversation';

/**
 * Le chat (REBUILD.md T3.7). Chaque message coûte un appel de modèle : limité par
 * adresse. Migré depuis Express ; même chemin, appelé en URL relative.
 */
const corps = z.object({
  message: z.string().trim().min(1).max(2000),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(4000),
  })).max(20).default([]),
});

export const POST = route(async (request: Request) => {
  enforceRateLimit(request, { scope: 'chat', limit: 30, windowMs: 10 * 60_000, message: 'Trop de messages. Réessayez dans quelques minutes.' });
  // Valider avant tout : un corps invalide ne doit coûter ni un appel de modèle, ni une
  // lecture de réglages.
  const { message, conversationHistory } = corps.parse(await request.json());
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "L'assistant n'est pas configuré." }, { status: 503 });
  }
  return NextResponse.json(await repondre(message, conversationHistory));
});
