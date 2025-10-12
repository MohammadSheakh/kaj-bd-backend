//@ts-ignore
import { StatusCodes } from 'http-status-codes';
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

// TODO : need to re check this service
export class PaymentTransactionService extends GenericService<
  typeof PaymentTransaction,
  IPaymentTransaction
> {
  constructor() {
    super(PaymentTransaction);
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

    return {
      totalEarnings: totalEarnings[0]?.total || 0,
      todayEarnings: {
        amount: todayEarnings[0]?.total || 0,
        count: todayEarnings[0]?.count || 0,
      },
      thisWeekEarnings: {
        amount: thisWeekTotal,
        count: thisWeekEarnings[0]?.count || 0,
        growth: weeklyGrowth.toFixed(2),
      },
      thisMonthEarnings: {
        amount: thisMonthTotal,
        count: thisMonthEarnings[0]?.count || 0,
        growth: monthlyGrowth.toFixed(2),
      },
      lastWeekEarnings: {
        amount: lastWeekTotal,
        count: lastWeekEarnings[0]?.count || 0,
      },
      lastMonthEarnings: {
        amount: lastMonthTotal,
        count: lastMonthEarnings[0]?.count || 0,
      },
      thisQuarterEarnings: {
        amount: thisQuarterEarnings[0]?.total || 0,
        count: thisQuarterEarnings[0]?.count || 0,
      },
      thisYearEarnings: {
        amount: thisYearEarnings[0]?.total || 0,
        count: thisYearEarnings[0]?.count || 0,
      },
      totalTransactions,
      pendingPayments: {
        amount: pendingAmount[0]?.total || 0,
        count: pendingAmount[0]?.count || 0,
      },
      processingPayments: {
        amount: processingAmount[0]?.total || 0,
        count: processingAmount[0]?.count || 0,
      },
    };
  }
}
