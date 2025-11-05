import { MiddlewareExecutor } from '../../../../middleware';
import type { AttachmentPreUploadMiddlewareExecutorOptions, AttachmentPreUploadMiddlewareState } from '../types';
export declare class AttachmentPreUploadMiddlewareExecutor extends MiddlewareExecutor<AttachmentPreUploadMiddlewareState, 'prepare'> {
    constructor({ composer }: AttachmentPreUploadMiddlewareExecutorOptions);
}
