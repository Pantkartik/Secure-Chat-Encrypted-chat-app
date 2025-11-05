/**
 * RULES:
 *
 * 1. one loc-sharing message per channel per user
 * 2. live location is intended to be per device
 * but created_by_device_id has currently no checks,
 * and user can update the location from another device
 * thus making location sharing based on user and channel
 */
import { StateStore } from './store';
import { WithSubscriptions } from './utils/WithSubscriptions';
import type { StreamChat } from './client';
import type { Unsubscribe } from './store';
import type { SharedLiveLocationResponse } from './types';
import type { Coords } from './messageComposer';
export type WatchLocationHandler = (value: Coords) => void;
export type WatchLocation = (handler: WatchLocationHandler) => Unsubscribe;
type DeviceIdGenerator = () => string;
type MessageId = string;
export type ScheduledLiveLocationSharing = SharedLiveLocationResponse & {
    stopSharingTimeout: ReturnType<typeof setTimeout> | null;
};
export type LiveLocationManagerState = {
    ready: boolean;
    messages: Map<MessageId, ScheduledLiveLocationSharing>;
};
export type LiveLocationManagerConstructorParameters = {
    client: StreamChat;
    getDeviceId: DeviceIdGenerator;
    watchLocation: WatchLocation;
};
export declare const UPDATE_LIVE_LOCATION_REQUEST_MIN_THROTTLE_TIMEOUT = 3000;
export declare class LiveLocationManager extends WithSubscriptions {
    state: StateStore<LiveLocationManagerState>;
    private client;
    private getDeviceId;
    private _deviceId;
    private watchLocation;
    static symbol: symbol;
    constructor({ client, getDeviceId, watchLocation, }: LiveLocationManagerConstructorParameters);
    init(): Promise<void>;
    registerSubscriptions: () => void;
    unregisterSubscriptions: () => symbol;
    get messages(): Map<string, ScheduledLiveLocationSharing>;
    get stateIsReady(): boolean;
    get deviceId(): string;
    private assureStateInit;
    private subscribeTargetMessagesChange;
    private subscribeWatchLocation;
    private subscribeLiveLocationSharingUpdates;
    private registerMessage;
    private unregisterMessages;
}
export {};
