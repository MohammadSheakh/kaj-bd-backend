//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { ServiceProvider } from './serviceProvider.model';
import { IServiceProvider } from './serviceProvider.interface';
import { GenericService } from '../../_generic-module/generic.services';

export class ServiceProviderService extends GenericService<
  typeof ServiceProvider,
  IServiceProvider
> {
  constructor() {
    super(ServiceProvider);
  }
}
