import { BasePaginator } from './BasePaginator';
import type { PaginationQueryParams, PaginationQueryReturnValue, PaginatorOptions } from './BasePaginator';
import type { ReminderFilters, ReminderResponse, ReminderSort } from '../types';
import type { StreamChat } from '../client';
export declare class ReminderPaginator extends BasePaginator<ReminderResponse> {
    private client;
    protected _filters: ReminderFilters | undefined;
    protected _sort: ReminderSort | undefined;
    get filters(): ReminderFilters | undefined;
    get sort(): ReminderSort | undefined;
    set filters(filters: ReminderFilters | undefined);
    set sort(sort: ReminderSort | undefined);
    constructor(client: StreamChat, options?: PaginatorOptions);
    query: ({ direction, }: PaginationQueryParams) => Promise<PaginationQueryReturnValue<ReminderResponse>>;
    filterQueryResults: (items: ReminderResponse[]) => ReminderResponse[];
}
