//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { ContactUs } from './contactUs.model';
import { IContactUs } from './contactUs.interface';
import { GenericService } from '../../_generic-module/generic.services';


export class ContactUsService extends GenericService<
  typeof ContactUs,
  IContactUs
> {
  constructor() {
    super(ContactUs);
  }

  async createOrUpdateContactUs( payload: any) {
    
    // Find existing setting by type
    const existingSetting = await ContactUs.find();

    if (existingSetting.length === 0) {
      return await ContactUs.create(payload);
    }

    return await ContactUs.findByIdAndUpdate(
      existingSetting[0]._id,
      payload,
      { new: true }
    );
  }
}
