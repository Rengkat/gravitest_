import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { NotificationEvent } from '../types/notification.types';

@Injectable()
export class NotificationEventsEmitter {
  private readonly streams = new Map<string, Subject<NotificationEvent>>();

  emit(event: NotificationEvent): void {
    // Delivers instantly only to this specific user's connected tabs
    this.streams.get(event.userId)?.next(event);
  }

  streamFor(userId: string): Observable<NotificationEvent> {
    if (!this.streams.has(userId)) {
      this.streams.set(userId, new Subject<NotificationEvent>());
    }

    const subject = this.streams.get(userId)!;

    // Return the stream wrapped in a self-cleaning lifecycle handler
    return subject.asObservable().pipe(
      finalize(() => {
        // finalize() runs automatically whenever ANY tab unsubscribes/disconnects
        // ONLY delete the stream if NO other tabs/devices are listening
        if (subject && !subject.observed) {
          this.streams.delete(userId);
        }
      }),
    );
  }
}
