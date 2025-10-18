import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { ServiceProvider } from './serviceProvider.model';
import { IServiceProvider } from './serviceProvider.interface';
import { ServiceProviderService } from './serviceProvider.service';

export class ServiceProviderController extends GenericController<
  typeof ServiceProvider,
  IServiceProvider
> {
  ServiceProviderService = new ServiceProviderService();

  constructor() {
    super(new ServiceProviderService(), 'ServiceProvider');
  }

  create = catchAsync(async (req: Request, res: Response) => {
    const data:ICreateServiceCategory = req.body;
    
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



    const result = await this.service.create(data);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });


  // add more methods here if needed or override the existing ones 
}
