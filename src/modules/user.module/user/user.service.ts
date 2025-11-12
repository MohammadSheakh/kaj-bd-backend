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


interface IAdminOrSuperAdminPayload {
  email: string;
  password: string;
  role: string;
  message?: string;
}

export class UserService extends GenericService<typeof User, IUser> {
  constructor() {
    super(User);
  }

  createAdminOrSuperAdmin = async (payload: IAdminOrSuperAdminPayload): Promise<IUser> => {

    const existingUser = await User.findOne({ email: payload.email });
    if (existingUser) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'This email already exists');
    }
    const result = new User({
      first_name: 'New',
      last_name: ` ${payload.role === 'admin' ? 'Admin' : 'Super Admin'}`,
      email: payload.email,
      password: payload.password,
      role: payload.role,
    });

    await result.save();
    //send email for the new admin or super admin via email service
    // todo
    sendAdminOrSuperAdminCreationEmail(
      payload.email,
      payload.role,
      payload.password,
      payload.message
    );

    return result;
  };

  //--------------------------------- kaj bd
  // User | Profile | 06-01 | get profile information of a user 
  //---------------------------------
  getProfileInformationOfAUser = async (loggedInUser: IUserFromToken) => {
    //-- name, email, phoneNumber from User table ..
    //-- location, dob and gender from UserProfile table

    //-- serviceName and rating from Service Provider Or Service Provider Details table


    const id = loggedInUser.userId

    const user = await User.findById(id).select('name email phoneNumber').lean();
    const userProfile =  await UserProfile.findOne({
      userId: id
    }).select('location dob gender').lean();

    if(loggedInUser.role == TRole.provider){
      
      console.log("as provider ... ", loggedInUser.role)

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
      .populate('userId', 'name avatar')
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
      email: data.email,
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

    updateUserProfile.dob = data.dob;
    updateUserProfile.gender = data.gender;

    const res =  await updateUserProfile.save();

    return {
      ...updateUser,
      ...res.toObject()
    };
  };


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
    
    // // Get statistics
    const roleStats = await User.aggregate(statisticsPipeline);
    
    // // Transform stats into the required format
    const statistics = {
        totalUser: roleStats.reduce((sum, stat) => sum + stat.count, 0),
        totalDoctor: roleStats.find(stat => stat._id === 'doctor')?.count || 0,
        totalSpecialist: roleStats.find(stat => stat._id === 'specialist')?.count || 0,
        totalPatient: roleStats.find(stat => stat._id === 'patient')?.count || 0
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
      if (['_id', 'from', 'to', 'role', 'name'].includes(key)) {
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

    console.log("userMatchStage :: ", userMatchStage)
   
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
                role: 1,
                profileId: 1,
                createdAt: 1,
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


    console.log("res :: ", res)




    return {
      // statistics,
      ...res
    }
  }

  async changeApprovalStatusByUserId(userId: string, approvalStatus: string): Promise<any> {
    
    const populateOptions = 
    [
      {
        path: 'profileId',
        select: 'approvalStatus attachments',
      }
    ];

    const select = 'name email profileImage role profileId';

    // Find the user by ID
    const user = await this.getById(userId, populateOptions, select);
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }

    // Ensure the user has a profileId
    if (!user.profileId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'User does not have an associated profile');
    }

    // Update the approvalStatus in the UserProfile
    const updatedProfile = await UserProfile.findByIdAndUpdate(
      user.profileId,
      { approvalStatus },
      { new: true }
    );

    user.profileId = updatedProfile

    if (!updatedProfile) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'User profile not found');
    }

    return user//updatedProfile;
  }


  async getCategoriesAndPopularProvidersForUser() {
    const [categories, providers, banners] = await Promise.all([
      ServiceCategory.find({ isDeleted: false, isVisible: true })
        .limit(9)
        .select('name attachments').populate({
          path: 'attachments',
          select: 'attachment attachmentType',
        }),

      ServiceProvider.find({
        providerApprovalStatus: 'accept',
        rating: { $lt: 3.5 },
        isDeleted: false,
      })
        .limit(10)
        .select('-__v -updatedAt -createdAt -isDeleted -attachmentsForCoverPhoto')
        .populate({
          path: 'attachmentsForGallery attachmentsForCoverPhoto',
          select: 'attachment attachmentType',
        }),

      Banner.find({ isDeleted: false }).limit(5).select('attachments').populate({
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
