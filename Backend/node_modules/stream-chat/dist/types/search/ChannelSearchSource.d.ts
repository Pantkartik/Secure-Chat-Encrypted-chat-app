import { BaseSearchSource } from './BaseSearchSource';
import type { FilterBuilderOptions } from '../pagination';
import { FilterBuilder } from '../pagination';
import type { Channel } from '../channel';
import type { StreamChat } from '../client';
import type { ChannelFilters, ChannelOptions, ChannelSort } from '../types';
import type { SearchSourceOptions } from './types';
type CustomContext = Record<string, unknown>;
export type ChannelSearchSourceFilterBuilderContext<C extends CustomContext = CustomContext> = {
    searchQuery?: string;
} & C;
export declare class ChannelSearchSource<TFilterContext extends CustomContext = CustomContext> extends BaseSearchSource<Channel> {
    readonly type = "channels";
    client: StreamChat;
    filters: ChannelFilters | undefined;
    sort: ChannelSort | undefined;
    searchOptions: Omit<ChannelOptions, 'limit' | 'offset'> | undefined;
    filterBuilder: FilterBuilder<ChannelFilters, ChannelSearchSourceFilterBuilderContext<TFilterContext>>;
    constructor(client: StreamChat, options?: SearchSourceOptions, filterBuilderOptions?: FilterBuilderOptions<ChannelFilters, ChannelSearchSourceFilterBuilderContext<TFilterContext>>);
    protected query(searchQuery: string): Promise<{
        items: Channel[];
    }>;
    protected filterQueryResults(items: Channel[]): Channel[];
}
export {};
