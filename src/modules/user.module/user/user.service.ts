//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { IUpdateUserInfo, IUser } from './user.interface';
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
  getProfileInformationOfAUser = async (id: string) => {
    //-- name, email, phoneNumber from User table ..
    //-- location, dob and gender from UserProfile table
    const user = await User.findById(id).select('name email phoneNumber').lean();
    const userProfile =  await UserProfile.findOne({
      userId: id
    }).select('location dob gender').lean();

    return {
      ...user,
      ...userProfile
    };
  };

  
  updateProfileInformationOfAUser = async (id: string, data:IUpdateUserInfo) => {
    //-- name, email, phoneNumber from User table ..
    //-- location, dob and gender from UserProfile table

    const updateUser:IUser  = await User.findByIdAndUpdate(id, {
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber
    })

    const updateUserProfile:IUserProfile = await UserProfile.find(
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
      ...res
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

  //---------------------------------suplify
  //  Admin | User Management With Statistics
  //---------------------------------
  async getAllWithAggregation(
      filters: any, // Partial<INotification> // FixMe : fix type
      options: PaginateOptions,
      // profileFilter: any = {}
    ) {

       // Separate general filters and profile-specific filters
  const generalFilters = omit(filters, ['approvalStatus']); // Exclude profile-specific fields
  const profileFilter = pick(filters, ['approvalStatus']);  // Extract profile-specific fields
      
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

        //  { $match: { 'profileInfo.approvalStatus': profileFilter.approvalStatus } },
    

        // Step 4: Filter by profile approval status if specified
        ...(profileFilter.approvalStatus ? [{
            $match: {
                'profileInfo.approvalStatus': profileFilter.approvalStatus
            }
        }] : []),


        // Step 5: Project the required fields
        {
            $project: {
                _id: 1,
                name: 1,
                email: 1,
                role: 1,
                subscriptionType: 1,
                profileId: 1,
                createdAt: 1,
                updatedAt: 1,
                // Add approval status from profile
                approvalStatus: '$profileInfo.approvalStatus',
                // Optionally include other profile fields
                profileCreatedAt: '$profileInfo.createdAt',
                profileUpdatedAt: '$profileInfo.updatedAt'
            }
        },
        
        // Step 6: Handle users without profiles (set default approval status)
        // {
        //     $addFields: {
        //         approvalStatus: {
        //             $ifNull: ['$approvalStatus', 'pending'] // Default status for users without profiles
        //         }
        //     }
        // }
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
    
    // Get statistics
    const roleStats = await User.aggregate(statisticsPipeline);
    
    // Transform stats into the required format
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
    const [categories, providers] = await Promise.all([
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
    ]);


    // for specific language 🔁
    // const result = categories.map(cat => ({
    //   ...cat,
    //   name: lang ? cat.name[lang] : cat.name
    // }));

    return { categories, providers };
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
