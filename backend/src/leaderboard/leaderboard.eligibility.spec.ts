import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';

// Only DI tokens here — loading the real modules pulls in ESM-only deps Jest can't parse.
jest.mock('src/notifications/notifications.service', () => ({ NotificationsService: class {} }));
jest.mock('src/realtime/realtime.gateway', () => ({ RealtimeGateway: class {} }));
jest.mock('src/common/pagination/pagination.provider', () => ({ PaginationProvider: class {} }));

import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';

const SETTINGS = { subscribersOnly: true, minSessionsRequired: 3, minQuestionsAttemptedRequired: 20 };

function makeService(entry: Record<string, unknown> | null) {
  const settingsRepo = { find: jest.fn().mockResolvedValue([SETTINGS]) };
  const entryRepo = {
    findOne: jest.fn().mockResolvedValue(entry),
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn(() => {
      const qb: any = {};
      for (const m of ['where', 'andWhere']) qb[m] = jest.fn().mockReturnValue(qb);
      qb.getCount = jest.fn().mockResolvedValue(0);
      return qb;
    }),
  };
  const svc = new LeaderboardService(
    settingsRepo as never, entryRepo as never, {} as never, {} as never, {} as never,
    {} as never, {} as never, {} as never,
  );
  return svc;
}

describe('?includeIneligible parsing (the bug that listed ineligible students as ranked)', () => {
  const parse = (v: unknown) => plainToInstance(LeaderboardQueryDto, v === undefined ? {} : { includeIneligible: v }).includeIneligible;
  it('the string "false" is false (it used to become true)', () => expect(parse('false')).toBe(false));
  it('the string "true" is true', () => expect(parse('true')).toBe(true));
  it('absent is false', () => expect(parse(undefined)).toBe(false));
});

describe('student leaderboard endpoint', () => {
  it('ignores includeIneligible=true — only admins may see ineligible entries', async () => {
    const service = { getLeaderboard: jest.fn().mockResolvedValue({}) };
    const ctrl = new LeaderboardController(service as never);
    await ctrl.getLeaderboard({ includeIneligible: true } as never, 'u1');
    expect(service.getLeaderboard).toHaveBeenCalledWith(expect.objectContaining({ includeIneligible: false }), 'u1');
  });
});

describe('getMyPosition — says exactly what is missing', () => {
  it('free-plan student with little activity: lists every blocker with their progress', async () => {
    const svc = makeService({
      userId: 'u1', period: '2026-10', isEligible: false, isSubscriber: false, qualifiesForIncentive: false,
      isFinalized: false, sessionsCompleted: 1, questionsAttempted: 5, examTargets: [], category: 'student',
      xpEarned: 60, streak: 1, performance: 50, consistency: 11, score: 1027,
    });
    const me = await svc.getMyPosition('u1');
    expect(me.isEligible).toBe(false);
    expect(me.ranks.general).toBeNull();
    expect(me.eligibility.missing).toEqual([
      'Needs an active paid subscription',
      '1 of 3 practice sessions this month',
      '5 of 20 questions attempted this month',
    ]);
  });

  it('a paid subscriber who met the activity thresholds has nothing missing', async () => {
    const svc = makeService({
      userId: 'u1', period: '2026-10', isEligible: true, isSubscriber: true, qualifiesForIncentive: false,
      isFinalized: false, sessionsCompleted: 4, questionsAttempted: 40, examTargets: [], category: 'student',
      xpEarned: 100, streak: 2, performance: 60, consistency: 20, score: 1500,
    });
    expect((await svc.getMyPosition('u1')).eligibility.missing).toEqual([]);
  });

  it('no entry yet: still explains what is needed', async () => {
    const me = await makeService(null).getMyPosition('u1');
    expect(me.entry).toBeNull();
    expect(me.eligibility.sessions).toEqual({ have: 0, need: 3 });
    expect(me.eligibility.missing).toContain('Needs an active paid subscription');
  });
});
