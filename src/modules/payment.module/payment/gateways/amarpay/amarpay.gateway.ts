import { IServiceBooking } from "../../../../service.module/serviceBooking/serviceBooking.interface";
import { PaymentGateway } from "../../payment.gateway";

export class ShurjoPayGateway implements PaymentGateway{
    async processPayment(serviceBooking : IServiceBooking){
        const session = await mongoose.startSession();
    
        let finalAmount = 0;
        let createdBooking = null;

        await session.withTransaction(async () => {
            const isLabTestExist: IProduct = await Product.findById(data.labTestId).session(session);

            if (!isLabTestExist) {
                throw new ApiError(StatusCodes.NOT_FOUND, "Lab Test not found");
            }

            finalAmount = isLabTestExist.price;

            const bookedLabTest: ILabTestBooking = new LabTestBooking({
                patientId: user?.userId,
                labTestId: isLabTestExist._id,
                appointmentDate: data?.appointmentDate,
                startTime: data?.startTime,
                endTime: data?.endTime,
                address: data.address,
                city: data.city,
                state: data.state,
                zipCode: data.zipCode,
                country: data.country,
                paymentTransactionId: null,
                paymentStatus: PaymentStatus.unpaid,
                finalAmount: isLabTestExist.price
            });

            createdBooking = await bookedLabTest.save({ session });
        });
        
        session.endSession();

        try {
            const transactionId = `LAB_${createdBooking._id}_${Date.now()}`;

            const paymentData = {
                store_id: aamarpayConfig.store_id,
                signature_key: aamarpayConfig.signature_key,
                tran_id: transactionId,
                amount: finalAmount.toString(),
                currency: 'BDT',
                desc: 'Lab Test Booking Payment',
                cus_name: user.userName,
                cus_email: user.email,
                cus_phone: user.phone || '01XXXXXXXXX',
                cus_add1: data.address || 'Dhaka',
                cus_city: data.city || 'Dhaka',
                cus_country: 'Bangladesh',
                success_url: `${config.aamarpay.success_url}`,
                fail_url: `${config.aamarpay.fail_url}`,
                cancel_url: `${config.aamarpay.cancel_url}`,
                type: 'json',
                // Custom opt fields (a, b, c, d)
                opt_a: createdBooking._id.toString(),
                opt_b: TTransactionFor.LabTestBooking,
                opt_c: user.userId.toString(),
                opt_d: finalAmount.toString(),
            };

            const response = await axios.post(
                `${aamarpayConfig.base_url}/jsonpost.php`,
                paymentData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data.result === 'true') {
                return {
                    url: response.data.payment_url,
                    bookingId: createdBooking._id,
                    transactionId: transactionId,
                };
            } else {
                throw new ApiError(StatusCodes.BAD_REQUEST, 'AamarPay payment initialization failed');
            }
        } catch (error) {
            throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'AamarPay payment error');
        }
    }
}