import { StatusCodes } from 'http-status-codes';
import { informationVideo } from './informationVideo.model';
import { IinformationVideo } from './informationVideo.interface';
import { GenericService } from '../../_generic-module/generic.services';


export class informationVideoService extends GenericService<
  typeof informationVideo,
  IinformationVideo
> {
  constructor() {
    super(informationVideo);
  }
}
