import { BaseSearchSource } from './BaseSearchSource';
import type { ChannelFilters, ChannelOptions, ChannelSort, MessageFilters, MessageResponse, SearchMessageSort } from '../types';
import type { StreamChat } from '../client';
import type { SearchSourceOptions } from './types';
import { FilterBuilder, type FilterBuilderOptions } from '../pagination';
type CustomContext = Record<string, unknown>;
type BuiltInContexts = {
    messageSearchChannel: {
        searchQuery?: string;
    };
    messageSearch: {
        searchQuery?: string;
    };
    channelQuery: {
        cids?: string[];
    };
};
type MergeContext<B extends Record<string, unknown>, C extends CustomContext | undefined> = B & (C extends object ? C : {});
type MessageSearchSourceContexts = Partial<{
    messageSearchChannelContext: Record<string, unknown>;
    messageSearchContext: Record<string, unknown>;
    channelQueryContext: Record<string, unknown>;
}>;
export type MessageSearchSourceFilterBuilderOptions<TContexts extends MessageSearchSourceContexts = {}> = Partial<{
    messageSearchChannel: FilterBuilderOptions<ChannelFilters, MergeContext<BuiltInContexts['messageSearchChannel'], TContexts['messageSearchChannelContext']>>;
    messageSearch: FilterBuilderOptions<MessageFilters, MergeContext<BuiltInContexts['messageSearch'], TContexts['messageSearchContext']>>;
    channelQuery: FilterBuilderOptions<ChannelFilters, MergeContext<BuiltInContexts['channelQuery'], TContexts['channelQueryContext']>>;
}>;
export declare class MessageSearchSource<TContexts extends MessageSearchSourceContexts = {}> extends BaseSearchSource<MessageResponse> {
    readonly type = "messages";
    private client;
    messageSearchChannelFilters: ChannelFilters | undefined;
    messageSearchFilters: MessageFilters | undefined;
    messageSearchSort: SearchMessageSort | undefined;
    channelQueryFilters: ChannelFilters | undefined;
    channelQuerySort: ChannelSort | undefined;
    channelQueryOptions: Omit<ChannelOptions, 'limit' | 'offset'> | undefined;
    messageSearchChannelFilterBuilder: FilterBuilder<ChannelFilters, MergeContext<BuiltInContexts['messageSearchChannel'], TContexts['messageSearchChannelContext']>>;
    messageSearchFilterBuilder: FilterBuilder<MessageFilters, MergeContext<BuiltInContexts['messageSearch'], TContexts['messageSearchContext']>>;
    channelQueryFilterBuilder: FilterBuilder<ChannelFilters, MergeContext<BuiltInContexts['channelQuery'], TContexts['channelQueryContext']>>;
    constructor(client: StreamChat, options?: SearchSourceOptions, filterBuilderOptions?: MessageSearchSourceFilterBuilderOptions<TContexts>);
    protected query(searchQuery: string): Promise<{
        items: never[];
        next?: undefined;
    } | {
        items: MessageResponse[];
        next: string | undefined;
    }>;
    protected filterQueryResults(items: MessageResponse[]): MessageResponse[];
}
export {};
