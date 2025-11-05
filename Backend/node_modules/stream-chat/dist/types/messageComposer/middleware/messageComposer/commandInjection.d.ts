import type { MessageComposer } from '../../messageComposer';
import type { MessageCompositionMiddleware, MessageDraftCompositionMiddleware } from '../messageComposer/types';
export declare const createCommandInjectionMiddleware: (composer: MessageComposer) => MessageCompositionMiddleware;
export declare const createDraftCommandInjectionMiddleware: (composer: MessageComposer) => MessageDraftCompositionMiddleware;
