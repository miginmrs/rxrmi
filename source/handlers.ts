import { CtxH, Ref, EHConstraint } from './types';
import { DeepDestructable, TypedDestructable } from './destructable';
import { asyncDepMap } from 'dependent-type/dist/cjs/map';
import { toCond } from '../utils/guards';

/** @summary Filters X by C */
export declare const F_F: unique symbol;
/** @summary Returns constant C */
export declare const F_C: unique symbol;
/** @summary Identity */
export declare const F_ID: unique symbol;

export declare const F_ArrArgs: unique symbol;
export declare const F_Destructable: unique symbol;
export declare const F_Ref: unique symbol;

type ToRef<X extends any[]> = Ref<any>[] & { [P in number & keyof X]: Ref<X[P]> };
declare module 'dependent-type' {
  export interface TypeFuncs<C, X> {
    [F_F]: X extends C ? X : BadApp<Fun<typeof F_F, C>, X>;
    [F_C]: C,
    [F_ID]: X,
    [F_ArrArgs]: X extends any[] ? ToRef<X> : BadApp<Fun<typeof F_ArrArgs, C>, X>,
    [F_Destructable]: TypedDestructable<C[0 & keyof C][X & keyof C[0 & keyof C]], C[1 & keyof C], C[2 & keyof C]>,
    [F_Ref]: Ref<C[X & keyof C]>,
  }
}


export declare const F_Any: unique symbol;

declare module 'dependent-type' {
  export interface TypeFuncs<C, X> {
    [F_Any]: any,
  }
}


export type ArrayCim = { T: [never, Ref<any>[]], V: [never, any[]], C: [null, null], D: [null, null], A: [never, any[]] };
export type ArrayTypeKeys = { T: typeof F_ArrArgs, V: typeof F_ID, C: typeof F_C, D: typeof F_C, A: typeof F_ID };

const ArrayCtr = <X extends any[]>(x: X) => x
export { ArrayCtr };

export const ArrayHandler = <EH extends EHConstraint<EH, ECtx>, ECtx>(): CtxH<any[], ArrayCim, ArrayTypeKeys, EH, ECtx> => ({
  decode: ({ deref }) => (_id, data) => ({ args: data.map(ref => deref(ref)) as any, data: null }),
  encode: ({ ref }) => async <C extends any[]>({ args }: { args: DeepDestructable<C, EH, ECtx> }) => toCond<any[], C, ToRef<C>, any>(
    await asyncDepMap<number & keyof C, [
      [[C, EH, ECtx], TypedDestructable<C[number], EH, ECtx>],
      [C, Ref<C[number]>]
    ], [typeof F_Destructable, typeof F_Ref]>(args, ref)),
  ctr: ArrayCtr,
});

export type Json = null | number | string | Json[] | { [k in string]: Json };
export type JsonObject = Json[] | { [k in string]: Json };
export type JsonCim = { T: [never, JsonObject], V: [never, JsonObject], C: [null, null], D: [never, JsonObject], A: [[], []] };
export type JsonTypeKeys = { T: typeof F_ID, V: typeof F_ID, C: typeof F_C, D: typeof F_ID, A: typeof F_C };
const JsonCtr = <X extends JsonObject>(_: [], data: X) => data;
export { JsonCtr };
export const JsonHandler = <EH extends EHConstraint<EH, ECtx>, ECtx>(): CtxH<JsonObject, JsonCim, JsonTypeKeys, EH, ECtx> => ({
  decode: () => (_id, data) => ({ args: [] as [], data }),
  encode: () => ({ data }) => data,
  ctr: JsonCtr,
});
