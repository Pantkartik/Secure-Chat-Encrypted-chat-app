import type { MessageComposer } from '../../../messageComposer';
import type { AttachmentPreUploadMiddleware } from '../types';
export declare const createBlockedAttachmentUploadNotificationMiddleware: (composer: MessageComposer) => AttachmentPreUploadMiddleware;
