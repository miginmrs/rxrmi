import { BehaviorSubject, Observable, Subscription, TeardownLogic, OperatorFunction, NEVER, of, concat } from 'rxjs';
import { alternMap } from 'altern-map';
import { combine } from '../utils/rx-utils';
import { map, shareReplay, distinctUntilChanged, scan, tap } from 'rxjs/operators';
import { TVCDA_CIM, TVCDADepConstaint, CtxH, EHConstraint, CtxEH, DestructableCtr, RequestHandlerCompare, ObsWithOrigin } from './types';
import { AppX, KeysOfType, TypeFuncs } from 'dependent-type';
import { byKey } from '../utils/guards';
import '../utils/rx-utils'
import { F_Any } from '.';

type TwoDestructable<A extends any[], EH extends EHConstraint<EH, ECtx>, ECtx> = TypedDestructable<A[Exclude<keyof A, keyof any[]>], EH, ECtx>[] & {
  [k in Exclude<keyof A, keyof any[]>]: TypedDestructable<A[k], EH, ECtx>;
};
export type DeepDestructable<A extends any[], n extends 1 | 2, EH extends EHConstraint<EH, ECtx>, ECtx> = (n extends 1 ? TypedDestructable<A[Exclude<keyof A, keyof any[]>], EH, ECtx> : TwoDestructable<A[Exclude<keyof A, keyof any[]>] & any[], EH, ECtx>)[] & {
  [k in Exclude<keyof A, keyof any[]>]: n extends 1 ? TypedDestructable<A[k], EH, ECtx> : TwoDestructable<A[k] & any[], EH, ECtx>;
};
export type EntryObs<D, A extends any[], n extends 1 | 2, EH extends EHConstraint<EH, ECtx>, ECtx> = {
  args: DeepDestructable<A, n, EH, ECtx>, data: D, n: n
};

export const destructableCmp = <dom, cim extends TVCDA_CIM, k extends TVCDADepConstaint<dom, cim>, n extends 1 | 2, EH extends EHConstraint<EH, ECtx>, ECtx>({
  compareData = <X extends dom>(x: AppX<'D', cim, k, X>, y: AppX<'D', cim, k, X>) => x === y,
  compareObs = <X extends dom, i extends number>(x: TypedDestructable<AppX<'A', cim, k, X>[i], EH, ECtx>, y: TypedDestructable<AppX<'A', cim, k, X>[i], EH, ECtx>) => x === y
} = {}): RequestHandlerCompare<dom, cim, k, n, EH, ECtx> => <X extends dom>(
  x: EntryObs<AppX<'D', cim, k, X>, AppX<'A', cim, k, X>, n, EH, ECtx>, y: EntryObs<AppX<'D', cim, k, X>, AppX<'A', cim, k, X>, n, EH, ECtx>
) => x.args.length === y.args.length && x.args.every((v, i) => {
  type item = TypedDestructable<any, EH, ECtx> | TwoDestructable<any, EH, ECtx>;
  const vItem: item = v, yItem: item = y.args[i];
  if (vItem instanceof Array) {
    if (yItem instanceof Array) return vItem.length === yItem.length && vItem.every((x, i) => x === yItem[i]);
    return false;
  }
  if (yItem instanceof Array) return false;
  return compareObs(vItem, yItem);
}) && compareData(x.data, y.data);
export type TypedDestructable<V, EH extends EHConstraint<EH, ECtx>, ECtx> = Destructable<any, any, any, any, any, EH, ECtx> & Observable<V>;

export class Destructable<dom, cim extends TVCDA_CIM, k extends TVCDADepConstaint<dom, cim>, X extends dom, n extends 1 | 2, EH extends EHConstraint<EH, ECtx>, ECtx>
  extends Observable<AppX<'V', cim, k, X>> implements ObsWithOrigin<AppX<'V', cim, k, X>, EH, ECtx> {
  readonly subject: BehaviorSubject<EntryObs<AppX<'D', cim, k, X>, AppX<'A', cim, k, X>, n, EH, ECtx>>;
  private destroy: Subscription
  get destroyed() { return this.destroy.closed }
  source: Observable<AppX<'V', cim, k, X>>;
  readonly origin = this;
  readonly parent = this;
  get handler(): CtxEH<dom, cim, k, n, EH, ECtx> {
    return byKey<EHConstraint<EH, ECtx>, CtxEH<dom, cim, k, n, EH, ECtx>>(this.handlers, this.key);
  }
  constructor(
    readonly handlers: EH,
    readonly key: KeysOfType<EHConstraint<EH, ECtx>, CtxEH<dom, cim, k, n, EH, ECtx>> & string,
    readonly c: AppX<'C', cim, k, X>,
    init: EntryObs<AppX<'D', cim, k, X>, AppX<'A', cim, k, X>, n, EH, ECtx>,
    compare = destructableCmp<dom, cim, k, n, EH, ECtx>(),
    ...teardownList: TeardownLogic[]
  ) {
    super();
    type V = AppX<'V', cim, k, X>;
    type C = AppX<'C', cim, k, X>;
    type D = AppX<'D', cim, k, X>;
    type A = AppX<'A', cim, k, X>;
    const handler = this.handler;
    this.subject = new BehaviorSubject(init);
    this.destroy = new Subscription(() => {
      if (!this.subject.isStopped) this.subject.unsubscribe();
      else this.subject.closed = true;
    });
    teardownList.forEach(cb => this.destroy.add(cb));
    this.source = new Observable<V>(subscriber => {
      const subs = this.subject.pipe(
        distinctUntilChanged(compare),
        alternMap(({ args, data, n }) => {
          const array = n === 2 ? args.filter(a => !(a instanceof Array) || a.length !== 0).map(args => combine(args)) : args;
          return (array.length ? combine(array) as Observable<A> : concat(of([]), NEVER)).pipe(
            map(args => [args, data, c] as [A, D, C]),
          )
        }, { completeWithInner: true, completeWithSource: true }),
        tap(undefined, undefined, () => this.subject.complete()),
        scan<[A, D, C], V, null>((old, [args, data, c]) => handler.ctr(args, data, c, old), null)
      ).subscribe(subscriber);
      subs.add(this.destroy);
      return subs;
    });
    this.operator = shareReplay({ bufferSize: 1, refCount: true })(this).operator;
  }
}
