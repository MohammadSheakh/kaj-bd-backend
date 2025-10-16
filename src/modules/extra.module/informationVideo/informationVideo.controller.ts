import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { informationVideo } from './informationVideo.model';
import { IinformationVideo } from './informationVideo.interface';
import { informationVideoService } from './informationVideo.service';
import { processFiles } from '../../../helpers/processFilesToUpload';
import { TFolderName } from '../../../enums/folderNames';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';
import { TUser } from '../../user.module/user/user.interface';
import { IUser } from '../../token/token.interface';
import { TSubscription } from '../../../enums/subscription';


export class informationVideoController extends GenericController<
  typeof informationVideo,
  IinformationVideo
> {
  informationVideoService = new informationVideoService();

  constructor() {
    super(new informationVideoService(), 'informationVideo');
  }

  createWithAttachments = catchAsync(async (req: Request, res: Response) => {
    
    const data:IinformationVideo = req.body;
  
    //📈⚙️ OPTIMIZATION: Process all file upload in parallel
    const [thumbnail, video ] = await Promise.all([
      
      (!data.videoLink) 
      ? processFiles(req.files?.thumbnail , TFolderName.informationVideo)
      : Promise.resolve([]),

      (!data.videoLink) 
      ? processFiles(req.files?.video , TFolderName.informationVideo)
      : Promise.resolve([]),
    ]);

    data.thumbnail = thumbnail;
    data.video = video;

    data.createdBy = (req.user as any).userId;


    const result = await this.service.create(data);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });


  //---------------------------------
  // Specialist | 
  //---------------------------------
  getAllWithPagination = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    

    const populateOptions: (string | {path: string, select: string}[]) = [
      {
        path: 'video',
        select: 'attachment attachmentType' 
      },
      // 'personId'
      {
        path: 'thumbnail',
        select: 'attachment attachmentType',
        // populate: {
        //   path: '',
        // }
      }
    ];

    const select = '-isDeleted -createdAt -updatedAt -__v'; 

    const result = await this.service.getAllWithPagination(filters, options, populateOptions , select );

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });


  //---------------------------------
  // Patient | Landing Page | Information video  
  // only subscription -> (standard  + above) patient can view the video
  //---------------------------------

  getAllWithPaginationForPatient = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    const populateOptions: (string | {path: string, select: string}[]) = [];
    // const select = ''; 

    let result = null;
    if(req.user && (req.user as IUser).subscriptionPlan != TSubscription.none){

      result = await this.service.getAllWithPagination(filters, options, populateOptions/*, select*/);

    }else{
      result = null;
    }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });


  
  // add more methods here if needed or override the existing ones 
}
