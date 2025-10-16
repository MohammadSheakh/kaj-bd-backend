import { StatusCodes } from 'http-status-codes';
import { ServiceBooking } from './serviceBooking.model';
import { IServiceBooking } from './serviceBooking.interface';
import { GenericService } from '../../_generic-module/generic.services';

export class ServiceBookingService extends GenericService<
  typeof ServiceBooking,
  IServiceBooking
> {
  constructor() {
    super(ServiceBooking);
  }
}
