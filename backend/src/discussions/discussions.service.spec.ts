// nanoid (a StorageService dependency) is ESM-only and not transformed by this jest setup; the service is mocked anyway.
jest.mock('src/storage/storage.service', () => ({ StorageService: class {} }));

import { BadRequestException, ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';
import { AUTO_HIDE_REPORT_THRESHOLD, DiscussionsService, publicName, sniffImageType, MAX_PER_MINUTE } from './discussions.service';
import { ContributionStatus } from './entities/question-contribution.entity';
import { UserRole } from 'src/common/enums/enums';

const ME = { id: 'me', role: UserRole.STUDENT };
const OTHER = 'other';
const Q = '11111111-1111-1111-1111-111111111111';
const id = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

function contribution(o: Record<string, unknown>) {
  return {
    id: id(1), questionId: Q, partId: null, userId: OTHER, parentId: null, replyToId: null, content: 'hi', imageUrls: [],
    likeCount: 0, dislikeCount: 0, replyCount: 0, reportCount: 0, status: ContributionStatus.VISIBLE, clientToken: null,
    editedAt: null, createdAt: new Date(), ...o,
  };
}

function build(rows: any[] = [], opts: { recent?: number; owned?: boolean } = {}) {
  const store = [...rows];
  const contribs: any = {
    findOne: jest.fn(async ({ where }: any) => store.find((r) => Object.entries(where).every(([k, v]) => r[k] === v)) ?? null),
    find: jest.fn(async () => []),
    count: jest.fn(async () => opts.recent ?? 0),
  };
  const reactionRows: any[] = [];
  const reactions: any = { find: jest.fn(async () => reactionRows) };
  const users: any = { find: jest.fn(async () => []) };
  const setCalls: any[] = [];
  const manager: any = {
    create: jest.fn((_e: unknown, v: any) => ({ id: id(99), createdAt: new Date(), ...v, likeCount: 0, dislikeCount: 0, replyCount: 0, reportCount: 0, status: 'visible', editedAt: null })),
    save: jest.fn(async (x: any) => x),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(async () => ({ likeCount: 1, dislikeCount: 0 })),
    insert: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => {
      const qb: any = { update: () => qb, set: (v: any) => { setCalls.push(v); return qb; }, where: () => qb, execute: jest.fn() };
      return qb;
    }),
  };
  const dataSource: any = { transaction: jest.fn(async (cb: any) => cb(manager)) };
  const access: any = { assertCanAccess: jest.fn().mockResolvedValue({ partPath: null }) };
  const storage: any = { isOwnedUrl: jest.fn(() => opts.owned ?? true), uploadBuffer: jest.fn() };
  const svc = new DiscussionsService(contribs, reactions, {} as any, users, dataSource, access, storage);
  return { svc, contribs, manager, access, setCalls, storage };
}

describe('DiscussionsService.create', () => {
  it('checks access for exactly the question/part being written to', async () => {
    const { svc, access } = build();
    await svc.create(ME, { questionId: Q, partId: 'part-a', content: 'my working' } as any);
    expect(access.assertCanAccess).toHaveBeenCalledWith(ME, { questionId: Q, partId: 'part-a' });
  });

  it('stores the contribution against the question and part, never an index or number', async () => {
    const { svc, manager } = build();
    await svc.create(ME, { questionId: Q, partId: 'part-a', content: 'hello' } as any);
    expect(manager.create).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ questionId: Q, partId: 'part-a', userId: 'me', parentId: null }));
  });

  it('is idempotent: the same clientToken returns the first contribution and creates nothing', async () => {
    const prior = contribution({ id: id(7), userId: 'me', clientToken: 'token-12345' });
    const { svc, manager } = build([prior]);
    const out = await svc.create(ME, { questionId: Q, content: 'x', clientToken: 'token-12345' } as any);
    expect(out.id).toBe(id(7));
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('treats an identical re-post within the window as the same contribution', async () => {
    const { svc, contribs, manager } = build();
    contribs.find.mockResolvedValueOnce([contribution({ id: id(8), userId: 'me', content: 'Same  text' })]);
    const out = await svc.create(ME, { questionId: Q, content: 'same text' } as any);
    expect(out.id).toBe(id(8));
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('rejects empty posts, abusive text and too-many-links', async () => {
    const { svc } = build();
    await expect(svc.create(ME, { questionId: Q, content: '   ' } as any)).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.create(ME, { questionId: Q, content: 'you idiot' } as any)).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.create(ME, { questionId: Q, content: 'http://a.com http://b.com http://c.com' } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rate-limits rapid posting with a 429', async () => {
    const { svc } = build([], { recent: MAX_PER_MINUTE });
    await expect(svc.create(ME, { questionId: Q, content: 'one more' } as any)).rejects.toMatchObject({ status: 429 });
    expect(HttpException).toBeDefined();
  });

  it('refuses images that did not come from the discussion uploader', async () => {
    const { svc } = build([], { owned: false });
    await expect(svc.create(ME, { questionId: Q, content: 'see', imageUrls: ['https://evil.example/x.png'] } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  describe('replies', () => {
    it('increments the parent reply counter atomically', async () => {
      const parent = contribution({ id: id(2) });
      const { svc, setCalls } = build([parent]);
      await svc.create(ME, { questionId: Q, content: 'agreed', parentId: id(2) } as any);
      expect(setCalls.some((s) => typeof s.replyCount === 'function')).toBe(true);
    });

    it('keeps a reply to a reply flat under the original parent and remembers who it answers', async () => {
      const top = contribution({ id: id(2) });
      const reply = contribution({ id: id(3), parentId: id(2) });
      const { svc, manager } = build([top, reply]);
      await svc.create(ME, { questionId: Q, content: 'and another thing', parentId: id(3) } as any);
      expect(manager.create).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ parentId: id(2), replyToId: id(3) }));
    });

    it('cannot reply across questions or sub-questions', async () => {
      const elsewhere = contribution({ id: id(4), questionId: '22222222-2222-2222-2222-222222222222' });
      const otherPart = contribution({ id: id(5), partId: 'part-b' });
      const { svc } = build([elsewhere, otherPart]);
      await expect(svc.create(ME, { questionId: Q, content: 'x', parentId: id(4) } as any)).rejects.toBeInstanceOf(BadRequestException);
      await expect(svc.create(ME, { questionId: Q, partId: 'part-a', content: 'x', parentId: id(5) } as any)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('cannot reply to a deleted or hidden contribution', async () => {
      const gone = contribution({ id: id(6), status: ContributionStatus.DELETED });
      const { svc } = build([gone]);
      await expect(svc.create(ME, { questionId: Q, content: 'x', parentId: id(6) } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});

describe('DiscussionsService.update / remove', () => {
  it('only the author may edit', async () => {
    const { svc } = build([contribution({ id: id(2), userId: OTHER })]);
    await expect(svc.update(ME, id(2), { content: 'hijack' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('marks an edit as edited', async () => {
    const { svc, contribs } = build([contribution({ id: id(2), userId: 'me' })]);
    contribs.save = jest.fn(async (x: any) => x);
    const out = await svc.update(ME, id(2), { content: 'fixed typo' });
    expect(out.edited).toBe(true);
  });

  it('a student cannot delete someone else’s contribution; the author and a moderator can', async () => {
    const row = () => contribution({ id: id(2), userId: OTHER });
    await expect(build([row()]).svc.remove(ME, id(2))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(build([contribution({ id: id(2), userId: 'me' })]).svc.remove(ME, id(2))).resolves.toEqual({ deleted: true });
    await expect(build([row()]).svc.remove({ id: 'adm', role: UserRole.ADMIN }, id(2))).resolves.toEqual({ deleted: true });
  });

  it('deleting a reply decrements the parent counter; deleting a parent keeps its replies (soft delete)', async () => {
    const reply = build([contribution({ id: id(3), userId: 'me', parentId: id(2) })]);
    await reply.svc.remove(ME, id(3));
    expect(reply.setCalls.some((s) => typeof s.replyCount === 'function')).toBe(true);

    const parentRow = contribution({ id: id(2), userId: 'me', replyCount: 2 });
    const parent = build([parentRow]);
    await parent.svc.remove(ME, id(2));
    expect(parentRow.status).toBe(ContributionStatus.DELETED); // row kept → replies keep their context
    expect(parent.manager.delete).not.toHaveBeenCalled();
  });

  it('treats a malformed id as not found', async () => {
    await expect(build().svc.remove(ME, 'nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('DiscussionsService.react', () => {
  function withExisting(value: 1 | -1 | null) {
    const b = build([contribution({ id: id(2) })]);
    b.manager.findOne.mockResolvedValue(value === null ? null : { id: 'r1', value });
    return b;
  }
  const delta = (b: ReturnType<typeof build>) => {
    const call = b.setCalls.at(-1);
    return call ? { like: call.likeCount(), dislike: call.dislikeCount() } : null;
  };

  it('a first like adds one like', async () => {
    const b = withExisting(null);
    await b.svc.react(ME, id(2), 1);
    expect(b.manager.insert).toHaveBeenCalled();
    expect(delta(b)).toEqual({ like: expect.stringContaining('+ 1'), dislike: expect.stringContaining('+ 0') });
  });

  it('switching like → dislike moves one count across, never both at once', async () => {
    const b = withExisting(1);
    await b.svc.react(ME, id(2), -1);
    expect(b.manager.save).toHaveBeenCalledWith(expect.objectContaining({ value: -1 }));
    expect(delta(b)).toEqual({ like: expect.stringContaining('+ -1'), dislike: expect.stringContaining('+ 1') });
  });

  it('clearing a reaction removes the row and the count', async () => {
    const b = withExisting(1);
    await b.svc.react(ME, id(2), 0);
    expect(b.manager.delete).toHaveBeenCalled();
    expect(delta(b)?.like).toContain('+ -1');
  });

  it('repeating the same reaction changes nothing', async () => {
    const b = withExisting(1);
    await b.svc.react(ME, id(2), 1);
    expect(b.manager.insert).not.toHaveBeenCalled();
    expect(b.setCalls).toHaveLength(0);
  });

  it('retries once when two first-reactions race on the unique index', async () => {
    const b = withExisting(null);
    b.manager.insert.mockRejectedValueOnce({ code: '23505' });
    await expect(b.svc.react(ME, id(2), 1)).resolves.toMatchObject({ myReaction: 1 });
  });

  it('cannot react to your own or to a removed contribution', async () => {
    await expect(build([contribution({ id: id(2), userId: 'me' })]).svc.react(ME, id(2), 1)).rejects.toBeInstanceOf(BadRequestException);
    await expect(build([contribution({ id: id(2), status: ContributionStatus.HIDDEN })]).svc.react(ME, id(2), 1)).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('moderation', () => {
  it('auto-hides after enough distinct reports and drops the parent’s visible-reply count', async () => {
    const row = contribution({ id: id(3), parentId: id(2), reportCount: AUTO_HIDE_REPORT_THRESHOLD - 1 });
    const b = build([row]);
    b.manager.findOneOrFail.mockResolvedValue({ ...row, reportCount: AUTO_HIDE_REPORT_THRESHOLD });
    await b.svc.report(ME, id(3), { reason: 'spam' } as any);
    expect(b.manager.save).toHaveBeenCalledWith(expect.objectContaining({ status: ContributionStatus.HIDDEN }));
    expect(b.setCalls.some((s) => typeof s.replyCount === 'function')).toBe(true);
  });

  it('reporting twice is a no-op, and you cannot report yourself', async () => {
    const b = build([contribution({ id: id(3) })]);
    b.manager.insert.mockRejectedValueOnce({ code: '23505' });
    await expect(b.svc.report(ME, id(3), { reason: 'spam' } as any)).resolves.toEqual({ reported: true, alreadyReported: true });
    await expect(build([contribution({ id: id(3), userId: 'me' })]).svc.report(ME, id(3), { reason: 'spam' } as any)).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('helpers', () => {
  it('shows only first name + last initial publicly', () => {
    expect(publicName({ firstName: 'Abdullahi', lastName: 'Okafor' } as any)).toBe('Abdullahi O.');
    expect(publicName(null)).toBe('Former student');
  });

  it('identifies images by their bytes, not the declared type', () => {
    const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16)]);
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16)]);
    const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(8)]);
    expect(sniffImageType(jpg)).toBe('image/jpeg');
    expect(sniffImageType(png)).toBe('image/png');
    expect(sniffImageType(webp)).toBe('image/webp');
    expect(sniffImageType(Buffer.from('<svg onload=alert(1)></svg>'))).toBeNull();
    expect(sniffImageType(Buffer.from('GIF89a......'))).toBeNull();
  });
});
