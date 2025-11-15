//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { AdminPercentage } from './adminPercentage.model';
import { IAdminPercentage } from './adminPercentage.interface';
import { GenericService } from '../_generic-module/generic.services';


export class AdminPercentageService extends GenericService<
  typeof AdminPercentage,
  IAdminPercentage
> {
  constructor() {
    super(AdminPercentage);
  }

  async createOrUpdateAdminPercentage(payload: any) {
    
    // Find existing setting by type
    const existingAdminPercentage : IAdminPercentage = await AdminPercentage.findOne({ isDeleted: false });
    if (existingAdminPercentage) {
      // existingSetting.set(payload.details); // ISSUE : not working ..
      existingAdminPercentage.percentage = payload.percentage;

      return await existingAdminPercentage.save();

    } else {
      // Ensure payload contains the correct type

      return await AdminPercentage.create(payload);
    }
  }


}
