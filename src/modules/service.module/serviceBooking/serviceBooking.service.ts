import { StatusCodes } from 'http-status-codes';
import { ServiceBooking } from './ServiceBooking.model';
import { IServiceBooking } from './ServiceBooking.interface';
import { GenericService } from '../_generic-module/generic.services';


export class ServiceBookingService extends GenericService<
  typeof ServiceBooking,
  IServiceBooking
> {
  constructor() {
    super(ServiceBooking);
  }
}
