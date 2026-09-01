import pino from 'pino';

/**
 * Journalisation structurée (REBUILD.md T3.22).
 *
 * L'API écrivait 13 `console.log` et 30 `console.error` en texte libre, avec
 * des émojis et des données mêlées au message. Impossible à filtrer, à
 * agréger, ou à brancher sur un collecteur d'erreurs en phase 7.
 *
 * Deux règles pour ce fichier :
 *  - **rien de personnel dans un journal** : ni message de chat, ni adresse
 *    e-mail, ni contenu saisi par un visiteur ;
 *  - **aucun secret**, évidemment — les clés sont d'ailleurs masquées ci-dessous
 *    au cas où un objet en contiendrait une.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.passwordHash',
      '*.apiKey',
      '*.anthropicApiKey',
      '*.openaiApiKey',
      '*.stripeSecretKey',
    ],
    censor: '[masqué]',
  },
  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } },
});
