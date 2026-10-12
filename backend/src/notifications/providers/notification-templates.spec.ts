import { NotificationType } from 'src/common/enums/enums';
import { resolveTemplate } from './notification-templates';

describe('resolveTemplate', () => {
  describe('RESULT_PUBLISHED', () => {
    it('includes the session title and score in the body', () => {
      const result = resolveTemplate(NotificationType.RESULT_PUBLISHED, {
        sessionTitle: 'JAMB Mock Exam',
        score: 87,
        sessionId: 'sess-123',
      });
      expect(result.title).toBe('Result Published');
      expect(result.body).toContain('JAMB Mock Exam');
      expect(result.body).toContain('87%');
      expect(result.actionUrl).toBe('/dashboard/performance/sess-123');
    });

    it('falls back to a generic "exam" label and the base performance URL when context is sparse', () => {
      const result = resolveTemplate(NotificationType.RESULT_PUBLISHED, { score: 50 });
      expect(result.body).toContain('exam');
      expect(result.actionUrl).toBe('/dashboard/performance');
    });
  });

  describe('STREAK_ALERT', () => {
    it('renders the milestone variant', () => {
      const result = resolveTemplate(NotificationType.STREAK_ALERT, {
        type: 'milestone',
        days: 7,
      });
      expect(result.title).toContain('7-Day Streak');
      expect(result.body).toContain('7 days in a row');
    });

    it('renders the at_risk variant', () => {
      const result = resolveTemplate(NotificationType.STREAK_ALERT, {
        type: 'at_risk',
        currentStreak: 4,
      });
      expect(result.title).toContain('at Risk');
      expect(result.body).toContain('4-day streak');
    });

    it('renders the broken-streak variant by default', () => {
      const result = resolveTemplate(NotificationType.STREAK_ALERT, {
        lostStreak: 10,
      });
      expect(result.title).toBe('🔥 Streak Broken');
      expect(result.body).toContain('10-day streak has ended');
    });
  });

  describe('PAYMENT_SUCCESS', () => {
    it('formats the amount with locale thousands separators', () => {
      const result = resolveTemplate(NotificationType.PAYMENT_SUCCESS, {
        amount: 25000,
        transactionId: 'txn-1',
      });
      expect(result.body).toContain('25,000');
      expect(result.actionUrl).toBe('/dashboard/transactions/txn-1');
    });

    it('defaults to ₦0 when amount is missing rather than showing "undefined"', () => {
      const result = resolveTemplate(NotificationType.PAYMENT_SUCCESS, {});
      expect(result.body).toContain('₦0');
      expect(result.body).not.toContain('undefined');
    });
  });

  describe('SUBSCRIPTION_EXPIRING', () => {
    it('uses singular "day" when exactly 1 day remains', () => {
      const result = resolveTemplate(NotificationType.SUBSCRIPTION_EXPIRING, {
        daysLeft: 1,
        tier: 'Premium',
      });
      expect(result.body).toBe('Your Premium subscription expires in 1 day.');
    });

    it('uses plural "days" otherwise', () => {
      const result = resolveTemplate(NotificationType.SUBSCRIPTION_EXPIRING, {
        daysLeft: 3,
        tier: 'Premium',
      });
      expect(result.body).toBe('Your Premium subscription expires in 3 days.');
    });

    it('shows the "expires today" copy when daysLeft is 0', () => {
      const result = resolveTemplate(NotificationType.SUBSCRIPTION_EXPIRING, {
        daysLeft: 0,
      });
      expect(result.body).toContain('expires today');
    });
  });

  describe('SYSTEM', () => {
    it('passes through admin-supplied title/body/actionUrl verbatim', () => {
      const result = resolveTemplate(NotificationType.SYSTEM, {
        title: 'Essay needs manual review',
        body: 'Session abc123 was flagged.',
        actionUrl: '/admin/exams/sessions/abc123',
      });
      expect(result).toEqual({
        title: 'Essay needs manual review',
        body: 'Session abc123 was flagged.',
        actionUrl: '/admin/exams/sessions/abc123',
      });
    });
  });

  describe('unknown/unmapped type', () => {
    it('falls back to a generic notification rather than throwing', () => {
      // Cast past the enum on purpose — this simulates a future
      // NotificationType value that hasn't gotten a template yet, which
      // is exactly the scenario this fallback exists to protect against.
      const result = resolveTemplate('not_a_real_type' as NotificationType, {
        body: 'custom fallback text',
      });
      expect(result.title).toBe('Gravitas Notification');
      expect(result.body).toBe('custom fallback text');
      expect(result.actionUrl).toBe('/dashboard');
    });
  });
});
