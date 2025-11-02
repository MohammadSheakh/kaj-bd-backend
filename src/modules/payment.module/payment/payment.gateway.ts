import { IServiceBooking } from "../../service.module/serviceBooking/serviceBooking.interface";
import { IUser } from "../../token/token.interface";

export abstract class PaymentGateway{
    abstract processPayment(serviceBookingId: IServiceBooking['_id'], loggedInUserId: IUser) :any;
}



// export class SSLGateway implements PaymentGateway {
//     processPayment(serviceBooking : IServiceBooking){

//     }
// }
