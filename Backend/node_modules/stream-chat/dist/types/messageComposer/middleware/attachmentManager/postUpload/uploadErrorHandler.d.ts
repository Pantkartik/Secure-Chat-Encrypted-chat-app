import type { MessageComposer } from '../../../messageComposer';
import type { AttachmentPostUploadMiddleware } from '../types';
export declare const createUploadErrorHandlerMiddleware: (composer: MessageComposer) => AttachmentPostUploadMiddleware;
