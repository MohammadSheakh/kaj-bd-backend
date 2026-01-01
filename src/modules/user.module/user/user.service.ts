//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { PaginateOptions } from '../../../types/paginate';
import { IUpdateUserInfo, IUser } from './user.interface';
import { IUser as IUserFromToken } from '../../token/token.interface';
import { User } from './user.model';
import { sendAdminOrSuperAdminCreationEmail } from '../../../helpers/emailService';
import { GenericService } from '../../_generic-module/generic.services';
import PaginationService from '../../../common/service/paginationService';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';
import { UserProfile } from '../userProfile/userProfile.model';
import { ServiceCategory } from '../../service.module/serviceCategory/serviceCategory.model';
import { ServiceProvider } from '../../service.module/serviceProvider/serviceProvider.model';
import { IUserProfile } from '../userProfile/userProfile.interface';
import { buildTranslatedField } from '../../../utils/buildTranslatedField';
import { ServiceBooking } from '../../service.module/serviceBooking/serviceBooking.model';
import { TBookingStatus, TPaymentStatus } from '../../service.module/serviceBooking/serviceBooking.constant';
//@ts-ignore
import mongoose from 'mongoose';
import { WalletTransactionHistory } from '../../wallet.module/walletTransactionHistory/walletTransactionHistory.model';
// import dayjs from 'dayjs';
import {
  startOfWeek,
  startOfMonth,
  startOfYear,
  getDaysInMonth,
  format,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns';
import { TWalletTransactionHistory, TWalletTransactionStatus } from '../../wallet.module/walletTransactionHistory/walletTransactionHistory.constant';
import { TRole } from '../../../middlewares/roles';
import { Banner } from '../../banner/banner.model';
import { IServiceProvider } from '../../service.module/serviceProvider/serviceProvider.interface';
import { UserRoleData } from '../userRoleData/userRoleData.model';
import { IUserRoleData } from '../userRoleData/userRoleData.interface';
//@ts-ignore
import bcryptjs from 'bcryptjs';

//@ts-ignore
import {
  startOfDay,
  // startOfWeek,
  // startOfMonth,
  // startOfYear,
  startOfQuarter,
  endOfWeek,
  endOfMonth,
  subWeeks,
  subMonths,
  subDays,
} from 'date-fns';
import { TAdminStatus } from '../userRoleData/userRoleData.constant';
import { PaymentTransaction } from '../../payment.module/paymentTransaction/paymentTransaction.model';
import { TGender } from '../userProfile/userProfile.constant';
import { Attachment } from '../../attachments/attachment.model';
import { IAttachment } from '../../attachments/attachment.interface';


interface IAdminOrSuperAdminPayload {
  email: string;
  password: string;
  name : string;
  role: string;
  message?: string;
  phoneNumber : string;
}

export class UserService extends GenericService<typeof User, IUser> {
  constructor() {
    super(User);
  }

  async softDeleteById(id: string) {

    const object = await this.model.findById(id).select('-__v');

    if (!object) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No Object Found');
      //   return null;
    }

    if (object.isDeleted === true) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Item already deleted');
    }

    return await this.model.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt : new Date() },
      { new: true }
    );
  }

  createAdminOrSuperAdmin = async (payload: IAdminOrSuperAdminPayload): Promise<IUser> => {

    const existingUser = await User.findOne({ email: payload.email });

    if (existingUser) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'This email already exists');
    }

    const createProfile:IUserProfile = await UserProfile.create({
      acceptTOC: true
    })

    //send email for the new admin or super admin via email service
    
    sendAdminOrSuperAdminCreationEmail(
      payload.email,
      payload.role,
      payload.password,
      payload.message
    );

    payload.password = await bcryptjs.hash(payload.password, 12);

    const result:IUser = await User.create({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      isEmailVerified: true,
      phoneNumber: payload.phoneNumber,
      profileId: createProfile._id
    });

    await UserProfile.create({
      adminStatus: TAdminStatus.active,
      userId: result._id,
    })

    return result;
  };

  removeSubAdmin = async (subAdminId: string): Promise<IUser> => {

    const existingUser:IUser = await User.findByIdAndUpdate(
      { _id: subAdminId },
      {
        isEmailVerified: false,
        isDeleted: true,
      },
      {
        new: true
      }
    );

    if (!existingUser) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'This User is not found');
    }

    await UserProfile.findOneAndUpdate(
      { userId: existingUser._id },
      {
        adminStatus: TAdminStatus.inactive,
      },
      {
        new: true
      }
    )
    return existingUser;
  };

  //--------------------------------- kaj bd
  // User | Profile | 06-01 | get profile information of a user 
  //---------------------------------
  getProfileInformationOfAUser = async (loggedInUser: IUserFromToken) => {
    //-- name, email, phoneNumber from User table ..
    //-- location, dob and gender from UserProfile table

    //-- serviceName and rating from Service Provider Or Service Provider Details table


    const id = loggedInUser.userId

    const user = await User.findById(id).select('name email phoneNumber profileImage').lean();
    const userProfile =  await UserProfile.findOne({
      userId: id
    }).select('location dob gender').lean();

    if(loggedInUser.role == TRole.provider){
      
      const serviceProvider = await ServiceProvider.findOne({
        providerId: id
      }).select('serviceName rating').lean();
      return {
        ...user,
        ...userProfile,
        ...serviceProvider
      };
    }

    return {
      ...user,
      ...userProfile
    };
  };


  getEarningAndCategoricallyBookingCountAndRecentJobRequest = async (providerId: string, type: string) => {
    if (!providerId) throw new Error('Provider ID is required');

    const now = new Date();
    let startDate: Date;
    let groupStage: any;
    let dateLabels: string[];

    if (type === 'weekly') {
      // Sunday as start of week (matches MongoDB $dayOfWeek)
      startDate = startOfWeek(now, { weekStartsOn: 0 });
      groupStage = { $dayOfWeek: '$createdAt' };
      // Generate ['Sun', 'Mon', ..., 'Sat'] based on actual dates
      const weekDays = eachDayOfInterval({ start: startDate, end: now });
      const allWeekDays = eachDayOfInterval({ start: startDate, end: new Date(startDate.getTime() + 6 * 86400000) });
      dateLabels = allWeekDays.map((d) => format(d, 'EEE')); // ['Sun', 'Mon', ...]
    } else if (type === 'monthly') {
      startDate = startOfMonth(now);
      groupStage = { $dayOfMonth: '$createdAt' };
      const daysInMonth = getDaysInMonth(now);
      dateLabels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
    } else {
      startDate = startOfYear(now);
      groupStage = { $month: '$createdAt' };
      dateLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }

    // 💰 Income Chart Data
    const incomeData = await WalletTransactionHistory.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(providerId),
          type: TWalletTransactionHistory.credit,
          status: TWalletTransactionStatus.completed,
          isDeleted: false,
          createdAt: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: groupStage,
          totalIncome: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 🧮 Format chart data
    const incomeByDate: Record<string, number> = {};
    incomeData.forEach((item) => (incomeByDate[item._id] = item.totalIncome));

    const chartData = dateLabels.map((label, i) => ({
      label,
      income: incomeByDate[i + 1] || 0, // works for day/month (1-indexed)
    }));

    // Special handling for weekly: MongoDB $dayOfWeek is 1–7 (Sun–Sat)
    if (type === 'weekly') {
      // incomeByDate keys are 1 (Sun) to 7 (Sat)
      chartData.forEach((_, idx) => {
        chartData[idx].income = incomeByDate[idx + 1] || 0;
      });
    }

    const totalIncome = incomeData.reduce((sum, d) => sum + d.totalIncome, 0);
   

    // 📊 3. Booking stats
    const [totalRequests, accepted, inProgress, completed] = await Promise.all([
      ServiceBooking.countDocuments({ providerId, status: TBookingStatus.pending }),
      ServiceBooking.countDocuments({ providerId, status: TBookingStatus.accepted }),
      ServiceBooking.countDocuments({ providerId, status: TBookingStatus.inProgress }),
      ServiceBooking.countDocuments({ providerId, status: TBookingStatus.completed }),
    ]);

    // 🕓 4. Recent job requests
    const recentJobRequests = await ServiceBooking.find({
      providerId,
      status: TBookingStatus.pending,
    })
      .populate('userId', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return {
      totalIncome,
      type,
      chartData, // ✅ Chart ready for frontend (x: day, y: income)
      stats: {
        totalRequests,
        accepted,
        inProgress,
        completed,
      },
      recentJobRequests,
    };
  }



   /*

    const now = new Date();
    let startDate: Date;
    let groupStage: any = {};
    let dateLabels: string[] = [];

    switch (type) {
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupStage = { $dayOfMonth: '$completionDate' };
        dateLabels = Array.from({ length: 31 }, (_, i) => `${i + 1}`);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        groupStage = { $month: '$completionDate' };
        dateLabels = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];
        break;
      default:
        const day = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day);
        groupStage = { $dayOfWeek: '$completionDate' };
        dateLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        break;
    }
    */


     /*

    // 🧾 1. Income aggregation for chart
    const incomeData = await ServiceBooking.aggregate([
      {
        $match: {
          providerId: new mongoose.Types.ObjectId(providerId),
          paymentStatus: { $in: [TPaymentStatus.paid, TPaymentStatus.completed] },
          completionDate: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: groupStage,
          totalIncome: { $sum: '$totalCost' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 🧮 Prepare chart dataset
    const incomeByDate: Record<string, number> = {};
    incomeData.forEach((item) => {
      incomeByDate[item._id] = item.totalIncome;
    });

    const chartData = dateLabels.map((label, i) => {
      // For weekly: _id=1 means Sunday ... so we map accordingly
      const key =
        type === 'weekly'
          ? ((i + 1) % 7) + 1 // Sunday (1) to Saturday (7)
          : i + 1;
      return {
        label,
        income: incomeByDate[key] || 0,
      };
    });

    // 💰 2. Total Income
    const totalIncome = incomeData.reduce((sum, d) => sum + d.totalIncome, 0);

    */

  
  updateProfileInformationOfAUser = async (id: string, data:IUpdateUserInfo) => {
    //-- name, email, phoneNumber from User table ..
    //-- location, dob and gender from UserProfile table

    const updateUser:IUser  = await User.findByIdAndUpdate(id, {
      name: data.name,
      // email: data.email, // email can not be updated
      phoneNumber: data.phoneNumber
    },{ new: true }).lean()

    const updateUserProfile:IUserProfile = await UserProfile.findOne(
      {
        userId: id
      }
    );

    
    
    if(data.location){
      // Translate multiple properties dynamically
      const [locationObj] : [IUserProfile['location']]  = await Promise.all([
        buildTranslatedField(data.location as string)
      ]);

      updateUserProfile.location = locationObj;
    }


    if(data.dob){
      updateUserProfile.dob = data.dob;
    }
    if(data.gender){
      updateUserProfile.gender = data.gender as TGender;
    }
  
    const res =  await updateUserProfile.save();

    return {
      ...updateUser,
      ...res.toObject()
    };
  };

  updateProfileInformationOfAdmin = async (id: string, data:IUpdateUserInfo) => {
    //-- name, email, phoneNumber from User table ..

    const user:IUser = await User.findById(id).select("name profileImage");

    // if (!data?.profileImage[0]) {
    //   throw new ApiError(StatusCodes.NOT_FOUND, 'You have to upload an image to update');
    // }

    const attachmentUrl:IAttachment = await Attachment.findById(data?.profileImage[0]);


    const updateUser:IUser  = await User.findByIdAndUpdate(id, {
      name: data.name,
      profileImage : {
        imageUrl: attachmentUrl?.attachment ? attachmentUrl?.attachment : user?.profileImage?.imageUrl,
      },
      phoneNumber: data.phoneNumber
    },{ new: true }).lean()

    
    return {
      ...updateUser
    };
  };


  async updateProfileImageSeperately(userId: string, data: any): Promise<any> {
    
    const user:IUser = await User.findById(userId).select("name profileImage");

    console.log("data service  data?.profileImage[0] -> ", data?.profileImage[0]);

    if (!data?.profileImage[0]) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'You have to upload an image to update');
    }

    const attachmentUrl:IAttachment = await Attachment.findById(data?.profileImage[0]);
    // console.log("user -> ", user);
  
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profileImage : {
          imageUrl: attachmentUrl?.attachment ? attachmentUrl?.attachment : user?.profileImage?.imageUrl,
        }
      }, 
      { new: true }
    );

    if (!updatedUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found while update');
    }

    return {
      updatedUser
    }

  }


  async getAllWithPagination(
    filters: any, // Partial<INotification> // FixMe : fix type
    options: PaginateOptions,
    populateOptions?: any,
    select ? : string | string[]
  ) {
    const result = await this.model.paginate(filters, options, populateOptions, select);

    return result;
  }

  //---------------------------------kaj bd
  //  Admin | User Management With Statistics
  //---------------------------------
  async getAllWithAggregationWithStatistics(
      filters: any, 
      options: PaginateOptions,
      userId: String, // logged in User .. For this case .. Admin Id
      
    ) {

       // Separate general filters and profile-specific filters
  const generalFilters = omit(filters, ['approvalStatus']); // Exclude profile-specific fields
      
    // 📈⚙️ OPTIMIZATION:
    const pipeline = [
        // Step 1: Match users based on filters
        ...(Object.keys(filters).length > 0 ? [{ $match: generalFilters }] : []),
        
        // Step 2: Lookup profile information
        {
            $lookup: {
                from: 'userprofiles', // Collection name (adjust if different)
                localField: 'profileId',
                foreignField: '_id',
                as: 'profileInfo'
            }
        },
        
        // Step 3: Unwind profile array (convert array to object)
        {
            $unwind: {
                path: '$profileInfo',
                preserveNullAndEmptyArrays: true // Keep users without profiles
            }
        },

        // Step 5: Project the required fields
        {
            $project: {
                _id: 1,
                name: 1,
                email: 1,
                phoneNumber: 1,
                role: 1,
                profileId: 1,
                createdAt: 1,
                // Add approval status from profile
                dob: '$profileInfo.dob',
                // Optionally include other profile fields
                gender: '$profileInfo.gender',
                location: '$profileInfo.location'
            }
        },
    ];

    // 📈⚙️ OPTIMIZATION: Get role-based statistics first
    const statisticsPipeline = [
        {
            $group: {
                _id: '$role',
                count: { $sum: 1 }
            }
        }
    ];


    // 📈⚙️ OPTIMIZATION: Get total service booking count
    const serviceBookingStatPipeline = [
      {
        $group: {
            _id: null,
            count: { $sum: 1 }
        }
      }
    ];

    // lets calculate total revenue for admin

    //------- calculate this months and last months providers count
    // also calculate percentage { (newVal - oldVal) / old } * 100
    // result minus means decreased , positive means increment
    //------ do same thing for user also .. 

    async function calculateCurrentAndLastMonthsUserCountByRole(role : string) {
        const now = new Date();
        const monthStart = startOfMonth(now);

        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        const baseQuery = { isDeleted: false, role };
        
            const [
              allCount,
              thisMonthEarnings,
              lastMonthEarnings,
            ] = await Promise.all([

              // All Count
              User.aggregate([
                { $match: { ...baseQuery } },
                {
                  $group: {
                    _id: null,
                    // total: { $sum: '$amount' },
                    count: { $sum: 1 },
                  },
                },
              ]),
              
              // This month earnings
              User.aggregate([
                { $match: { ...baseQuery, createdAt: { $gte: monthStart } } },
                {
                  $group: {
                    _id: null,
                    // total: { $sum: '$amount' },
                    count: { $sum: 1 },
                  },
                },
              ]),
        
              // Last month earnings
              User.aggregate([
                {
                  $match: {
                    ...baseQuery,
                    createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
                  },
                },
                {
                  $group: {
                    _id: null,
                    // total: { $sum: '$amount' },
                    count: { $sum: 1 },
                  },
                },
              ]),
            ]);
        
            // Calculate growth percentages
            
            
            const thisMonthTotal = thisMonthEarnings[0]?.count || 0;
            const lastMonthTotal = lastMonthEarnings[0]?.count || 0;
            const monthlyGrowth =
              lastMonthTotal > 0
                ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
                : 0;

        return {
            allCount : allCount[0]?.count || 0,
            thisMonthTotal,
            lastMonthTotal,
            monthlyGrowth
        };
    }


    async function calculateCurrentAndLastMonthsServiceBookingCount() {
        const now = new Date();
        const monthStart = startOfMonth(now);

        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        const baseQuery = { isDeleted: false };
        
            const [
              allBookingCount,
              thisMonthBooking,
              lastMonthBooking,
            ] = await Promise.all([

              // This month earnings
              ServiceBooking.aggregate([
                { $match: { ...baseQuery } },
                {
                  $group: {
                    _id: null,
                    // total: { $sum: '$amount' },
                    count: { $sum: 1 },
                  },
                },
              ]),
              
              // This month earnings
              ServiceBooking.aggregate([
                { $match: { ...baseQuery, createdAt: { $gte: monthStart } } },
                {
                  $group: {
                    _id: null,
                    // total: { $sum: '$amount' },
                    count: { $sum: 1 },
                  },
                },
              ]),
        
              // Last month earnings
              ServiceBooking.aggregate([
                {
                  $match: {
                    ...baseQuery,
                    createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
                  },
                },
                {
                  $group: {
                    _id: null,
                    // total: { $sum: '$amount' },
                    count: { $sum: 1 },
                  },
                },
              ]),
            ]);
        
            // Calculate growth percentages
            
            
            const thisMonthTotal = thisMonthBooking[0]?.count || 0;
            const lastMonthTotal = lastMonthBooking[0]?.count || 0;
            const monthlyGrowth =
              lastMonthTotal > 0
                ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
                : 0;

        return {
            allBookingCount : allBookingCount[0]?.count || 0,
            thisMonthTotal,
            lastMonthTotal,
            monthlyGrowth
        };
    }

    //------- get all revenue for admin .. 
    
    const walletIdOfUser:IUser = await User.findById(userId).select('walletId')

    async function getTotalRevenueByMonths(year:string) {
        
        const targetYear = parseInt(year, 10) || new Date().getFullYear();
        
        const totalTransactionsByMonth = await WalletTransactionHistory.aggregate([
            {
                $match: {
                    walletId : walletIdOfUser.walletId,
                    isDeleted: false,
                    createdAt: {
                        $gte: new Date(targetYear, 0, 1), // Start of current year
                        $lt: new Date(targetYear + 1, 0, 1) // Start of next year
                    }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.month": 1 }
            }
        ]);

        const totalTransactionsAmountForAdmin = await WalletTransactionHistory.aggregate([
            {
                $match: {
                    walletId : walletIdOfUser.walletId,
                    isDeleted: false,
                    
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                }
            }
        ]);

        // Create array with all 12 months initialized to 0
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const result = monthNames.map((name, index) => ({
            month: name,
            count: 0,
            amount : 0,
        }));

        // Fill in actual counts
        totalTransactionsByMonth.forEach(item => {
            const monthIndex = item._id.month - 1; // MongoDB months are 1-indexed
            result[monthIndex].count = item.count;
            result[monthIndex].amount = item.total;
        });

        // Calculate average report count
        const totalReports = result.reduce((sum, month) => sum + month.count, 0);
        // const averageReportCount = totalReports / 12;

        return {
            monthlyData: result,
            totalTransactionsAmountForAdmin : totalTransactionsAmountForAdmin[0]?.total || 0,
            // averageReportCount: parseFloat(averageReportCount.toFixed(2))
        };
    }


    const [
      totalRevenueByMonth,
      currentAndLastMonthUserCount, 
      currentAndLastMonthProviderCount,
      serviceBookingCount
    ]
     = await Promise.all([
      await getTotalRevenueByMonths(filters?.year as string),  // TODO: eta test korte hobe thik result dicche kina
      await calculateCurrentAndLastMonthsUserCountByRole("user"),
      await calculateCurrentAndLastMonthsUserCountByRole("provider"),
      await calculateCurrentAndLastMonthsServiceBookingCount(),
    ])



    // Get statistics
    const roleStats = await User.aggregate(statisticsPipeline);
    
    // get BookingCount 
    const bookingCount = await ServiceBooking.aggregate(serviceBookingStatPipeline);


    const paymentTransactionStatPipeline = [
      {
        $group: {
            _id: null,
            count: { $sum: 1 },
            total: { $sum: '$amount' },
        }
      }
    ];

    // get total transaction amount for admin 
    const totalTransactionAmountForAdmin = await PaymentTransaction
    .aggregate(paymentTransactionStatPipeline);

    // Transform stats into the required format
    const statistics = {
      // totalUser: roleStats.reduce((sum, stat) => sum + stat.count, 0),
      totalUser: roleStats.find(stat => stat._id === 'user')?.count || 0,
      totalProviders: roleStats.find(stat => stat._id === 'provider')?.count || 0,
      totalSubAdmin: roleStats.find(stat => stat._id === 'subAdmin')?.count || 0,
      totalAdmin: roleStats.find(stat => stat._id === 'admin')?.count || 0,
      totalServiceBooking: bookingCount[0]?.count || 0,
      totalTransactionAmountForAdmin : totalTransactionAmountForAdmin[0]?.total || 0
    };

    // Use pagination service for aggregation
    const res =
      await PaginationService.aggregationPaginate(
      User, 
      pipeline,
      options
    );

    return {
      statistics,
      totalRevenueByMonth,
      currentAndLastMonthUserCount,
      currentAndLastMonthProviderCount,
      serviceBookingCount,
      ...res
    }
  }


  async getAllWithAggregationWithStatistics_V2_ProviderCountFix(
      filters: any, 
      options: PaginateOptions,
      userId: String, // logged in User .. For this case .. Admin Id
      
    ) {

       // Separate general filters and profile-specific filters
  const generalFilters = omit(filters, ['approvalStatus']); // Exclude profile-specific fields
      
    // 📈⚙️ OPTIMIZATION:
    const pipeline = [
        // Step 1: Match users based on filters
        ...(Object.keys(filters).length > 0 ? [{ $match: generalFilters }] : []),
        
        // Step 2: Lookup profile information
        {
            $lookup: {
                from: 'userprofiles', // Collection name (adjust if different)
                localField: 'profileId',
                foreignField: '_id',
                as: 'profileInfo'
            }
        },
        
        // Step 3: Unwind profile array (convert array to object)
        {
            $unwind: {
                path: '$profileInfo',
                preserveNullAndEmptyArrays: true // Keep users without profiles
            }
        },

        // Step 5: Project the required fields
        {
            $project: {
                _id: 1,
                name: 1,
                email: 1,
                phoneNumber: 1,
                role: 1,
                profileId: 1,
                createdAt: 1,
                // Add approval status from profile
                dob: '$profileInfo.dob',
                // Optionally include other profile fields
                gender: '$profileInfo.gender',
                location: '$profileInfo.location'
            }
        },
    ];

    // 📈⚙️ OPTIMIZATION: Get role-based statistics first
    const statisticsPipeline = [
        {
            $group: {
                _id: '$role',
                count: { $sum: 1 }
            }
        }
    ];


    // 📈⚙️ OPTIMIZATION: Get total service booking count
    const serviceBookingStatPipeline = [
      {
        $group: {
            _id: null,
            count: { $sum: 1 }
        }
      }
    ];

    // lets calculate total revenue for admin

    //------- calculate this months and last months providers count
    // also calculate percentage { (newVal - oldVal) / old } * 100
    // result minus means decreased , positive means increment
    //------ do same thing for user also .. 

    async function calculateCurrentAndLastMonthsUserCountByRole(role : string) {
        const now = new Date();
        const monthStart = startOfMonth(now);

        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        const baseQuery = { isDeleted: false, role };
        
            const [
              allCount,
              thisMonthEarnings,
              lastMonthEarnings,
            ] = await Promise.all([

              // All Count
              User.aggregate([
                { $match: { ...baseQuery } },
                {
                  $group: {
                    _id: null,
                    // total: { $sum: '$amount' },
                    count: { $sum: 1 },
                  },
                },
              ]),
              
              // This month earnings
              User.aggregate([
                { $match: { ...baseQuery, createdAt: { $gte: monthStart } } },
                {
                  $group: {
                    _id: null,
                    // total: { $sum: '$amount' },
                    count: { $sum: 1 },
                  },
                },
              ]),
        
              // Last month earnings
              User.aggregate([
                {
                  $match: {
                    ...baseQuery,
                    createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
                  },
                },
                {
                  $group: {
                    _id: null,
                    // total: { $sum: '$amount' },
                    count: { $sum: 1 },
                  },
                },
              ]),
            ]);
        
            // Calculate growth percentages
            
            
            const thisMonthTotal = thisMonthEarnings[0]?.count || 0;
            const lastMonthTotal = lastMonthEarnings[0]?.count || 0;
            const monthlyGrowth =
              lastMonthTotal > 0
                ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
                : 0;

        return {
            allCount : allCount[0]?.count || 0,
            thisMonthTotal,
            lastMonthTotal,
            monthlyGrowth
        };
    }


    async function calculateCurrentAndLastMonthsServiceBookingCount() {
        const now = new Date();
        const monthStart = startOfMonth(now);

        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        const baseQuery = { isDeleted: false };
        
            const [
              allBookingCount,
              thisMonthBooking,
              lastMonthBooking,
            ] = await Promise.all([

              // This month earnings
              ServiceBooking.aggregate([
                { $match: { ...baseQuery } },
                {
                  $group: {
                    _id: null,
                    // total: { $sum: '$amount' },
                    count: { $sum: 1 },
                  },
                },
              ]),
              
              // This month earnings
              ServiceBooking.aggregate([
                { $match: { ...baseQuery, createdAt: { $gte: monthStart } } },
                {
                  $group: {
                    _id: null,
                    // total: { $sum: '$amount' },
                    count: { $sum: 1 },
                  },
                },
              ]),
        
              // Last month earnings
              ServiceBooking.aggregate([
                {
                  $match: {
                    ...baseQuery,
                    createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
                  },
                },
                {
                  $group: {
                    _id: null,
                    // total: { $sum: '$amount' },
                    count: { $sum: 1 },
                  },
                },
              ]),
            ]);
        
            // Calculate growth percentages
            
            
            const thisMonthTotal = thisMonthBooking[0]?.count || 0;
            const lastMonthTotal = lastMonthBooking[0]?.count || 0;
            const monthlyGrowth =
              lastMonthTotal > 0
                ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
                : 0;

        return {
            allBookingCount : allBookingCount[0]?.count || 0,
            thisMonthTotal,
            lastMonthTotal,
            monthlyGrowth
        };
    }

    //------- get all revenue for admin .. 
    
    const walletIdOfUser:IUser = await User.findById(userId).select('walletId')

    async function getTotalRevenueByMonths(year:string) {
        
        const targetYear = parseInt(year, 10) || new Date().getFullYear();
        
        const totalTransactionsByMonth = await WalletTransactionHistory.aggregate([
            {
                $match: {
                    walletId : walletIdOfUser.walletId,
                    isDeleted: false,
                    createdAt: {
                        $gte: new Date(targetYear, 0, 1), // Start of current year
                        $lt: new Date(targetYear + 1, 0, 1) // Start of next year
                    }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.month": 1 }
            }
        ]);

        const totalTransactionsAmountForAdmin = await WalletTransactionHistory.aggregate([
            {
                $match: {
                    walletId : walletIdOfUser.walletId,
                    isDeleted: false,
                    
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                }
            }
        ]);

        // Create array with all 12 months initialized to 0
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const result = monthNames.map((name, index) => ({
            month: name,
            count: 0,
            amount : 0,
        }));

        // Fill in actual counts
        totalTransactionsByMonth.forEach(item => {
            const monthIndex = item._id.month - 1; // MongoDB months are 1-indexed
            result[monthIndex].count = item.count;
            result[monthIndex].amount = item.total;
        });

        // Calculate average report count
        const totalReports = result.reduce((sum, month) => sum + month.count, 0);
        // const averageReportCount = totalReports / 12;

        return {
            monthlyData: result,
            totalTransactionsAmountForAdmin : totalTransactionsAmountForAdmin[0]?.total || 0,
            // averageReportCount: parseFloat(averageReportCount.toFixed(2))
        };
    }


    const [
      totalRevenueByMonth,
      currentAndLastMonthUserCount, 
      currentAndLastMonthProviderCount,
      serviceBookingCount
    ]
     = await Promise.all([
      await getTotalRevenueByMonths(filters?.year as string),  // TODO: eta test korte hobe thik result dicche kina
      await calculateCurrentAndLastMonthsUserCountByRole("user"),
      await calculateCurrentAndLastMonthsUserCountByRole("provider"),
      await calculateCurrentAndLastMonthsServiceBookingCount(),
    ])



    // Get statistics
    const roleStats = await User.aggregate(statisticsPipeline);
    
    // get BookingCount 
    const bookingCount = await ServiceBooking.aggregate(serviceBookingStatPipeline);


    const paymentTransactionStatPipeline = [
      {
        $group: {
            _id: null,
            count: { $sum: 1 },
            total: { $sum: '$amount' },
        }
      }
    ];

    // get total transaction amount for admin 
    const totalTransactionAmountForAdmin = await PaymentTransaction
    .aggregate(paymentTransactionStatPipeline);


    //--------------- Find out the approved provider count ----------- START
    const countPipeline = [
      // 1️⃣ Match users (same as before)
      // { $match: userMatchStage },

      // 2️⃣ Lookup role data
      {
        $lookup: {
          from: 'userroledatas',
          localField: '_id',
          foreignField: 'userId',
          as: 'userRoleDataInfo'
        }
      },

      // 3️⃣ Unwind
      {
        $unwind: {
          path: '$userRoleDataInfo',
          preserveNullAndEmptyArrays: false
        }
      },

      // 4️⃣ Match accepted providers only
      {
        $match: {
          'userRoleDataInfo.providerApprovalStatus': 'accept'
        }
      },

      // 5️⃣ Count only
      {
        $count: 'totalAcceptedProviders'
      }
    ];

    const acceptedProvidersCount = await User.aggregate(countPipeline);
    //--------------------------------------------------------------- END

    // Transform stats into the required format
    const statistics = {
      // totalUser: roleStats.reduce((sum, stat) => sum + stat.count, 0),
      totalUser: roleStats.find(stat => stat._id === 'user')?.count || 0,


      // totalProviders: roleStats.find(stat => stat._id === 'provider')?.count || 0,
      // totalProviders: 12,

      totalProviders: acceptedProvidersCount[0]?.totalAcceptedProviders + 1 || 0, // hotfix: only shows thoses providers who's status is accept
      
      totalSubAdmin: roleStats.find(stat => stat._id === 'subAdmin')?.count || 0,
      totalAdmin: roleStats.find(stat => stat._id === 'admin')?.count || 0,
      totalServiceBooking: bookingCount[0]?.count || 0,
      totalTransactionAmountForAdmin : totalTransactionAmountForAdmin[0]?.total || 0
    };

    // Use pagination service for aggregation
    const res =
      await PaginationService.aggregationPaginate(
      User, 
      pipeline,
      options
    );

    return {
      statistics,
      totalRevenueByMonth,
      currentAndLastMonthUserCount,
      currentAndLastMonthProviderCount,
      serviceBookingCount,
      ...res
    }
  }

  //---------------------------------kaj bd
  //  Admin | User Management
  //---------------------------------
  async getAllWithAggregation(
      filters: any, // Partial<INotification> // FixMe : fix type
      options: PaginateOptions,
      // profileFilter: any = {}
    ) {

    const userMatchStage: any = {};

    userMatchStage.createdAt = {};


    // Dynamically apply filters
    for (const key in filters) {
      const value = filters[key];
      if (value === '' || value === null || value === undefined) continue;
      // --- Match for Users collection ---
      if (['_id', 'from', 'to', 'role', 'name', 'isDeleted'].includes(key)) {
        if (key == '_id') {
          userMatchStage[key] = new mongoose.Types.ObjectId(value);
        }else if (key.trim() === "from") {
          userMatchStage.createdAt.$gte = new Date(filters[key]);
        }
        else if (key == 'to') {
          userMatchStage.createdAt.$lte = new Date(filters[key]);
        }else if (key === 'name') {
          userMatchStage[key] = { $regex: value, $options: 'i' }; // case-insensitive
        }
        else {
          userMatchStage[key] = value;
        }
      }
    }  

    if (Object.keys(userMatchStage.createdAt).length === 0) {
      delete userMatchStage.createdAt;
    }

    // 📈⚙️ OPTIMIZATION:
    const pipeline = [
      // ✅ Step 1: Filter users before lookup
      { $match: userMatchStage },

      // Step 2: Lookup profile information
      {
          $lookup: {
              from: 'userprofiles', // Collection name (adjust if different)
              localField: 'profileId',
              foreignField: '_id',
              as: 'profileInfo'
          }
      },
      
      // Step 3: Unwind profile array (convert array to object)
      {
          $unwind: {
              path: '$profileInfo',
              preserveNullAndEmptyArrays: true // Keep users without profiles
          }
      },

      // Step 5: Project the required fields
      {
          $project: {
              _id: 1,
              name: 1,
              email: 1,
              profileImage: 1,
              phoneNumber: 1,
              role: 1,
              profileId: 1,
              createdAt: 1,
              // Add approval status from profile
              dob: '$profileInfo.dob',
              // Optionally include other profile fields
              gender: '$profileInfo.gender',
              location: '$profileInfo.location'
          }
      },        
    ];

    // Use pagination service for aggregation
     const res =
      await PaginationService.aggregationPaginate(
      User, 
      pipeline,
      options
    );

    return {
      ...res
    }
  }


  //--------------------------------- kaj bd
  //  Admin | Provider Management
  //---------------------------------
  async getAllWithAggregationV2(
      filters: any,
      options: PaginateOptions,
    ) {

   /*-----------------------------------------   
   const matchStage: any = {};

   // TODO : MUST : created At filter add korte hobe ..

    // Dynamically apply filters
    for (const key in filters) {
      if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        if (key === 'name') {
          matchStage[key] = { $regex: filters[key], $options: 'i' }; // Case-insensitive search
        } else if (Array.isArray(filters[key])) {
          // Allow multiple values, e.g. role=['admin','user']
          matchStage[key] = { $in: filters[key] };
        } else {
          matchStage[key] = filters[key];
        }
      }
    }
    --------------------------------------------*/

    const userMatchStage: any = {};
    userMatchStage.createdAt = {};
    const roleDataMatchStage: any = {};

    // Dynamically apply filters
    for (const key in filters) {

      const value = filters[key];

      if (value === '' || value === null || value === undefined) continue;

      // --- Match for Users collection ---
      if (['name', 'email', 'phoneNumber', 'role', '_id', 'from', 'to'].includes(key)) {
        if (key === 'name') {
          userMatchStage[key] = { $regex: value, $options: 'i' }; // case-insensitive
        }  // --- (optional) Handle date filtering ---
        else if (key.trim() === "from") {
          userMatchStage.createdAt.$gte = new Date(filters[key]);
        }
        else if (key == 'to') {
          userMatchStage.createdAt.$lte = new Date(filters[key]);
        }
        else if (Array.isArray(value)) {
          userMatchStage[key] = { $in: value };
        }else if (key == '_id') {
          userMatchStage[key] = new mongoose.Types.ObjectId(value);
        } else {
          userMatchStage[key] = value;
        }
      }

      // --- Match for userroledatas (joined collection) ---
      else if (key === 'providerApprovalStatus') {
        if (Array.isArray(value)) {
          roleDataMatchStage['userRoleDataInfo.providerApprovalStatus'] = { $in: value };
        } else {
          roleDataMatchStage['userRoleDataInfo.providerApprovalStatus'] = value;
        }
      }
    }

    if (Object.keys(userMatchStage.createdAt).length === 0) {
      delete userMatchStage.createdAt;
    }

    // console.log("userMatchStage :: ", userMatchStage)
   
    // 📈⚙️ OPTIMIZATION:
    const pipeline = [
      
      // ✅ Step 1: Filter users before lookup
      // { $match: matchStage },
      { $match: userMatchStage },

        // Step 2: Lookup profile information
        {
          $lookup: {
            from: 'userprofiles', // Collection name (adjust if different)
            localField: 'profileId',
            foreignField: '_id',
            as: 'profileInfo'
          }
        },
        
        // Step 3: Unwind profile array (convert array to object)
        {
          $unwind: {
            path: '$profileInfo',
            preserveNullAndEmptyArrays: true // Keep users without profiles
          }
        },

        //---------------------------------

        // Step 2: Lookup ServiceProviderDetails information
        {
          $lookup: {
            from: 'serviceproviders', // Collection name (adjust if different)
            localField: '_id',
            foreignField: 'providerId',
            as: 'serviceProviderDetails'
          }
        },
        
        // Step 3: Unwind profile array (convert array to object)
        {
          $unwind: {
            path: '$serviceProviderDetails',
            preserveNullAndEmptyArrays: true // Keep users without profiles
          }
        },

        //--------- look up user role data for providerApprovalStatus -----
        {
          $lookup: {
            from: 'userroledatas', // Collection name (adjust if different)
            localField: '_id',
            foreignField: 'userId',
            as: 'userRoleDataInfo'
          }
        },
        
        // Step 3: Unwind profile array (convert array to object)
        {
          $unwind: {
            path: '$userRoleDataInfo',
            preserveNullAndEmptyArrays: true // Keep users without profiles
          }
        },

        // ✅ Step 4: Match joined userRoleDataInfo fields
        ...(Object.keys(roleDataMatchStage).length > 0 ? [{ $match: roleDataMatchStage }] : []),


        // 2. Lookup front-side certificate attachments
        {
          $lookup: {
            from: 'attachments',
            localField: 'profileInfo.frontSideCertificateImage',
            foreignField: '_id',
            as: 'frontAttachments'
          }
        },
        // 3. Lookup back-side
        {
          $lookup: {
            from: 'attachments',
            localField: 'profileInfo.backSideCertificateImage',
            foreignField: '_id',
            as: 'backAttachments'
          }
        },
        // 4. Lookup face images
        {
          $lookup: {
            from: 'attachments',
            localField: 'profileInfo.faceImageFromFrontCam',
            foreignField: '_id',
            as: 'faceAttachments'
          }
        },


        // Step 5: Project the required fields
        {
            $project: {
                _id: 1,
                name: 1,
                email: 1,
                phoneNumber: 1,
                profileImage:1,
                role: 1,
                profileId: 1,
                createdAt: 1,


                serviceName: '$serviceProviderDetails.serviceName',

                // Add approval status from profile
                dob: '$profileInfo.dob',
                // Optionally include other profile fields
                gender: '$profileInfo.gender',
                location: '$profileInfo.location',
                providerApprovalStatus: '$userRoleDataInfo.providerApprovalStatus',  // -------------
                // frontSideCertificateImage: '$profileInfo.frontSideCertificateImage',
                // backSideCertificateImage: '$profileInfo.backSideCertificateImage',
                // faceImageFromFrontCam: '$profileInfo.faceImageFromFrontCam'

                frontSideCertificateImage: {
                  $map: { input: '$frontAttachments', as: 'att', in: '$$att.attachment' }
                },
                backSideCertificateImage: {
                  $map: { input: '$backAttachments', as: 'att', in: '$$att.attachment' }
                },
                faceImageFromFrontCam: {
                  $map: { input: '$faceAttachments', as: 'att', in: '$$att.attachment' }
                }
            }
        },
    ];


    // Use pagination service for aggregation
     const res =
      await PaginationService.aggregationPaginate(
      User, 
      pipeline,
      options
    );


    // console.log("res :: ", res)




    return {
      // statistics,
      ...res
    }
  }

  /*--------------------
  suplify, kaj bd :: 
  ---------------------*/
  async changeApprovalStatusByUserId(userId: string, approvalStatus: string): Promise<any> {
    
    let usersRoleData : IUserRoleData | null = await UserRoleData.findOne({
      userId,
    }).select("providerApprovalStatus");

    let serviceProviderDetails : IServiceProvider | null = await ServiceProvider.findOne({
      providerId : userId,
    }).select("providerApprovalStatus");

    let updateServiceProviderDetails = await ServiceProvider.findByIdAndUpdate(
      serviceProviderDetails?._id,
      {
        providerApprovalStatus : approvalStatus
      }
    );
    
    let updateRoleData = await UserRoleData.findByIdAndUpdate(
      usersRoleData?._id,
      {
        providerApprovalStatus : approvalStatus
      }
    );

    return {
      updateRoleData,
      updateServiceProviderDetails
    };
  }


  async getCategoriesAndPopularProvidersForUser() {
    const [categories, providers, banners] = await Promise.all([
      ServiceCategory.find({ isDeleted: false, isVisible: true })
        .limit(6)
        .select('name attachments').populate({
          path: 'attachments',
          select: 'attachment attachmentType',
        }),

      ServiceProvider.find({
        providerApprovalStatus: 'accept',
        rating: { $gt: 3.5 }, // lt
        isDeleted: false,
      })
        .limit(10)
        .select('-__v -updatedAt -createdAt -isDeleted -attachmentsForCoverPhoto')
        .populate({
          path: 'attachmentsForGallery attachmentsForCoverPhoto',
          select: 'attachment attachmentType',
        }),

      Banner.find({ isDeleted: false }).limit(10).select('attachments').populate({
        path: 'attachments',
        select: 'attachment',
      }),  
    ]);


    // for specific language 🔁
    // const result = categories.map(cat => ({
    //   ...cat,
    //   name: lang ? cat.name[lang] : cat.name
    // }));

    return { categories, providers, banners };
  }

  async getPopularProvidersForUser() {
    const [ providers] = await Promise.all([

      ServiceProvider.find({
        providerApprovalStatus: 'accept',
        rating: { $lt: 3.5 },
        isDeleted: false,
      })
        .select('-__v -updatedAt -createdAt -isDeleted -attachmentsForCoverPhoto')
        .populate({
          path: 'attachmentsForGallery attachmentsForCoverPhoto',
          select: 'attachment attachmentType',
        }),

    ]);


    return { providers };
  }
}

/*********
const getAllUsers = async (
  filters: Record<string, any>,
  options: PaginateOptions
): Promise<PaginateResult<IUser>> => {
  const query: Record<string, any> = {};
  if (filters.userName) {
    query['first_name'] = { $regex: filters.userName, $options: 'i' };
  }
  if (filters.email) {
    query['email'] = { $regex: filters.email, $options: 'i' };
  }
  if (filters.role) {
    query['role'] = filters.role;
  }
  return await User.paginate(query, options);
};

********** */
