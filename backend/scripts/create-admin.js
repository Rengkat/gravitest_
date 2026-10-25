'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const core_1 = require('@nestjs/core');
const typeorm_1 = require('@nestjs/typeorm');
const app_module_1 = require('../src/app.module');
const user_entity_1 = require('../src/user/entities/user.entity');
const Hash_provider_1 = require('../src/common/hash/providers/Hash.provider');
const enums_1 = require('../src/common/enums/enums');
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
function parseArgs() {
  const args = {};
  for (const raw of process.argv.slice(2)) {
    const match = raw.match(/^--([^=]+)(?:=(.*))?$/);
    if (!match) continue;
    args[match[1]] = match[2] ?? true;
  }
  return args;
}
async function main() {
  const args = parseArgs();
  const email = args.email?.trim().toLowerCase();
  const password = args.password;
  const firstName = args.firstName;
  const lastName = args.lastName;
  const resetPassword = args['reset-password'] === true;
  const roleArg = args.role ?? 'super_admin';
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
  const role =
    roleArg === 'admin' ? enums_1.UserRole.ADMIN : enums_1.UserRole.SUPER_ADMIN;
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
  const app = await core_1.NestFactory.createApplicationContext(
    app_module_1.AppModule,
    {
      logger: ['error', 'warn'],
    },
  );
  try {
    const userRepo = app.get(
      (0, typeorm_1.getRepositoryToken)(user_entity_1.User),
    );
    const hashProvider = app.get(Hash_provider_1.HashProvider);
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
      authProvider: enums_1.AuthProvider.EMAIL,
      isActive: true,
      isEmailVerified: true,
    });
    const saved = await userRepo.save(user);
    console.log(`✓ Created ${role} account: ${saved.email} (id: ${saved.id})`);
    console.log(
      'You can now log in with the email/password you supplied above.',
    );
  } catch (err) {
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
//# sourceMappingURL=create-admin.js.map
