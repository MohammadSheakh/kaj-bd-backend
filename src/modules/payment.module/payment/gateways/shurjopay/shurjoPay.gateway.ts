import { IServiceBooking } from "../../../../service.module/serviceBooking/serviceBooking.interface";
import { PaymentGateway } from "../../payment.gateway";

export class ShurjoPayGateway implements PaymentGateway{
    processPayment(serviceBooking : IServiceBooking){

    }
}