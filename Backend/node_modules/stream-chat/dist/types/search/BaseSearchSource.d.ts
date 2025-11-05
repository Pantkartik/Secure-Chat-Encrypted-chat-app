import { StateStore } from '../store';
import { type DebouncedFunc } from '../utils';
import type { QueryReturnValue, SearchSourceOptions, SearchSourceState, SearchSourceType } from './types';
export type DebounceOptions = {
    debounceMs: number;
};
type DebouncedExecQueryFunction = DebouncedFunc<(searchString?: string) => Promise<void>>;
interface ISearchSource<T = any> {
    activate(): void;
    canExecuteQuery(newSearchString?: string): boolean;
    deactivate(): void;
    readonly hasNext: boolean;
    readonly hasResults: boolean;
    readonly initialState: SearchSourceState<T>;
    readonly isActive: boolean;
    readonly isLoading: boolean;
    readonly items: T[] | undefined;
    readonly lastQueryError: Error | undefined;
    readonly next: string | undefined | null;
    readonly offset: number | undefined;
    resetState(): void;
    readonly searchQuery: string;
    readonly state: StateStore<SearchSourceState<T>>;
    readonly type: SearchSourceType;
}
export interface SearchSource<T = any> extends ISearchSource<T> {
    cancelScheduledQuery(): void;
    setDebounceOptions(options: DebounceOptions): void;
    search(text?: string): Promise<void> | undefined;
}
export interface SearchSourceSync<T = any> extends ISearchSource<T> {
    cancelScheduledQuery(): void;
    setDebounceOptions(options: DebounceOptions): void;
    search(text?: string): void;
}
declare abstract class BaseSearchSourceBase<T> implements ISearchSource<T> {
    state: StateStore<SearchSourceState<T>>;
    pageSize: number;
    abstract readonly type: SearchSourceType;
    protected constructor(options?: SearchSourceOptions);
    get lastQueryError(): Error | undefined;
    get hasNext(): boolean;
    get hasResults(): boolean;
    get isActive(): boolean;
    get isLoading(): boolean;
    get initialState(): {
        hasNext: boolean;
        isActive: boolean;
        isLoading: boolean;
        items: undefined;
        lastQueryError: undefined;
        next: undefined;
        offset: number;
        searchQuery: string;
    };
    get items(): T[] | undefined;
    get next(): string | null | undefined;
    get offset(): number | undefined;
    get searchQuery(): string;
    activate: () => void;
    deactivate: () => void;
    canExecuteQuery: (newSearchString?: string) => boolean;
    protected getStateBeforeFirstQuery(newSearchString: string): SearchSourceState<T>;
    protected getStateAfterQuery(stateUpdate: Partial<SearchSourceState<T>>, isFirstPage: boolean): SearchSourceState<T>;
    protected prepareStateForQuery(newSearchString?: string): {
        searchString: string;
        hasNewSearchQuery: boolean;
    };
    protected updatePaginationStateFromQuery(result: QueryReturnValue<T>): Partial<SearchSourceState<T>>;
    resetState(): void;
    resetStateAndActivate(): void;
}
export declare abstract class BaseSearchSource<T> extends BaseSearchSourceBase<T> implements SearchSource<T> {
    protected searchDebounced: DebouncedExecQueryFunction;
    constructor(options?: SearchSourceOptions);
    protected abstract query(searchQuery: string): Promise<QueryReturnValue<T>>;
    protected abstract filterQueryResults(items: T[]): T[] | Promise<T[]>;
    setDebounceOptions: ({ debounceMs }: DebounceOptions) => void;
    executeQuery(newSearchString?: string): Promise<void>;
    search: (searchQuery?: string) => Promise<void> | undefined;
    cancelScheduledQuery(): void;
}
export declare abstract class BaseSearchSourceSync<T> extends BaseSearchSourceBase<T> implements SearchSourceSync<T> {
    protected searchDebounced: DebouncedExecQueryFunction;
    constructor(options?: SearchSourceOptions);
    protected abstract query(searchQuery: string): QueryReturnValue<T>;
    protected abstract filterQueryResults(items: T[]): T[];
    setDebounceOptions: ({ debounceMs }: DebounceOptions) => void;
    executeQuery(newSearchString?: string): void;
    search: (searchQuery?: string) => Promise<void> | undefined;
    cancelScheduledQuery(): void;
}
export {};
