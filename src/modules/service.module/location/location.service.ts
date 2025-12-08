import { StatusCodes } from 'http-status-codes';
import { Location } from './location.model';
import { ILocation } from './location.interface';
import { GenericService } from '../../_generic-module/generic.services';

export class LocationService extends GenericService<
  typeof Location,
  ILocation
> {
  constructor() {
    super(Location);
  }
}
