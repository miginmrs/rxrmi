import { combineLatest, of, TeardownLogic, Subscriber, Observable, Subscription, OperatorFunction, concat, NEVER } from 'rxjs';
import type { CombineLatestSubscriber } from 'rxjs/internal/observable/combineLatest';
import { CombineLatestOperator } from 'rxjs/internal/observable/combineLatest';

declare module 'rxjs/operators' {
  export function scan<T, R, V>(accumulator: (acc: R | V, value: T, index: number) => R, seed: V): OperatorFunction<T, R>;
}

class CompleteDestination<T> extends Subscriber<T> {
  notifyComplete() { this.destination.complete?.(); }
}

/** Like combineLatest but emits if the array of observables is empty 
 * and completes when and only when one observable completes */
export const eagerCombineAll: typeof combineLatest = function (this: any, ...args: any[]) {
  if (args.length === 0 || args.length === 1 && args[0] instanceof Array && args[0].length === 0) return concat(of([]), NEVER);
  const obs = combineLatest.apply(this, args);
  (obs.operator as CombineLatestOperator<any, any>).call = function (sink, source) {
    const subscriber: CombineLatestSubscriber<any, any> = CombineLatestOperator.prototype.call(sink, source);
    subscriber.notifyComplete = CompleteDestination.prototype.notifyComplete;
  }
  return obs;
} as any;

export function current<T>(obs: Observable<T>, value: T): T;
export function current<T>(obs: Observable<T | undefined>, value?: T | undefined): T | undefined;
export function current<T>(obs: Observable<T>, value: T) {
  obs.subscribe(v => value = v).unsubscribe();
  return value;
}