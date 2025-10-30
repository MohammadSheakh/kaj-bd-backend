// AamarPay Success Handler
export const handleAamarPaySuccess = async (req: Request, res: Response) => {
    try {
        const responseData = req.body || req.query;
        
        console.log('AamarPay Success Data:', responseData);

        const {
            mer_txnid,
            amount,
            pay_status,
            pg_txnid,
            opt_a: referenceId,
            opt_b: referenceFor,
            opt_c: userId,
        } = responseData;

        if (pay_status !== 'Successful') {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Payment not successful');
        }

        // Verify payment with AamarPay API
        const verifyResponse = await axios.get(
            `${aamarpayConfig.base_url}/api/v1/trxcheck/request.php`,
            {
                params: {
                    store_id: aamarpayConfig.store_id,
                    signature_key: aamarpayConfig.signature_key,
                    type: 'json',
                    request_id: mer_txnid,
                },
            }
        );

        if (verifyResponse.data.pay_status !== 'Successful') {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Payment verification failed');
        }

        // Check if payment already exists
        const isPaymentExist = await PaymentTransaction.findOne({
            transactionId: pg_txnid,
        });

        if (isPaymentExist) {
            return res.redirect(`${config.frontend.url}/payment/success?already_processed=true`);
        }

        // Create Payment Transaction
        const newPayment = await PaymentTransaction.create({
            userId: userId,
            referenceFor,
            referenceId,
            paymentGateway: TPaymentGateway.aamarpay,
            transactionId: pg_txnid,
            paymentIntent: mer_txnid,
            amount: parseFloat(amount),
            currency: 'BDT',
            paymentStatus: TPaymentStatus.completed,
            gatewayResponse: responseData,
        });

        // Update LabTestBooking
        await LabTestBooking.findByIdAndUpdate(referenceId, {
            $set: {
                status: 'confirmed',
                paymentStatus: PaymentStatus.paid,
                paymentTransactionId: newPayment._id,
            },
        });

        res.redirect(`${config.frontend.url}/payment/success?booking_id=${referenceId}`);
    } catch (error) {
        console.error('AamarPay Success Error:', error);
        res.redirect(`${config.frontend.url}/payment/failed`);
    }
};