import { AsyncLocalStorage } from 'node:async_hooks';
import type { NextFunction, Request, Response } from 'express';

/**
 * Makes "the current HTTP request" available anywhere without injecting
 * Nest's REQUEST token.
 *
 * Why this exists: a provider that injects REQUEST becomes request-scoped, and
 * request scope BUBBLES UP to everything that depends on it. PaginationProvider
 * used to inject REQUEST (just to build page links), which silently made
 * SubscriptionsService, TransactionsService, LibraryService, LeaderboardService
 * and others request-scoped too. @nestjs/schedule refuses to register @Cron
 * jobs on non-static providers, so subscription renewals, expiry/lapse jobs
 * and the leaderboard jobs never ran. AsyncLocalStorage gives the same data
 * without changing any provider's scope.
 */
export interface RequestContextStore {
  req: Request;
}

export const requestContext = new AsyncLocalStorage<RequestContextStore>();

/** Express middleware: wrap the rest of the request in the context. */
export function requestContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  requestContext.run({ req }, next);
}

/** Current request, or undefined outside HTTP (cron, queue worker, event). */
export function currentRequest(): Request | undefined {
  return requestContext.getStore()?.req;
}
