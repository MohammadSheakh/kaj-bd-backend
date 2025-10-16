import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { ServiceProvider } from './serviceProvider.model';
import { IServiceProvider } from './serviceProvider.interface';
import { ServiceProviderService } from './serviceProvider.service';

export class ServiceProviderController extends GenericController<
  typeof ServiceProvider,
  IServiceProvider
> {
  ServiceProviderService = new ServiceProviderService();

  constructor() {
    super(new ServiceProviderService(), 'ServiceProvider');
  }

  // add more methods here if needed or override the existing ones 
}
