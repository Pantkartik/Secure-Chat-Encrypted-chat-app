import { MiddlewareExecutor } from '../../../../middleware';
import type { AttachmentPostUploadMiddlewareExecutorOptions, AttachmentPostUploadMiddlewareState } from '../types';
export declare class AttachmentPostUploadMiddlewareExecutor extends MiddlewareExecutor<AttachmentPostUploadMiddlewareState, 'postProcess'> {
    constructor({ composer }: AttachmentPostUploadMiddlewareExecutorOptions);
}
