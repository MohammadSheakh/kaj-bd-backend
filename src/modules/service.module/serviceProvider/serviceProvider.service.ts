//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { ServiceProvider } from './serviceProvider.model';
import { IServiceProvider } from './serviceProvider.interface';
import { GenericService } from '../../_generic-module/generic.services';
import { UserProfile } from '../../user.module/userProfile/userProfile.model';

//-----------------------------
// ServiceProvider means Service Provider Details
//-----------------------------
export class ServiceProviderService extends GenericService<
  typeof ServiceProvider,
  IServiceProvider
> {
  constructor() {
    super(ServiceProvider);
  }

  detailsAndNIDImagesFromUserProfile = async (userProfileId: string) => {
    const serviceProvider = await ServiceProvider.findOne({
      providerId: userProfileId,
    })
    .select('serviceName attachmentsForGallery yearsOfExperience startPrice introOrBio description')
    .populate([
      {
        path: "serviceCategoryId",
        select: "name"
      },
      { 
        path: 'attachmentsForGallery', 
        select: 'attachment attachmentType'
      },]
    )
    .lean();

    // console.log('serviceProvider: ', serviceProvider);

    const userProfile = await UserProfile.findOne({
      userId : userProfileId
    }).select('frontSideCertificateImage backSideCertificateImage faceImageFromFrontCam').populate(
      {
        path: 'frontSideCertificateImage backSideCertificateImage faceImageFromFrontCam',
        select: 'attachment',
      }
    ).lean();

    console.log('userProfile: ', userProfile);

    return {
      serviceProvider,
      userProfile
    };
  };
}
