//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { WalletTransactionHistory } from './walletTransactionHistory.model';
import { IWalletTransactionHistory } from './walletTransactionHistory.interface';
import { GenericService } from '../../_generic-module/generic.services';
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

export class WalletTransactionHistoryService extends GenericService<
  typeof WalletTransactionHistory,
  IWalletTransactionHistory
> {
  constructor() {
    super(WalletTransactionHistory);
  }

  // Get specialist's comprehensive earnings overview
  async getSpecialistEarningsOverview(userId: string) {
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

    // Base query for completed credit transactions (earnings)
    const baseQuery = {
      userId,
      isDeleted: false,
      type: TWalletTransactionHistory.credit,
      status: TWalletTransactionStatus.completed,
    };

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
      pendingEarnings,
      totalWithdrawals,
      currentBalance,
    ] = await Promise.all([
      // Total lifetime earnings
      this.walletTransactionModel.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: null,
            usd: {
              $sum: {
                $cond: [{ $eq: ['$currency', TCurrency.usd] }, '$amount', 0],
              },
            },
            token: {
              $sum: {
                $cond: [{ $eq: ['$currency', TCurrency.token] }, '$amount', 0],
              },
            },
          },
        },
      ]),

      // Today's earnings
      this.walletTransactionModel.aggregate([
        { $match: { ...baseQuery, createdAt: { $gte: todayStart } } },
        {
          $group: {
            _id: null,
            usd: {
              $sum: {
                $cond: [{ $eq: ['$currency', TCurrency.usd] }, '$amount', 0],
              },
            },
            token: {
              $sum: {
                $cond: [{ $eq: ['$currency', TCurrency.token] }, '$amount', 0],
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // This week earnings
      this.walletTransactionModel.aggregate([
        { $match: { ...baseQuery, createdAt: { $gte: weekStart } } },
        {
          $group: {
            _id: null,
            usd: {
              $sum: {
                $cond: [{ $eq: ['$currency', TCurrency.usd] }, '$amount', 0],
              },
            },
            token: {
              $sum: {
                $cond: [{ $eq: ['$currency', TCurrency.token] }, '$amount', 0],
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // This month earnings
      this.walletTransactionModel.aggregate([
        { $match: { ...baseQuery, createdAt: { $gte: monthStart } } },
        {
          $group: {
            _id: null,
            usd: {
              $sum: {
                $cond: [{ $eq: ['$currency', TCurrency.usd] }, '$amount', 0],
              },
            },
            token: {
              $sum: {
                $cond: [{ $eq: ['$currency', TCurrency.token] }, '$amount', 0],
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // Last week earnings
      this.walletTransactionModel.aggregate([
        {
          $match: {
            ...baseQuery,
            createdAt: { $gte: lastWeekStart, $lte: lastWeekEnd },
          },
        },
        {
          $group: {
            _id: null,
            usd: {
              $sum: {
                $cond: [{ $eq: ['$currency', TCurrency.usd] }, '$amount', 0],
              },
            },
            token: {
              $sum: {
                $cond: [{ $eq: ['$currency', TCurrency.token] }, '$amount', 0],
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // Last month earnings
      this.walletTransactionModel.aggregate([
        {
          $match: {
            ...baseQuery,
            createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
          },
        },
        {
          $group: {
            _id: null,
            usd: {
              $sum: {
                $cond: [{ $eq: ['$currency', TCurrency.usd] }, '$amount', 0],
              },
            },
            token: {
              $sum: {
                $cond: [{ $eq: ['$currency', TCurrency.token] }, '$amount', 0],
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // This quarter earnings
      this.walletTransactionModel.aggregate([
        { $match: { ...baseQuery, createdAt: { $gte: quarterStart } } },
        {
          $group: {
            _id: null,
            usd: {
              $sum: {
                $cond: [{ $eq: ['$currency', TCurrency.usd] }, '$amount', 0],
              },
            },
            token: {
              $sum: {
                $cond: [{ $eq: ['$currency', TCurrency.token] }, '$amount', 0],
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // This year earnings
      this.walletTransactionModel.aggregate([
        { $match: { ...baseQuery, createdAt: { $gte: yearStart } } },
        {
          $group: {
            _id: null,
            usd: {
              $sum: {
                $cond: [{ $eq: ['$currency', TCurrency.usd] }, '$amount', 0],
              },
            },
            token: {
              $sum: {
                $cond: [{ $eq: ['$currency', TCurrency.token] }, '$amount', 0],
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // Total transactions count
      this.walletTransactionModel.countDocuments(baseQuery),

      // Pending earnings
      this.walletTransactionModel.aggregate([
        {
          $match: {
            userId,
            isDeleted: false,
            type: TWalletTransactionHistory.credit,
            status: TWalletTransactionStatus.pending,
          },
        },
        {
          $group: {
            _id: null,
            usd: {
              $sum: {
                $cond: [{ $eq: ['$currency', TCurrency.usd] }, '$amount', 0],
              },
            },
            token: {
              $sum: {
                $cond: [{ $eq: ['$currency', TCurrency.token] }, '$amount', 0],
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // Total withdrawals
      this.walletTransactionModel.aggregate([
        {
          $match: {
            userId,
            isDeleted: false,
            type: TWalletTransactionHistory.withdrawal,
            status: TWalletTransactionStatus.completed,
          },
        },
        {
          $group: {
            _id: null,
            usd: {
              $sum: {
                $cond: [{ $eq: ['$currency', TCurrency.usd] }, '$amount', 0],
              },
            },
            token: {
              $sum: {
                $cond: [{ $eq: ['$currency', TCurrency.token] }, '$amount', 0],
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // Current wallet balance
      this.walletModel.findOne({ userId, isDeleted: false }),
    ]);

    // Calculate growth percentages
    const thisWeekUSD = thisWeekEarnings[0]?.usd || 0;
    const lastWeekUSD = lastWeekEarnings[0]?.usd || 0;
    const weeklyGrowth =
      lastWeekUSD > 0 ? ((thisWeekUSD - lastWeekUSD) / lastWeekUSD) * 100 : 0;

    const thisMonthUSD = thisMonthEarnings[0]?.usd || 0;
    const lastMonthUSD = lastMonthEarnings[0]?.usd || 0;
    const monthlyGrowth =
      lastMonthUSD > 0
        ? ((thisMonthUSD - lastMonthUSD) / lastMonthUSD) * 100
        : 0;

    return {
      totalEarnings: {
        usd: totalEarnings[0]?.usd || 0,
        token: totalEarnings[0]?.token || 0,
      },
      todayEarnings: {
        usd: todayEarnings[0]?.usd || 0,
        token: todayEarnings[0]?.token || 0,
        count: todayEarnings[0]?.count || 0,
      },
      thisWeekEarnings: {
        usd: thisWeekUSD,
        token: thisWeekEarnings[0]?.token || 0,
        count: thisWeekEarnings[0]?.count || 0,
        growth: weeklyGrowth.toFixed(2),
      },
      thisMonthEarnings: {
        usd: thisMonthUSD,
        token: thisMonthEarnings[0]?.token || 0,
        count: thisMonthEarnings[0]?.count || 0,
        growth: monthlyGrowth.toFixed(2),
      },
      lastWeekEarnings: {
        usd: lastWeekUSD,
        token: lastWeekEarnings[0]?.token || 0,
        count: lastWeekEarnings[0]?.count || 0,
      },
      lastMonthEarnings: {
        usd: lastMonthUSD,
        token: lastMonthEarnings[0]?.token || 0,
        count: lastMonthEarnings[0]?.count || 0,
      },
      thisQuarterEarnings: {
        usd: thisQuarterEarnings[0]?.usd || 0,
        token: thisQuarterEarnings[0]?.token || 0,
        count: thisQuarterEarnings[0]?.count || 0,
      },
      thisYearEarnings: {
        usd: thisYearEarnings[0]?.usd || 0,
        token: thisYearEarnings[0]?.token || 0,
        count: thisYearEarnings[0]?.count || 0,
      },
      totalTransactions,
      pendingEarnings: {
        usd: pendingEarnings[0]?.usd || 0,
        token: pendingEarnings[0]?.token || 0,
        count: pendingEarnings[0]?.count || 0,
      },
      totalWithdrawals: {
        usd: totalWithdrawals[0]?.usd || 0,
        token: totalWithdrawals[0]?.token || 0,
        count: totalWithdrawals[0]?.count || 0,
      },
      currentBalance: {
        usd: currentBalance?.balance || 0,
        token: currentBalance?.tokenBalance || 0,
        availableForWithdrawal: currentBalance?.balance || 0,
      },
      netEarnings: {
        usd: (totalEarnings[0]?.usd || 0) - (totalWithdrawals[0]?.usd || 0),
        token:
          (totalEarnings[0]?.token || 0) - (totalWithdrawals[0]?.token || 0),
      },
    };
  }
}
