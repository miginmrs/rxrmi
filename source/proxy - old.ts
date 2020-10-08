import { Store } from "./store";
import { Subject, Subscription } from "rxjs";
import { filter, take } from "rxjs/operators";
import { GlobalRef, RHConstraint, CallHandler, Json, TVCDADepConstaint, TVCDA_CIM, FdcpConstraint, FkxConstraint, FIDS } from "./types";
import { QuickPromise } from "../utils/quick-promise";

export type DataGram<T extends string> = { channel: number, type: T, data: string };

export type msg1to2 = 'put' | 'unsubscribe' | 'error' | 'complete' | 'call' | 'end_call';
export type msg2to1 = 'response_put' | 'response_call' | 'call_error' | 'call_complete';

export const startListener = <RH extends RHConstraint<RH, ECtx>, ECtx, fIds extends FIDS, fdcp extends FdcpConstraint<fIds>, fkx extends FkxConstraint<fIds, fdcp>>(
  store: Store<RH, ECtx, fIds, fdcp, fkx>,
  from: Subject<DataGram<msg1to2>>,
  to: Subject<DataGram<msg2to1>>,
) => from.subscribe(function (this: Subscription, { channel, type, data }) {
  switch (type) {
    case 'put': {
      const refs = store.unserialize(JSON.parse(data))!
      return to.next({ channel, type: 'response_put', data: JSON.stringify(refs) });
    }
    case 'unsubscribe':
      return store.get(JSON.parse(data))?.[1].subscription?.unsubscribe()
    case 'error': {
      const { id, msg } = JSON.parse(data);
      const obs = store.get(id)?.[0];
      if (!obs) return;
      return (obs as typeof obs.origin).subject.error(msg);
    }
    case 'complete': {
      const obs = store.get(JSON.parse(data))?.[0];
      if (!obs) return;
      return (obs as typeof obs.origin).subject.complete();
    }
    case 'call': {
      const { fId, param, argId, opt } = JSON.parse(data);
      const obs = store.local(fId, param, { id: argId } as GlobalRef<any>, opt);
      const endCallSubs = from.pipe(filter(x => x.channel === channel && x.type === 'end_call')).subscribe(() => {
        subs.unsubscribe();
      });
      const subs = obs.subscribe(def => {
        to.next({ channel, type: 'response_call', data: JSON.stringify(def) });
      }, err => {
        to.next({ channel, type: 'call_error', data: JSON.stringify(err) });
      }, () => {
        to.next({ channel, type: 'call_complete', data: '' });
      });
      subs.add(endCallSubs);
      this.add(subs);
      return;
    }
  };
});


export const createCallHandler = <RH extends RHConstraint<RH, ECtx>, ECtx, fIds extends FIDS, fdcp extends FdcpConstraint<fIds>, fkx extends FkxConstraint<fIds, fdcp>>(
  to: Subject<DataGram<msg1to2>>,
  from: Subject<DataGram<msg2to1>>,
  channel: [number]
): CallHandler<RH, ECtx, fIds, fdcp, fkx> => {
  return {
    serialized: new WeakMap(),
    handlers: () => {
      const callChannel = channel[0]++;
      return {
        end_call: () => to.next({ channel: callChannel, type: 'end_call', data: '' }),
        unsubscribe: ref => to.next({ channel: callChannel, data: JSON.stringify(ref.id), type: 'unsubscribe' }),
        complete: ref => to.next({ channel: callChannel, data: JSON.stringify(ref.id), type: 'complete' }),
        put: (def) => {
          const ch = channel[0]++;
          const promise = from.pipe(filter(m => m.channel === ch), take(1)).toPromise(QuickPromise).then(response => {
            if (response.type !== 'response_put') throw new Error('Unexpected put response message');
            return JSON.parse(response.data);
          });
          to.next({ channel: ch, type: 'put', data: JSON.stringify(def) })
          return promise;
        },
        call: (fId, param, ref, opt) => to.next({ channel: callChannel, data: JSON.stringify({ fId, param, argId: ref.id, opt }), type: 'call' }),
        error: (ref, e) => to.next({ channel: callChannel, data: JSON.stringify({ id: ref.id, msg: `${e}` }), type: 'error' }),
        subscribeToResult: cbs => from.pipe(filter(x => x.channel === callChannel)).subscribe(
          function (this: Subscription, { data, type }) {
            if (type === 'response_call') {
              cbs.resp_call(JSON.parse(data));
            }
            if (type === 'call_error') {
              cbs.err_call(data).then(() => this.unsubscribe());
              this.unsubscribe();
            }
            if (type === 'call_complete') {
              cbs.comp_call().then(() => this.unsubscribe());
            }
          }
        )
      }
    }
  }
}