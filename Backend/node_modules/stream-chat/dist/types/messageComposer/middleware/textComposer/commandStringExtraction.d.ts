import type { TextComposerMiddlewareExecutorState } from './TextComposerMiddlewareExecutor';
import type { CommandSuggestion } from './types';
import type { Middleware } from '../../../middleware';
export type CommandStringExtractionMiddleware = Middleware<TextComposerMiddlewareExecutorState<CommandSuggestion>, 'onChange' | 'onSuggestionItemSelect'>;
export declare const createCommandStringExtractionMiddleware: () => CommandStringExtractionMiddleware;
