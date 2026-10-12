/**
 * Bootstrap a super_admin account.
 *
 * There's no API endpoint for this by design — POST /users (which can
 * create any role, including admin/super_admin) is itself restricted to
 * existing super_admins, so the very first one has to be created outside
 * the API. This script does that the safe way: it boots the real Nest
 * application context and goes through the same User repository and
 * HashProvider (bcrypt, 12 rounds — see common/hash/providers/Bcrypt.provider.ts)
 * the app uses everywhere else, instead of hand-rolling a separate
 * hashing implementation that could drift out of sync.
 *
 * Usage (from the backend/ directory):
 *
 *   npx ts-node -r tsconfig-paths/register scripts/create-admin.ts \
 *     --email=admin@gravitest.ng \
 *     --password='MySecurePass123!' \
 *     --firstName=Ada \
 *     --lastName=Admin
 *
 * Flags:
 *   --email        required
 *   --password     required — must satisfy the same policy as everywhere
 *                  else: 8+ chars, upper, lower, digit, special char.
 *   --firstName    required (only used if the user doesn't exist yet)
 *   --lastName     required (only used if the user doesn't exist yet)
 *   --role         optional — "admin" or "super_admin" (default: super_admin)
 *   --reset-password
 *                  optional flag — if the account already exists, also
 *                  overwrite its password with the one supplied above.
 *                  Without this flag, an existing account only has its
 *                  role updated; its password is left alone.
 *
 * If the email already exists, this promotes that account's role
 * in place rather than erroring — safe to re-run.
 */

import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/user/entities/user.entity';
import { HashProvider } from '../src/common/hash/providers/Hash.provider';
import { UserRole, AuthProvider } from '../src/common/enums/enums';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

function parseArgs(): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (const raw of process.argv.slice(2)) {
    const match = raw.match(/^--([^=]+)(?:=(.*))?$/);
    if (!match) continue;
    args[match[1]] = match[2] ?? true;
  }
  return args;
}

async function main() {
  const args = parseArgs();
  const email = (args.email as string)?.trim().toLowerCase();
  const password = args.password as string;
  const firstName = args.firstName as string;
  const lastName = args.lastName as string;
  const resetPassword = args['reset-password'] === true;
  const roleArg = (args.role as string) ?? 'super_admin';

  if (!email || !password) {
    console.error(
      'Usage: ts-node scripts/create-admin.ts --email=<email> --password=<password> [--firstName=<name>] [--lastName=<name>] [--role=admin|super_admin] [--reset-password]',
    );
    process.exit(1);
  }

  if (roleArg !== 'admin' && roleArg !== 'super_admin') {
    console.error(`--role must be "admin" or "super_admin", got "${roleArg}"`);
    process.exit(1);
  }
  const role = roleArg === 'admin' ? UserRole.ADMIN : UserRole.SUPER_ADMIN;

  if (!PASSWORD_REGEX.test(password)) {
    console.error(
      'Password does not meet the policy: 8+ characters, at least one uppercase letter, ' +
        'one lowercase letter, one digit, and one special character (!@#$%^&*()_+-=[]{};\':"\\|,.<>/?).',
    );
    process.exit(1);
  }

  console.log(
    'Starting application context (this loads the full app, including the DB connection)…',
  );
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const hashProvider = app.get(HashProvider);

    const existing = await userRepo.findOne({ where: { email } });

    if (existing) {
      existing.role = role;
      existing.isActive = true;
      existing.isEmailVerified = true;

      if (resetPassword) {
        existing.passwordHash = await hashProvider.hashPassword(password);
      }

      await userRepo.save(existing);
      console.log(
        `✓ Updated existing user ${email} → role="${role}"` +
          (resetPassword
            ? ' (password reset too)'
            : ' (password left unchanged — pass --reset-password to also change it)'),
      );
      return;
    }

    if (!firstName || !lastName) {
      console.error(
        `No user with email "${email}" exists yet — --firstName and --lastName are required to create one.`,
      );
      process.exit(1);
    }

    const passwordHash = await hashProvider.hashPassword(password);

    const user = userRepo.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email,
      passwordHash,
      role,
      authProvider: AuthProvider.EMAIL,
      isActive: true,
      isEmailVerified: true,
    });

    const saved = await userRepo.save(user);
    console.log(`✓ Created ${role} account: ${saved.email} (id: ${saved.id})`);
    console.log(
      'You can now log in with the email/password you supplied above.',
    );
  } catch (err: any) {
    if (err.code === '23505') {
      console.error(
        'A user with that email already exists but could not be loaded — check for a race condition and re-run.',
      );
    } else {
      console.error('Failed:', err.message ?? err);
    }
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

main();
