import type { Middleware } from '../../../middleware';
import type { TextComposerMiddlewareExecutorState } from './TextComposerMiddlewareExecutor';
export type PreCommandMiddleware = Middleware<TextComposerMiddlewareExecutorState, 'onChange' | 'onSuggestionItemSelect'>;
export declare const createActiveCommandGuardMiddleware: () => PreCommandMiddleware;
