import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../_generic-module/generic.controller';
import { ServiceBooking } from './ServiceBooking.model';
import { IServiceBooking } from './ServiceBooking.interface';
import { ServiceBookingService } from './ServiceBooking.service';

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
