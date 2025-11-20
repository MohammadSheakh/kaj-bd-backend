//@ts-ignore
import { StatusCodes } from 'http-status-codes';
//@ts-ignore
import SSLCommerzPayment from 'sslcommerz-lts';
//@ts-ignore
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  startOfQuarter,
  endOfWeek,
  endOfMonth,
  subWeeks,
  subMonths,
  subDays,
} from 'date-fns';
import { GenericService } from '../../_generic-module/generic.services';
import { PaymentTransaction } from './paymentTransaction.model';
import { IPaymentTransaction } from './paymentTransaction.interface';
import { TPaymentStatus } from './paymentTransaction.constant';
import { sslConfig } from '../../../config/paymentGateways/sslcommerz.config';

// TODO : need to re check this service
export class PaymentTransactionService extends GenericService<
  typeof PaymentTransaction,
  IPaymentTransaction
> {
  constructor() {
    super(PaymentTransaction);
  }

  async validateSSLTransaction(val_id: string) {
    const data = {
        val_id, //that you go from sslcommerz response
    };
    const sslcz = new SSLCommerzPayment(
      sslConfig.store_id,
      sslConfig.store_passwd,
      sslConfig.is_live,
    )
    

    /*
    sslcz.validate(data).then(data => {
        //process the response that got from sslcommerz 
       // https://developer.sslcommerz.com/doc/v4/#order-validation-api
      const response = {
        status : data.status, // This parameter needs to be checked before update your database as a successful transaction.
        
        // if VALID  :  A successful transaction.
        // VALIDATED  : already validated
        // INVALID_TRANSACTION : Invalid validation id (val_id).


        tran_date, // Payment completion date 
        tran_id, // that was sent by me during initiation. 
        val_id, //A Validation ID against the Transaction which is provided by SSLCOMMERZ.
        amount , // This parameter needs to be validated with your system database for security
        store_amount, //  amount what you will get in your account after bank charge ( Example: 100 BDT will be your store amount of 96 BDT after 4% Bank Commission )
        card_type, // The Bank Gateway Name that customer selected
        card_no, //Customer’s Card number. However, for Mobile Banking and Internet Banking, it will return customer's reference id.
        currency,// Currency Type which will be settled with your merchant account after deducting the Gateway charges. This parameter is the currency type of the parameter amount
        bank_tran_id, // The transaction ID at Banks End
        card_issuer, // Issuer Bank Name 
        card_brand , //VISA, MASTER, AMEX, IB or MOBILE BANKING
        card_issuer_country, //Country of Card Issuer Bank
      
        
        card_issuer_country_code, //2 digits short code of Country of Card Issuer Bank
        currency_type, // The currency you have sent during initiation of this transaction. If the currency is different than BDT, then it will be converted to BDT by the current conversion rate. This parameter needs to be validated with your system database for security
        // THIS PARAMETER NEEDS TO BE VALIDATED WITH YOUR SYSTEM DATABASE FOR SECURITY
        
        currency_amount, 
        // The currency amount you have sent during initiation of this transaction. If the amount is not mentioned in BDT, then it will be converted to BDT by the current conversion rate and return by the above field amount. 
        // THIS PARAMETER NEEDS TO BE VALIDATED WITH YOUR SYSTEM DATABASE FOR SECURITY
        
        value_a, // Same Value will be returned as Passed during initiation
        value_b, // Same Value will be returned as Passed during initiation
        value_c, // Same Value will be returned as Passed during initiation
        value_d, // Same Value will be returned as Passed during initiation
      
        risk_level, // High (1) for most risky transactions and Low (0) for safe transactions.
      
      }
    });

    */

    try {
      const result = await sslcz.validate({ val_id });

      if (!result || (result.status !== 'VALID' && result.status !== 'VALIDATED')) {
        return false;
      }

      return { valid: true, data: result };
    } catch (error) {
      console.error('SSLCommerz validation failed:', error);
      return false;
    }

  }

   // Get comprehensive earnings overview
  async getEarningsOverview() {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);
    const lastWeekStart = startOfWeek(subWeeks(now, 1));
    const lastWeekEnd = endOfWeek(subWeeks(now, 1));
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const yearStart = startOfYear(now);
    const quarterStart = startOfQuarter(now);

    const completedStatus = TPaymentStatus.completed;
    const baseQuery = { isDeleted: false, paymentStatus: completedStatus };

    const [
      totalEarnings,
      todayEarnings,
      thisWeekEarnings,
      thisMonthEarnings,
      lastWeekEarnings,
      lastMonthEarnings,
      thisQuarterEarnings,
      thisYearEarnings,
      totalTransactions,
      pendingAmount,
      processingAmount,
    ] = await Promise.all([
      // Total lifetime earnings
      this.model.aggregate([
        { $match: baseQuery },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Today's earnings
      this.model.aggregate([
        { $match: { ...baseQuery, createdAt: { $gte: todayStart } } },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),

      // This week earnings
      this.model.aggregate([
        { $match: { ...baseQuery, createdAt: { $gte: weekStart } } },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),

      // This month earnings
      this.model.aggregate([
        { $match: { ...baseQuery, createdAt: { $gte: monthStart } } },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),

      // Last week earnings
      this.model.aggregate([
        {
          $match: {
            ...baseQuery,
            createdAt: { $gte: lastWeekStart, $lte: lastWeekEnd },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),

      // Last month earnings
      this.model.aggregate([
        {
          $match: {
            ...baseQuery,
            createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),

      // This quarter earnings
      this.model.aggregate([
        { $match: { ...baseQuery, createdAt: { $gte: quarterStart } } },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),

      // This year earnings
      this.model.aggregate([
        { $match: { ...baseQuery, createdAt: { $gte: yearStart } } },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),

      // Total transactions count
      this.model.countDocuments(baseQuery),

      // Pending amount
      this.model.aggregate([
        {
          $match: {
            isDeleted: false,
            paymentStatus: TPaymentStatus.pending,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),

      // Processing amount
      this.model.aggregate([
        {
          $match: {
            isDeleted: false,
            paymentStatus: TPaymentStatus.processing,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Calculate growth percentages
    const thisWeekTotal = thisWeekEarnings[0]?.total || 0;
    const lastWeekTotal = lastWeekEarnings[0]?.total || 0;
    const weeklyGrowth =
      lastWeekTotal > 0
        ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
        : 0;

    const thisMonthTotal = thisMonthEarnings[0]?.total || 0;
    const lastMonthTotal = lastMonthEarnings[0]?.total || 0;
    const monthlyGrowth =
      lastMonthTotal > 0
        ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
        : 0;

    // Get month name
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentMonth = monthNames[now.getMonth()];
    const lastMonth = monthNames[lastMonthStart.getMonth()];    

    // Format date range for last week
    const formatDate = (date: Date) => {
      return `${date.getDate()} ${monthNames[date.getMonth()].slice(0, 3)}`;
    };

    return {
      totalEarnings: totalEarnings[0]?.total || 0,
      todayEarnings: {
        label: 'Today earning',
        amount: todayEarnings[0]?.total || 0,
        count: todayEarnings[0]?.count || 0,
      },
      thisWeekEarnings: {
        amount: thisWeekTotal,
        count: thisWeekEarnings[0]?.count || 0,
        growth: weeklyGrowth.toFixed(2),
        dateRange: `${formatDate(lastWeekStart)} - ${formatDate(lastWeekEnd)}`,
        label: 'This week earning',
      },
      thisMonthEarnings: {
        amount: thisMonthTotal,
        count: thisMonthEarnings[0]?.count || 0,
        growth: monthlyGrowth.toFixed(2),
        month: currentMonth,
        label: 'This month earning',
      },
      lastWeekEarnings: {
        amount: lastWeekTotal,
        count: lastWeekEarnings[0]?.count || 0,
        label: 'Last week earning',
        dateRange: `${formatDate(lastWeekStart)} - ${formatDate(lastWeekEnd)}`,
      },
      lastMonthEarnings: {
        amount: lastMonthTotal,
        count: lastMonthEarnings[0]?.count || 0,
        label: 'Previous month earning',
        month: lastMonth,
      },
      thisQuarterEarnings: {
        amount: thisQuarterEarnings[0]?.total || 0,
        count: thisQuarterEarnings[0]?.count || 0,
        label: 'This quarter earning',
      },
      thisYearEarnings: {
        amount: thisYearEarnings[0]?.total || 0,
        count: thisYearEarnings[0]?.count || 0,
        label: 'This year earning',
      },
      totalTransactions,
      pendingPayments: {
        amount: pendingAmount[0]?.total || 0,
        count: pendingAmount[0]?.count || 0,
        label: 'Pending payments',
      },
      processingPayments: {
        amount: processingAmount[0]?.total || 0,
        count: processingAmount[0]?.count || 0,
        label: 'Processing payments',
      },
    };
  }
}
