/// <reference path="../../../typings/deep-is.d.ts" />
import { CtxH, Ref, EHConstraint, DestructableCtr, JsonObject } from './types';
import { DeepDestructable, TypedDestructable, Destructable } from './destructable';
import type { BadApp, Fun } from 'dependent-type';
import { deref } from '.';
import { TeardownLogic } from 'rxjs';
export declare const F_F: unique symbol;
export declare const F_C: unique symbol;
export declare const F_ID: unique symbol;
export declare const F_ArrArgs: unique symbol;
export declare const F_Destructable: unique symbol;
export declare const F_Ref: unique symbol;
export declare type ToRef<X extends any[]> = Ref<any>[] & {
    [P in Exclude<keyof X, keyof any[]>]: Ref<X[P]>;
};
declare module 'dependent-type' {
    interface TypeFuncs<C, X> {
        [F_F]: X extends C ? X : BadApp<Fun<typeof F_F, C>, X>;
        [F_C]: C;
        [F_ID]: X;
        [F_ArrArgs]: X extends any[] ? ToRef<X> : BadApp<Fun<typeof F_ArrArgs, C>, X>;
        [F_Destructable]: TypedDestructable<C[0 & keyof C][X & keyof C[0 & keyof C]], C[1 & keyof C], C[2 & keyof C]>;
        [F_Ref]: Ref<C[X & keyof C]>;
    }
}
export declare const F_Any: unique symbol;
declare module 'dependent-type' {
    interface TypeFuncs<C, X> {
        [F_Any]: any;
    }
}
export declare type ArrayCim = {
    T: [never, Ref<any>[]];
    V: [never, any[]];
    C: [null, null];
    D: [null, null];
    A: [never, any[]];
};
export declare type ArrayTypeKeys = {
    T: typeof F_ArrArgs;
    V: typeof F_ID;
    C: typeof F_C;
    D: typeof F_C;
    A: typeof F_ID;
};
export declare const ArrayCtr: DestructableCtr<any[], ArrayCim, ArrayTypeKeys>;
export declare type ArrayHandler<EH extends EHConstraint<EH, ECtx>, ECtx> = CtxH<any[], ArrayCim, ArrayTypeKeys, 1, EH, ECtx>;
export declare const ArrayHandler: <EH extends EHConstraint<EH, ECtx>, ECtx>() => CtxH<any[], ArrayCim, ArrayTypeKeys, 1, EH, ECtx>;
export declare type ArrayDestructable<A extends any[], EH extends EHConstraint<EH, ECtx>, ECtx> = Destructable<any[], ArrayCim, ArrayTypeKeys, A, 1, EH, ECtx>;
export declare const wrapArray: <A extends any[], EH extends EHConstraint<EH, ECtx> & {
    Array: CtxH<any[], ArrayCim, ArrayTypeKeys, 1, EH, ECtx>;
}, ECtx>(args: DeepDestructable<A, 1, EH, ECtx>, handlers: EH, ...teardownList: TeardownLogic[]) => ArrayDestructable<A, EH, ECtx>;
export declare const toArray: <EH extends EHConstraint<EH, ECtx> & {
    Array: CtxH<any[], ArrayCim, ArrayTypeKeys, 1, EH, ECtx>;
}, ECtx>(deref: deref<EH, ECtx>) => (p: Ref<any[]>) => Destructable<any[], ArrayCim, ArrayTypeKeys, any[], 1, EH, ECtx>;
export declare type JsonCim = {
    T: [never, JsonObject];
    V: [never, JsonObject];
    C: [null, null];
    D: [never, JsonObject];
    A: [[], []];
};
export declare type JsonTypeKeys = {
    T: typeof F_ID;
    V: typeof F_ID;
    C: typeof F_C;
    D: typeof F_ID;
    A: typeof F_C;
};
export declare const JsonCtr: DestructableCtr<JsonObject, JsonCim, JsonTypeKeys>;
export declare type JsonHandler<EH extends EHConstraint<EH, ECtx>, ECtx> = CtxH<JsonObject, JsonCim, JsonTypeKeys, 1, EH, ECtx>;
export declare const JsonHandler: <EH extends EHConstraint<EH, ECtx>, ECtx>() => CtxH<JsonObject, JsonCim, JsonTypeKeys, 1, EH, ECtx>;
export declare type JsonDestructable<X extends JsonObject, EH extends EHConstraint<EH, ECtx>, ECtx> = Destructable<JsonObject, JsonCim, JsonTypeKeys, X, 1, EH, ECtx>;
export declare const wrapJson: <X extends JsonObject, EH extends EHConstraint<EH, ECtx> & {
    Json: CtxH<JsonObject, JsonCim, JsonTypeKeys, 1, EH, ECtx>;
}, ECtx>(data: X, handlers: EH, ...teardownList: TeardownLogic[]) => JsonDestructable<X, EH, ECtx>;
export declare const toJson: <EH extends EHConstraint<EH, ECtx> & {
    Json: CtxH<JsonObject, JsonCim, JsonTypeKeys, 1, EH, ECtx>;
}, ECtx>(deref: deref<EH, ECtx>) => (p: Ref<JsonObject>) => Destructable<JsonObject, JsonCim, JsonTypeKeys, JsonObject, 1, EH, ECtx>;