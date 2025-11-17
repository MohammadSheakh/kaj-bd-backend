//@ts-ignore
import { Request, Response } from 'express';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
  //@ts-ignore
  import SSLCommerzPayment from 'sslcommerz-lts';
import { GenericController } from '../../_generic-module/generic.controller';
import { PaymentTransactionService } from './paymentTransaction.service';
import { PaymentTransaction } from './paymentTransaction.model';
import { IPaymentTransaction } from './paymentTransaction.interface';
import catchAsync from '../../../shared/catchAsync';
import { config } from '../../../config';
import ApiError from '../../../errors/ApiError';
//@ts-ignore
import Stripe from 'stripe';
//@ts-ignore
import stripe from '../../../config/paymentGateways/stripe.config';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { sslConfig } from '../../../config/paymentGateways/sslcommerz.config';


export class PaymentTransactionController extends GenericController<
  typeof PaymentTransaction,
  IPaymentTransaction
> {
  paymentTransactionService = new PaymentTransactionService();
  private stripe: Stripe;

  constructor() {
    super(new PaymentTransactionService(), 'paymentTransaction');
    this.stripe = stripe;
  }

  // for stripe
  successPage = catchAsync(async (req: Request, res: Response) => {

    console.log("🟢 success page")

     const { session_id } = req.query;

    if (!session_id) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Session ID is required');
    }

    const session = await this.stripe.checkout.sessions.retrieve(session_id as string, {
      expand: ['subscription']
    });

    // Extract safe data
    const responseData = {
      sessionId: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total ? (session.amount_total / 100) : 0,
      currency: session.currency?.toUpperCase(),
      subscriptionId: session.subscription ? (session.subscription as any).id : null,
      planNickname: session.metadata?.planNickname || 'N/A',
      subscriptionType: session.metadata?.subscriptionType || 'N/A',
      customerEmail: session.customer_details?.email || 'N/A',
      customerName: session.customer_details?.name || 'N/A',
    };
    
    res.render('success.ejs', { frontEndHomePageUrl: config.client.url,
       data: responseData // 👈 Pass session data here
     });

    // sendResponse(res, {
    //   code: StatusCodes.OK,
    //   data: result,
    //   message: `All ${this.modelName} with pagination`,
    //   success: true,
    // });
  });

  // for stripe
  cancelPage = catchAsync(async (req: Request, res: Response) => {
    res.render('cancel.ejs', { frontEndHomePageUrl: config.client.url });
  });

  //-------------------------------------- SSL METHODS START -------------------

  /*----------------------------- lets move this to paymentTransaction Service .. we call this service to sslcommerz.handler.ts -> handleSSLSuccess
  // for SSL Commerze Validation
  validateAfterSuccessfulTransaction = catchAsync(async (req: Request, res: Response) => {
    const data = {
        val_id:'ADGAHHGDAKJ456454' //that you go from sslcommerz response
    };
    const sslcz = new SSLCommerzPayment(sslConfig)
    sslcz.validate(data).then(data => {
        //process the response that got from sslcommerz 
       // https://developer.sslcommerz.com/doc/v4/#order-validation-api
    });
  })
  */


  paymentValidationByAPN = catchAsync(async (req: Request, res: Response) => {
    const data = {
        val_id:'ADGAHHGDAKJ456454' //that you go from sslcommerz response
    };
    const sslcz = new SSLCommerzPayment(sslConfig)
    sslcz.validate(data).then(data => {
        //process the response that got from sslcommerz 
       // https://developer.sslcommerz.com/doc/v4/#order-validation-api
    });
  })

  // for SSL Commerze initiate a refund through API
  initiateARefundThroughAPI = catchAsync(async (req: Request, res: Response) => {
    const data = {
        refund_amount:10,
        refund_remarks:'',
        bank_tran_id:CB5464321445456456,
        refe_id:EASY5645415455,
    };
    const sslcz = new SSLCommerzPayment(sslConfig)
    sslcz.initiateRefund(data).then(data => {
        //process the response that got from sslcommerz 
        //https://developer.sslcommerz.com/doc/v4/#initiate-the-refund
    });
  })
  // for SSLCommerze Query the status of a refund request
  refundQuery = catchAsync(async (req: Request, res: Response) => {
    const data = {
        refund_ref_id:SL4561445410,
    };
    const sslcz = new SSLCommerzPayment(sslConfig)
    sslcz.refundQuery(data).then(data => {
        //process the response that got from sslcommerz
        //https://developer.sslcommerz.com/doc/v4/#initiate-the-refund
    });
  })

  // for SSLCommerze Query the status of a transaction (by Transaction ID)
  queryTheStatusOfATransactionByTxnId = catchAsync(async (req: Request, res: Response) => {
    const data = {
        tran_id:AKHLAKJS5456454,
    };
    const sslcz = new SSLCommerzPayment(sslConfig)
    sslcz.transactionQueryByTransactionId(data).then(data => {
        //process the response that got from sslcommerz
        //https://developer.sslcommerz.com/doc/v4/#by-session-id
    });
  })

  // for SSLCommerze Query the status of a transaction (by session ID)
  queryTheStatusOfATransactionBySessionId = catchAsync(async (req: Request, res: Response) => {
    const data = {
        sessionkey:AKHLAKJS5456454,
    };
    const sslcz = new SSLCommerzPayment(sslConfig)
    sslcz.transactionQueryBySessionId(data).then(data => {
        //process the response that got from sslcommerz
        //https://developer.sslcommerz.com/doc/v4/#by-session-id
    });
  })

  
  //-------------------------------------- SSL METHODS END -------------------


  //---------------------------
  // Admin | Get all payment transactions
  //----------------------------
  getAllWithPagination = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    const populateOptions: (string | {path: string, select: string}[]) = [
      
    ];

    const select = '-isDeleted -createdAt -updatedAt -__v -gatewayResponse'; 

    const result = await this.service.getAllWithPagination(filters, options, populateOptions , select );

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  //---------------------------
  // Dev | Get all payment transactions with Gateway Response for debug
  //----------------------------
  getAllWithPaginationForDev = catchAsync(async (req: Request, res: Response) => {
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    const populateOptions: (string | {path: string, select: string}[]) = [
      
    ];

    const select = '-isDeleted -createdAt -updatedAt -__v'; 

    const result = await this.service.getAllWithPagination(filters, options, populateOptions , select );

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  //--------------------------- suplify - kaj bd 
  // Admin | Get comprehensive earnings overview 
  //----------------------------
  getEarningsOverview = catchAsync(async (req: Request, res: Response) => {
    const result = await this.paymentTransactionService.getEarningsOverview();

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: 'Earnings overview retrieved successfully',
      success: true,
    });
  });

  // add more methods here if needed or override the existing ones 
}
