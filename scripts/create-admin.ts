/**
 * Création d'un administrateur — REBUILD.md T3.15.
 *
 * Remplace `POST /api/admin/setup`, qui créait un `super_admin` sans aucune
 * authentification et dont le seul garde-fou était « un admin existe déjà »
 * (constat n°7). Une commande locale ne peut être appelée que par quelqu'un
 * qui a déjà accès au serveur et à la base : c'est le bon niveau de privilège.
 *
 *   pnpm admin:create
 *
 * Le mot de passe est saisi sans écho et n'est jamais affiché, ni passé en
 * argument de ligne de commande (où il finirait dans l'historique du shell et
 * dans la liste des processus).
 */
import { createInterface } from 'node:readline';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// UNE seule interface pour toute la session, et une file d'attente de lignes.
//
// `rl.question` en cascade fonctionne au terminal mais casse dès que stdin est
// redirigé : readline émet alors toutes les lignes d'un coup, et celles qui
// arrivent hors d'une question posée sont perdues — le programme sortait en
// silence avec le code 0, ce qui rendait la commande intestable.
const rl = createInterface({ input: process.stdin, output: process.stdout });

const buffered: string[] = [];
const waiting: Array<(line: string | null) => void> = [];

rl.on('line', (line) => {
  const next = waiting.shift();
  if (next) next(line);
  else buffered.push(line);
});
rl.on('close', () => {
  while (waiting.length) waiting.shift()!(null);
});

// readline réaffiche chaque caractère saisi ; on intercepte pour ne rien
// montrer pendant la saisie d'un mot de passe.
let masking = false;
const internals = rl as unknown as { _writeToOutput: (chunk: string) => void };
const writeToOutput = internals._writeToOutput.bind(rl);
internals._writeToOutput = (chunk: string) => {
  if (!masking) writeToOutput(chunk);
};

function nextLine(): Promise<string | null> {
  const ready = buffered.shift();
  if (ready !== undefined) return Promise.resolve(ready);
  return new Promise((resolve) => waiting.push(resolve));
}

async function ask(question: string, silent = false): Promise<string> {
  process.stdout.write(question);
  masking = silent;
  const line = await nextLine();
  masking = false;
  if (silent) process.stdout.write('\n');
  if (line === null) throw new Error('Saisie interrompue.');
  return line.trim();
}

async function main() {
  const email = (await ask('E-mail de l\'administrateur : ')).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Adresse e-mail invalide.');
  }

  const password = await ask('Mot de passe (masqué)       : ', true);
  if (password.length < 12) {
    throw new Error('Le mot de passe doit faire au moins 12 caractères.');
  }
  const confirmation = await ask('Confirmation                : ', true);
  if (password !== confirmation) {
    throw new Error('Les deux saisies diffèrent.');
  }

  // Le tout premier compte est SUPER_ADMIN ; les suivants sont ADMIN. Élever
  // quelqu'un au rang de super-administrateur reste une action délibérée.
  const superAdminExists = await prisma.user.count({ where: { role: UserRole.SUPER_ADMIN } });
  const role = superAdminExists === 0 ? UserRole.SUPER_ADMIN : UserRole.ADMIN;

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  const user = existing
    ? await prisma.user.update({
        // Compte déjà présent : on le promeut plutôt que d'échouer. C'est le
        // cas normal quand un utilisateur inscrit devient administrateur.
        where: { email },
        data: { role, isActive: true, password: passwordHash },
      })
    : await prisma.user.create({
        data: { email, password: passwordHash, role, isActive: true },
      });

  console.log(
    `\n✅ ${existing ? 'Compte promu' : 'Compte créé'} : ${user.email} — rôle ${user.role}`
  );
  console.log('   Connexion sur /connexion, puis accès à /admin.\n');
}

main()
  .catch((error) => {
    console.error(`\n❌ ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
