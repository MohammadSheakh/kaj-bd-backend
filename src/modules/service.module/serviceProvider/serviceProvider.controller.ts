import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { ServiceProvider } from './serviceProvider.model';
import { ICreateServiceProvider, IServiceProvider } from './serviceProvider.interface';
import { ServiceProviderService } from './serviceProvider.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IUser } from '../../token/token.interface';
import { buildTranslatedField } from '../../../utils/buildTranslatedField';

export class ServiceProviderController extends GenericController<
  typeof ServiceProvider,
  IServiceProvider
> {
  ServiceProviderService = new ServiceProviderService();

  constructor() {
    super(new ServiceProviderService(), 'ServiceProvider');
  }

  create = catchAsync(async (req: Request, res: Response) => {
    const data:ICreateServiceProvider = req.body;
    data.providerId = (req.user as IUser).userId;

    // 🥇
    // Translate multiple properties dynamically
    const [nameObj] : [IServiceProvider['serviceName']]  = await Promise.all([
      buildTranslatedField(data.serviceName as string)
    ]);

    data.serviceName = nameObj;

    /*------------------- We move all these code to function for DRY Principal
    const cleanText = data.name.trim();
    if (cleanText.length < 3) {
      // too short → use user.language
    }

    // 🔍 Detect actual language of the review text
    let detectedLang = detectLanguage(data.name);
    const originalLang = detectedLang || 'en'; // fallback

    // Fallback: if unknown, use user's profile language
    if (detectedLang === 'unknown') {
      const user = await User.findById(req.user.userId);
      detectedLang = user?.language || 'en';
    }

    const nameObj = {
      en: '',
      bn: ''
    };


    // 3. Set original
    nameObj[originalLang] = cleanText; // which is detected lang

    // 4. Translate to the other language
    const otherLang = originalLang === 'en' ? 'bn' : 'en';
    nameObj[otherLang] = await translateTextToTargetLang(
      data.name,
      otherLang
    );

    // 5. Save to DB
    const newReview = new ServiceCategory({
      name: nameObj,
      createdBy : "admin", // TODO : 
      createdByUserId : req.body.userId,
    });
    
    await newReview.save();
    */

    const result = await this.service.create(data as Partial<IServiceProvider>);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });

  // add more methods here if needed or override the existing ones 
}
