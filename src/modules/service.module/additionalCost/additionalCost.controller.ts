import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { AdditionalCost } from './additionalCost.model';
import { IAdditionalCost } from './additionalCost.interface';
import { AdditionalCostService } from './additionalCost.service';

export class AdditionalCostController extends GenericController<
  typeof AdditionalCost,
  IAdditionalCost
> {
  AdditionalCostService = new AdditionalCostService();

  constructor() {
    super(new AdditionalCostService(), 'AdditionalCost');
  }

  // add more methods here if needed or override the existing ones 
}
