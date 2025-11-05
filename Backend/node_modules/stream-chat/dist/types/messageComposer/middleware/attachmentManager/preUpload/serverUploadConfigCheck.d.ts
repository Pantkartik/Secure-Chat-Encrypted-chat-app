import type { MessageComposer } from '../../../messageComposer';
import type { AttachmentPreUploadMiddleware } from '../types';
export declare const createUploadConfigCheckMiddleware: (composer: MessageComposer) => AttachmentPreUploadMiddleware;
