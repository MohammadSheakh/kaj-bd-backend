//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { SupportMessage } from './supportMessage.model';
import { ISupportMessage } from './supportMessage.interface';
import { GenericService } from '../_generic-module/generic.services';
import ApiError from '../../errors/ApiError';
import { enqueueWebNotification } from '../../services/notification.service';

export class SupportMessageService extends GenericService<
  typeof SupportMessage,
  ISupportMessage
> {
  constructor() {
    super(SupportMessage);
  }

  

  async changeResolveSatus( supportMessageId: string ) : Promise<ISupportMessage> {
    
    // check For Provider .. ServiceProvider details exist or not
    const existingSupportMessage:ISupportMessage = await SupportMessage.findById(
      supportMessageId
    );

    if (!existingSupportMessage) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No support message found.');
    }

    const updateSupportMessage: ISupportMessage = await SupportMessage.findByIdAndUpdate(
      supportMessageId,
      {
        isResolved : !existingSupportMessage.isResolved,
      },
      {
        new:true
      }
    )

    /**********
     * TODO : 
     * Lets send notification to user that admin resolved it 
     * ******* */
    // await enqueueWebNotification(
    //   `${user.userName} booked your service at ${serviceBookingDTO.bookingDateTime} in ${serviceBookingDTO.address}.`,
    //   user.userId, // senderId
    //   serviceBookingDTO.providerId, // receiverId
    //   TRole.provider, // receiverRole
    //   TNotificationType.serviceBooking, // type
    //   createdServiceBooking._id, // idOfType
    //   null, // linkFor // queryParamKey
    //   null, // linkId // queryParamValue
    // );


    return updateSupportMessage;
  }


}
