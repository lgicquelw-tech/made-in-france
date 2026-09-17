import path from 'node:path';
import { config as chargerEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { urlBaseDeTest } from '../src/test/integration/db-url';

/**
 * Lecture directe de la base de test depuis un parcours, pour vérifier ce que l'écran
 * ne montre pas : qu'une inscription n'a **pas** créé de propriétaire, qu'une édition
 * a laissé sa trace d'audit. Même adresse que le serveur lancé par Playwright.
 */
chargerEnv({ path: path.resolve(__dirname, '../../../.env') });

export const baseDeTest = new PrismaClient({ datasources: { db: { url: urlBaseDeTest() } } });
