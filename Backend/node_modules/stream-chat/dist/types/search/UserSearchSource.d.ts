import { BaseSearchSource } from './BaseSearchSource';
import { FilterBuilder, type FilterBuilderOptions } from '../pagination';
import type { StreamChat } from '../client';
import type { UserFilters, UserOptions, UserResponse, UserSort } from '../types';
import type { SearchSourceOptions } from './types';
type CustomContext = Record<string, unknown>;
export type UserSearchSourceFilterBuilderContext<C extends CustomContext = CustomContext> = {
    searchQuery?: string;
} & C;
export declare class UserSearchSource<TFilterContext extends CustomContext = CustomContext> extends BaseSearchSource<UserResponse> {
    readonly type = "users";
    client: StreamChat;
    filters: UserFilters | undefined;
    sort: UserSort | undefined;
    searchOptions: Omit<UserOptions, 'limit' | 'offset'> | undefined;
    filterBuilder: FilterBuilder<UserFilters, UserSearchSourceFilterBuilderContext<TFilterContext>>;
    constructor(client: StreamChat, options?: SearchSourceOptions, filterBuilderOptions?: FilterBuilderOptions<UserFilters, UserSearchSourceFilterBuilderContext<TFilterContext>>);
    protected query(searchQuery: string): Promise<{
        items: UserResponse[];
    }>;
    protected filterQueryResults(items: UserResponse[]): UserResponse[];
}
export {};
