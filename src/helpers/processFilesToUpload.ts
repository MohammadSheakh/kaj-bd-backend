import { TFolderName } from "../enums/folderNames";
import { AttachmentService } from "../modules/attachments/attachment.service";
//@ts-ignore
import { Types } from 'mongoose';

export async function processFiles(files: any[], folderName: TFolderName): Promise<Types.ObjectId[]> {
    if (!files || files.length === 0) return [];

    // All files upload in parallel
    const uploadPromises = files.map(file => 
        new AttachmentService().uploadSingleAttachment(file, folderName)
    );

    return await Promise.all(uploadPromises);
}

