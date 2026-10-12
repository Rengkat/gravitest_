import { NotificationType } from 'src/common/enums/enums';
import {
  NotificationTemplate,
  NotificationTemplateMap,
} from '../types/notification.types';

/**
 * Central template registry.
 * Each key maps to a function that accepts a context object
 * and returns { title, body, actionUrl }.
 *
 * Context shape is documented per-type below.
 * Other modules call NotificationsService.notify() and pass the
 * relevant context — the template formats the message automatically.
 */
export const NOTIFICATION_TEMPLATES: NotificationTemplateMap = {
  // ── Welcome ─────────────────────────────────────────────────────────────
  [NotificationType.WELCOME]: (ctx) => ({
    title: `Welcome to Gravitest${ctx.firstName ? `, ${ctx.firstName}` : ''}! 👋`,
    body: 'Your account is ready. Explore CBT practice, Sabi-Tutor, and performance tracking for secondary exams like JAMB, WAEC and NECO, and professional exams like ICAN, CIBN and NMCN.',
    actionUrl: '/dashboard',
  }),

  // ── Auth / Account ──────────────────────────────────────────────────────
  [NotificationType.ACCOUNT_ALERT]: (ctx) => ({
    title: 'Account Alert',
    body: ctx.message ?? 'There is an important update on your account.',
    actionUrl: '/settings/security',
  }),

  // ── Exam ────────────────────────────────────────────────────────────────
  [NotificationType.RESULT_PUBLISHED]: (ctx) => ({
    title: 'Result Published',
    body: `Your ${ctx.sessionTitle ?? 'exam'} result is now available. You scored ${ctx.score}%.`,
    actionUrl: ctx.sessionId
      ? `/dashboard/performance/${ctx.sessionId}`
      : '/dashboard/performance',
  }),

  // ── Streak ──────────────────────────────────────────────────────────────
  [NotificationType.STREAK_ALERT]: (ctx) => ({
    title:
      ctx.type === 'milestone'
        ? `🎉 ${ctx.days}-Day Streak!`
        : ctx.type === 'at_risk'
          ? '⚠️ Your Streak is at Risk'
          : '🔥 Streak Broken',
    body:
      ctx.type === 'milestone'
        ? `Incredible! You've studied ${ctx.days} days in a row. Keep it up!`
        : ctx.type === 'at_risk'
          ? `Study today to keep your ${ctx.currentStreak}-day streak alive!`
          : `Your ${ctx.lostStreak}-day streak has ended. Start a new one today!`,
    actionUrl: '/dashboard/practice',
  }),

  // ── Gamification ────────────────────────────────────────────────────────
  [NotificationType.ACHIEVEMENT_UNLOCKED]: (ctx) => ({
    title: `Achievement Unlocked 🏆`,
    body: `You just earned "${ctx.achievementName}". ${ctx.description ?? ''}`.trim(),
    actionUrl: '/dashboard/achievements',
  }),

  [NotificationType.LEADERBOARD_UPDATE]: (ctx) => {
    // Monthly-leaderboard lifecycle messages (spec §1.9 / §1.10) —
    // distinguished by ctx.type. Falls through to the original rank-change
    // message when ctx.type is absent, so existing callers are unaffected.
    if (ctx.type === 'closing_soon') {
      return {
        title: 'The monthly leaderboard is almost closing!',
        body: `Keep practising, maintain your streak and improve your performance.${
          ctx.rank ? ` Your current position is #${ctx.rank}.` : ''
        }`,
        actionUrl: '/dashboard/leaderboard?scope=monthly',
      };
    }
    if (ctx.type === 'results_published') {
      const monthName = ctx.period
        ? new Date(`${ctx.period}-01T00:00:00Z`).toLocaleString('en-US', {
            month: 'long',
          })
        : 'This month\u2019s';
      return {
        title: `${monthName} Monthly Leaderboard Results Are Out!`,
        body: `The ${monthName} leaderboard has been finalized. Check your final position and see how you performed this month.`,
        actionUrl: '/dashboard/leaderboard?scope=monthly',
      };
    }
    if (ctx.type === 'incentive_qualified') {
      return {
        title: 'You Qualified for the Monthly Incentive! 🎉',
        body: "Congratulations — your performance this month qualifies you for the monthly incentive. Check your dashboard for details.",
        actionUrl: '/dashboard/leaderboard?scope=monthly',
      };
    }
    return {
      title: 'Leaderboard Update',
      body:
        ctx.moved === 'up'
          ? `You moved up to rank #${ctx.newRank} on the leaderboard!`
          : `You're now ranked #${ctx.newRank}. Keep pushing!`,
      actionUrl: '/dashboard/leaderboard',
    };
  },

  // ── Messages ─────────────────────────────────────────────────────────────
  [NotificationType.NEW_MESSAGE]: (ctx) => ({
    title: `New Message from ${ctx.senderName ?? 'Someone'}`,
    body: ctx.preview ?? 'You have a new message.',
    actionUrl: ctx.threadId
      ? `/dashboard/messages/${ctx.threadId}`
      : '/dashboard/messages',
  }),

  // ── Payments ─────────────────────────────────────────────────────────────
  [NotificationType.PAYMENT_SUCCESS]: (ctx) => ({
    title: 'Payment Successful ',
    body: `Your payment of ₦${ctx.amount?.toLocaleString() ?? '0'} was successful. ${ctx.description ?? ''}`.trim(),
    actionUrl: ctx.transactionId
      ? `/dashboard/transactions/${ctx.transactionId}`
      : '/dashboard/transactions',
  }),

  [NotificationType.PAYMENT_FAILED]: (ctx) => ({
    title: 'Payment Failed ',
    body: `Your payment of ₦${ctx.amount?.toLocaleString() ?? '0'} failed. ${ctx.reason ?? 'Please try again.'}`,
    actionUrl: '/dashboard/transactions',
  }),

  // ── Subscriptions ─────────────────────────────────────────────────────────
  [NotificationType.SUBSCRIPTION_EXPIRING]: (ctx) => ({
    title: 'Subscription Expiring Soon',
    body:
      ctx.daysLeft === 0
        ? 'Your subscription expires today! Renew now to keep access.'
        : `Your ${ctx.tier ?? 'Pro'} subscription expires in ${ctx.daysLeft} day${ctx.daysLeft === 1 ? '' : 's'}.`,
    actionUrl: '/pricing',
  }),

  // ── Content ───────────────────────────────────────────────────────────────
  [NotificationType.NEW_CONTENT]: (ctx) => ({
    title: 'New Content Available 📚',
    body: `"${ctx.contentTitle ?? 'New content'}" is now available${ctx.subject ? ` for ${ctx.subject}` : ''}.`,
    actionUrl: ctx.contentId
      ? `/dashboard/library/${ctx.contentId}`
      : '/dashboard/library',
  }),

  // ── Weekly Report ─────────────────────────────────────────────────────────
  [NotificationType.WEEKLY_REPORT]: (ctx) => ({
    title: 'Your Weekly Study Report ',
    body: `This week: ${ctx.questionsAttempted ?? 0} questions, ${ctx.minutesStudied ?? 0} mins studied, avg score ${ctx.averageScore ?? 0}%.`,
    actionUrl: '/dashboard/reports',
  }),

  // ── System ────────────────────────────────────────────────────────────────
  [NotificationType.SYSTEM]: (ctx) => ({
    title: ctx.title ?? 'System Notification',
    body: ctx.body ?? 'A system event has occurred.',
    actionUrl: ctx.actionUrl ?? null,
  }),
};

/**
 * Resolve a template for a given type + context.
 * Falls back to a generic message if template not found.
 */
export function resolveTemplate(
  type: NotificationType,
  ctx: Record<string, any> = {},
): NotificationTemplate {
  const builder = NOTIFICATION_TEMPLATES[type];
  if (builder) {
    return builder(ctx);
  }
  return {
    title: 'Gravitas Notification',
    body: ctx.body ?? 'You have a new notification.',
    actionUrl: ctx.actionUrl ?? '/dashboard',
  };
}
