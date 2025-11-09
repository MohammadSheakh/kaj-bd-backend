//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { Banner } from './banner.model';
import { IBanner } from './banner.interface';
import { GenericService } from '../_generic-module/generic.services';


export class BannerService extends GenericService<
  typeof Banner,
  IBanner
> {
  constructor() {
    super(Banner);
  }
}
