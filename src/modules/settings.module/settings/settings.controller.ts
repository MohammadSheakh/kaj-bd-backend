import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../_generic-module/generic.controller';
import { Demo } from './demo.model';
import { IDemo } from './demo.interface';
import { DemoService } from './demo.service';

export class DemoController extends GenericController<
  typeof Demo,
  IDemo
> {
  demoService = new DemoService();

  constructor() {
    super(new DemoService(), 'Demo');
  }

  // add more methods here if needed or override the existing ones 
}
