import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/guards';
import { route } from '@/lib/api-response';

/**
 * Réglages du chat IA. Migré depuis Express.
 *
 * ⚠️ Ces routes ont été le pire défaut du projet : le `GET` renvoyait
 * `anthropicApiKey` et `openaiApiKey` **en clair, sans authentification**, et
 * le `PUT` écrivait `process.env` depuis le corps de la requête. Neutralisées
 * en phase 0 (T0.5), elles sont ici derrière `requireAdmin`.
 *
 * Le filtre reste en place malgré tout : une base peut encore contenir une
 * clé enregistrée par l'ancienne version. On ne la renvoie pas.
 */

const AI_SECRET_FIELD = /(apikey|api_key|secret|token|password)/i;

function withoutSecrets(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(([key]) => !AI_SECRET_FIELD.test(key))
  );
}

const aiSettingsSchema = z.object({
  model: z.string().trim().min(1).max(120).optional(),
  prompt: z.string().max(20000).optional(),
  temperature: z.coerce.number().min(0).max(2).optional(),
  // 200 000 laissait un administrateur fixer une valeur ruineuse par appel.
  maxTokens: z.coerce.number().int().min(1).max(8192).optional(),
  rules: z
    .array(
      z.object({
        id: z.string(),
        keyword: z.string(),
        response: z.string(),
        enabled: z.boolean(),
      })
    )
    .optional(),
});

const SETTINGS_KEY = 'ai_settings';

export const GET = route(async () => {
  await requireAdmin();

  const setting = await prisma.siteSetting.findUnique({ where: { key: SETTINGS_KEY } });

  if (setting) {
    return NextResponse.json({ data: withoutSecrets(setting.value) });
  }

  return NextResponse.json({
    data: {
      // Un nom de modèle et des réglages, jamais une clé : les clés vivent
      // uniquement dans l'environnement du serveur (CLAUDE.md, règle 4).
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
      prompt: '',
      temperature: 0.7,
      maxTokens: 1024,
      rules: [],
    },
  });
});

export const PUT = route(async (request: Request) => {
  await requireAdmin();

  // Double filet : le schéma n'accepte que des champs connus, et
  // `withoutSecrets` retire tout ce qui ressemblerait à un secret.
  const parsed = aiSettingsSchema.parse(await request.json());
  const settings = withoutSecrets(parsed);

  await prisma.siteSetting.upsert({
    where: { key: SETTINGS_KEY },
    update: { value: settings as Prisma.InputJsonValue },
    create: { key: SETTINGS_KEY, value: settings as Prisma.InputJsonValue },
  });

  return NextResponse.json({ success: true, data: settings });
});
