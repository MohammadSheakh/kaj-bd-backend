import { IServiceBooking } from "../../service.module/serviceBooking/serviceBooking.interface";

export abstract class PaymentGateway{
    abstract processPayment(serviceBooking: IServiceBooking) :any;
}



// export class SSLGateway implements PaymentGateway {
//     processPayment(serviceBooking : IServiceBooking){

//     }
// }
