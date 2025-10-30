//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { SettingsService } from './settings.service';
import sendResponse from '../../../shared/sendResponse';
import { capitalizeFirstLetter } from '../../../utils/capitalize';
import ApiError from '../../../errors/ApiError';
import { settingsType } from './settings.constant';
import { AttachmentService } from '../../attachments/attachment.service';
//@ts-ignore
import { Request, Response} from 'express';

const settingsService = new SettingsService();

const allowedTypes = [
  settingsType.aboutUs,
  settingsType.contactUs,
  settingsType.privacyPolicy,
  settingsType.termsAndConditions,
  settingsType.introductionVideo
];

//----------------------------------
// Admin | Upload Introduction video
//----------------------------------
const createOrUpdateSettings = catchAsync(async (req: Request, res: Response) => {
 
  if (!req.query.type) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Type is required');
  }
  if(!allowedTypes.includes(req.query.type)){
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid type .. Allowed types are ${allowedTypes.join(', ')}`);
  }
  
  const result = await settingsService.createOrUpdateSettings(
    req.query.type,
    req.body
  );

  sendResponse(res, {
    code: StatusCodes.OK,
    message: `${capitalizeFirstLetter(req.query.type?.toString())} updated successfully`,
    data: result
  });
});



const getDetailsByType = catchAsync(async (req: Request, res: Response) => {

  if (!req.query.type) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Type is required');
  }
  if(!allowedTypes.includes(req.query.type)){
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid type .. Allowed types are ${allowedTypes.join(', ')}`);
  }

  const result = await settingsService.getDetailsByType(req.query.type);

  sendResponse(res, {
    code: StatusCodes.OK,
    message: `${capitalizeFirstLetter(req.query.type?.toString())} fetched successfully`,
    data: result,
  });
});

export const SettingsController = {
  createOrUpdateSettings,
  getDetailsByType,
};
