import { ValidationPipe } from '@nestjs/common';
import { toBoolean } from './transforms';
import { QuestionFiltersDto } from 'src/questions/dto/update-question.dto';
import { UserFilterDto } from 'src/user/dto/user-filter.dto';
import { AdminResetPasswordDto, AdminUpdateUserDto } from 'src/user/dto/update-user.dto';
import { LeaderboardQueryDto } from 'src/leaderboard/dto/leaderboard-query.dto';
import { StudentFiltersDto } from 'src/students/dto/update-student.dto';

/** The app's REAL pipe options (src/main.ts) — implicit conversion is what breaks naive transforms. */
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: false,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
});
const query = <T>(metatype: new () => T, q: Record<string, unknown>) =>
  pipe.transform(q, { type: 'query', metatype } as any) as Promise<T>;
const body = <T>(metatype: new () => T, b: Record<string, unknown>) =>
  pipe.transform(b, { type: 'body', metatype } as any) as Promise<T>;

describe('toBoolean (raw value, immune to implicit conversion)', () => {
  const t = (raw: unknown) => toBoolean({ obj: { k: raw }, key: 'k', value: raw === 'false' ? true : raw }); // value = what implicit conversion would have produced
  it.each([['true', true], ['TRUE', true], [' true ', true], ['1', true], [true, true]])('%p → true', (raw, out) => expect(t(raw)).toBe(out));
  it.each([['false', false], ['False', false], [' false ', false], ['0', false], [false, false]])('%p → false', (raw, out) => expect(t(raw)).toBe(out));
  it.each([[undefined], [null], [''], ['  ']])('%p → unset (no filter)', (raw) => expect(t(raw)).toBeUndefined());
  it('an unrecognised string is passed through so @IsBoolean rejects it', () => expect(t('maybe')).toBe('maybe'));
  it('falls back to `value` when no source object is given', () => expect(toBoolean({ value: 'false' })).toBe(false));
});

describe('through the real pipe — query strings', () => {
  it('QuestionFiltersDto: Draft / Published / All', async () => {
    expect((await query(QuestionFiltersDto, { isActive: 'false' })).isActive).toBe(false);
    expect((await query(QuestionFiltersDto, { isActive: 'true' })).isActive).toBe(true);
    expect((await query(QuestionFiltersDto, {})).isActive).toBeUndefined();
  });

  it('UserFilterDto: ?isActive=false and ?emailVerified=false are honoured (inactive/unverified filters)', async () => {
    const off = await query(UserFilterDto, { isActive: 'false', emailVerified: 'false' });
    expect(off).toMatchObject({ isActive: false, emailVerified: false });
    const on = await query(UserFilterDto, { isActive: 'true', emailVerified: 'true' });
    expect(on).toMatchObject({ isActive: true, emailVerified: true });
    expect((await query(UserFilterDto, {})).isActive).toBeUndefined();
  });

  it('LeaderboardQueryDto: includeIneligible=false stays false (was silently true), absent defaults to false', async () => {
    expect((await query(LeaderboardQueryDto, { includeIneligible: 'false' })).includeIneligible).toBe(false);
    expect((await query(LeaderboardQueryDto, { includeIneligible: 'true' })).includeIneligible).toBe(true);
    expect((await query(LeaderboardQueryDto, {})).includeIneligible).toBe(false);
  });

  it('StudentFiltersDto: isActive=false is honoured', async () => {
    expect((await query(StudentFiltersDto, { isActive: 'false' })).isActive).toBe(false);
    expect((await query(StudentFiltersDto, { isActive: 'true' })).isActive).toBe(true);
  });

  it('a nonsense boolean is a 400 on every one of them', async () => {
    for (const dto of [QuestionFiltersDto, UserFilterDto, StudentFiltersDto] as const) {
      const err: any = await query(dto as any, { isActive: 'banana' }).catch((e) => e);
      expect(err.getStatus?.()).toBe(400);
    }
  });
});

describe('through the real pipe — JSON bodies keep working', () => {
  it('real booleans in a body are untouched, false stays false', async () => {
    const dto = await body(AdminUpdateUserDto, { isActive: false, isEmailVerified: false, isPhoneVerified: true });
    expect(dto).toMatchObject({ isActive: false, isEmailVerified: false, isPhoneVerified: true });
  });

  it('notifyUser: explicit false stays false; absent keeps its default of true', async () => {
    expect((await body(AdminResetPasswordDto, { notifyUser: false })).notifyUser).toBe(false);
    expect((await body(AdminResetPasswordDto, {})).notifyUser).toBe(true);
  });
});
