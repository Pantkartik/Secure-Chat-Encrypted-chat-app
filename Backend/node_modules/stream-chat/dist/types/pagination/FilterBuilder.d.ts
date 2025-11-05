import { StateStore } from '../store';
import type { ArrayOneOrMore, ArrayTwoOrMore, QueryFilter } from '../types';
type ElementType<T> = T extends (infer U)[] ? U : T;
export type ExtendedQueryFilter<T = string> = QueryFilter<T> & {
    $autocomplete?: T extends string ? string : never;
    $contains?: ElementType<T>;
    $in?: ElementType<T>[];
    $q?: T extends string ? string : never;
};
export type ExtendedQueryLogicalOperators<T> = {
    $and?: ArrayOneOrMore<ExtendedQueryFilters<T>>;
    $nor?: ArrayOneOrMore<ExtendedQueryFilters<T>>;
    $or?: ArrayTwoOrMore<ExtendedQueryFilters<T>>;
};
export type ExtendedQueryFilters<T> = {
    [K in keyof T]?: ExtendedQueryFilter<T[K]>;
} & ExtendedQueryLogicalOperators<T>;
export type FilterBuilderGenerators<TFilters, TContext extends Record<string, unknown> = {}> = {
    [K in string]: {
        enabled: boolean;
        generate: (context: TContext) => Partial<TFilters> | null;
    };
};
export type FilterBuilderOptions<TFilters, TContext extends Record<string, unknown>> = {
    initialFilterConfig?: FilterBuilderGenerators<TFilters, TContext>;
    initialContext?: TContext;
};
export declare class FilterBuilder<TFilters, TContext extends Record<string, unknown> = {}> {
    filterConfig: StateStore<FilterBuilderGenerators<TFilters, TContext>>;
    context: StateStore<TContext>;
    constructor(params?: FilterBuilderOptions<TFilters, TContext>);
    updateFilterConfig(config: Partial<FilterBuilderGenerators<TFilters, TContext>>): void;
    enableFilter(filterKey: keyof FilterBuilderGenerators<TFilters, TContext>): void;
    disableFilter(filterKey: keyof FilterBuilderGenerators<TFilters, TContext>): void;
    updateContext(newContext: Partial<TContext>): void;
    buildFilters(params?: {
        context?: Partial<TContext>;
        baseFilters?: Partial<TFilters>;
    }): Partial<TFilters>;
}
export {};
