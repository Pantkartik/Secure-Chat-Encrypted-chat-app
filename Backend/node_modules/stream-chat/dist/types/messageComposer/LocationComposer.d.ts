import { StateStore } from '../store';
import type { MessageComposer } from './messageComposer';
import type { DraftMessage, LiveLocationPayload, LocalMessage, StaticLocationPayload } from '../types';
export type Coords = {
    latitude: number;
    longitude: number;
};
export type LocationComposerOptions = {
    composer: MessageComposer;
    message?: DraftMessage | LocalMessage;
};
export type StaticLocationPreview = StaticLocationPayload;
export type LiveLocationPreview = Omit<LiveLocationPayload, 'end_at'> & {
    durationMs?: number;
};
export type LocationComposerState = {
    location: StaticLocationPreview | LiveLocationPreview | null;
};
export declare class LocationComposer {
    readonly state: StateStore<LocationComposerState>;
    readonly composer: MessageComposer;
    private _deviceId;
    constructor({ composer, message }: LocationComposerOptions);
    get config(): import("..").LocationComposerConfig;
    get deviceId(): string;
    get location(): StaticLocationPayload | LiveLocationPreview | null;
    get validLocation(): StaticLocationPayload | LiveLocationPayload | null;
    initState: ({ message }?: {
        message?: DraftMessage | LocalMessage;
    }) => void;
    setData: (data: {
        durationMs?: number;
    } & Coords) => void;
}
