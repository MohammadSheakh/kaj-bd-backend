import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { ServiceBooking } from './serviceBooking.model';
import { IServiceBooking } from './serviceBooking.interface';
import { ServiceBookingService } from './serviceBooking.service';

export class ServiceBookingController extends GenericController<
  typeof ServiceBooking,
  IServiceBooking
> {
  ServiceBookingService = new ServiceBookingService();

  constructor() {
    super(new ServiceBookingService(), 'ServiceBooking');
  }

  // add more methods here if needed or override the existing ones 
}
