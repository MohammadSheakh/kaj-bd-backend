import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../_generic-module/generic.controller';
import { PaymentTransactionService } from './paymentTransaction.service';
import { PaymentTransaction } from './paymentTransaction.model';
import { IPaymentTransaction } from './paymentTransaction.interface';
import catchAsync from '../../../shared/catchAsync';
import { config } from '../../../config';
import ApiError from '../../../errors/ApiError';
import Stripe from 'stripe';
import stripe from '../../../config/paymentGateways/stripe.config';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';


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

  cancelPage = catchAsync(async (req: Request, res: Response) => {
    res.render('cancel.ejs', { frontEndHomePageUrl: config.client.url });
  });

  //---------------------------
  // Admin | Get all payment transactions
  //----------------------------
  getAllWithPagination = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    const populateOptions: (string | {path: string, select: string}[]) = [
      // {
      //   path: 'personId',
      //   select: 'name ' 
      // },
      // 'personId'
      // {
      //   path: 'conversationId',
      //   select: 'lastMessage updatedAt',
      //   populate: {
      //     path: 'lastMessage',
      //   }
      // }
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
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    const populateOptions: (string | {path: string, select: string}[]) = [
      // {
      //   path: 'personId',
      //   select: 'name ' 
      // },
      // 'personId'
      // {
      //   path: 'conversationId',
      //   select: 'lastMessage updatedAt',
      //   populate: {
      //     path: 'lastMessage',
      //   }
      // }
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

  //---------------------------
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
