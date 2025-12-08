import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { Location } from './location.model';
import { ILocation } from './Location.interface';
import { LocationService } from './location.service';

export class LocationController extends GenericController<
  typeof Location,
  ILocation
> {
  LocationService = new LocationService();

  constructor() {
    super(new LocationService(), 'Location');
  }

  // add more methods here if needed or override the existing ones 
}
