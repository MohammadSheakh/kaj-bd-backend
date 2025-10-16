import { StatusCodes } from 'http-status-codes';
import { ServiceProvider } from './ServiceProvider.model';
import { IServiceProvider } from './ServiceProvider.interface';
import { GenericService } from '../_generic-module/generic.services';


export class ServiceProviderService extends GenericService<
  typeof ServiceProvider,
  IServiceProvider
> {
  constructor() {
    super(ServiceProvider);
  }
}
