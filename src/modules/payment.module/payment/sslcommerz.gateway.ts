import { IServiceBooking } from "../../service.module/serviceBooking/serviceBooking.interface";
import { PaymentGateway } from "./payment.gateway";

export class SSLGateway implements PaymentGateway {
    processPayment(serviceBooking : IServiceBooking){

    }
}