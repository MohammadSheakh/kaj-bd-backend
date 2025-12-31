//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { ServiceProvider } from './serviceProvider.model';
import { IServiceProvider } from './serviceProvider.interface';
import { GenericService } from '../../_generic-module/generic.services';
import { UserProfile } from '../../user.module/userProfile/userProfile.model';
import PaginationService from '../../../common/service/paginationService';
import mongoose from 'mongoose';
import { PaginateOptions } from '../../../types/paginate';
import { ILocation } from '../location/location.interface';

//-----------------------------
// ServiceProvider means Service Provider Details
//-----------------------------
export class ServiceProviderService extends GenericService<
  typeof ServiceProvider,
  IServiceProvider
> {
  constructor() {
    super(ServiceProvider);
  }

  // this code has serious issue .. 
  async getAllWithAggregationV2(
      filters: any,
      options: PaginateOptions,
    ) {

    const userMatchStage: any = {};
    userMatchStage.createdAt = {};
    const locationDataMatchStage: any = {};

    // Dynamically apply filters
    for (const key in filters) {

      const value = filters[key];

      if (value === '' || value === null || value === undefined) continue;

      // --- Match for Users collection ---
      if (['serviceCategoryId', 'serviceName', 'userLatitude', 'userLongitude', '_id', 'maxDistance'].includes(key)) {
        if (key === 'serviceName') {
          // userMatchStage[key] = { $regex: value, $options: 'i' }; // case-insensitive

          if (!userMatchStage['$or']) {
          userMatchStage['$or'] = [
              { 'serviceName.en': { $regex: filters[key], $options: 'i' } },
              { 'serviceName.bn': { $regex: filters[key], $options: 'i' } }
            ];
          }
        } 
        else if (Array.isArray(value)) {
          userMatchStage[key] = { $in: value };
        }
        else if (key == '_id') {
          userMatchStage[key] = new mongoose.Types.ObjectId(value);
        }
        // --- Match for userlocation (joined collection) ---
        else if (key == 'userLatitude') {
          locationDataMatchStage['userLocation.userLatitude'] = value;
        }
        else if (key == 'userLongitude') {
          locationDataMatchStage['userLocation.userLongitude'] = value;
        }
         else {
          userMatchStage[key] = value;
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

      // Step 2: Lookup user table
        {
          $lookup: {
            from: 'users', // Collection name 
            localField: 'providerId',
            foreignField: '_id',
            as: 'provider'
          }
        },
        // Step 3: Unwind profile array (convert array to object)
        {
          $unwind: {
            path: '$provider',
            preserveNullAndEmptyArrays: true // Keep users without profiles
          }
        },

        // 2. Lookup attachmentsForGallery of serviceProvider table
        {
          $lookup: {
            from: 'attachments',
            localField: 'profileInfo.attachmentsForGallery',
            foreignField: '_id',
            as: 'attachmentsForGallery'
          }
        },

        //--------- look up user location data 
        {
          $lookup: {
            from: 'userlocation', // Collection name (adjust if different)
            localField: '_id',
            foreignField: 'userId',
            as: 'userLocation'
          }
        },
        
        // Step 3: Unwind profile array (convert array to object)
        {
          $unwind: {
            path: '$userLocation',
            preserveNullAndEmptyArrays: true // Keep users without profiles
          }
        },

        // ✅ Step 4: Match joined userRoleDataInfo fields
        ...(Object.keys(locationDataMatchStage).length > 0 ? [{ $match: locationDataMatchStage }] : []),

        // Step 5: Project the required fields
        {
            $project: {
                _id: 1,
                providerId: 1,
                serviceName:1,
                serviceCategoryId : 1,
                startPrice: 1,
                rating : 1,
                introOrBio : 1, 
                description : 1,
                yearsOfExperience: 1,
                providerApprovalStatus : 1,
                createdAt: 1,

                ///
                providerName:'$provider.name',
                profileImage:'$provider.profileImage',
                attachmentsForGallery: {
                  $map: { input: '$attachmentsForGallery', as: 'att', in: '$$att.attachment' }
                },
            }
        },
    ];


    // Use pagination service for aggregation
     const res =
        await PaginationService.aggregationPaginate(
        ServiceProvider, 
        pipeline,
        options
      );
    // console.log("res :: ", res)
    return {
      // statistics,
      ...res
    }
  }

  async getAllWithAggregationV3(
  filters: any,
  options: PaginateOptions,
  ) {
    const userMatchStage: any = {};
    userMatchStage.createdAt = {};

    // Extract location parameters
    let userLatitude: number | null = null;
    let userLongitude: number | null = null;
    let maxDistance: number = 50000; // Default 1000 meter = 1 Km

    // Dynamically apply filters
    for (const key in filters) {
      const value = filters[key];

      if (value === '' || value === null || value === undefined) continue;

      // --- Match for ServiceProvider collection ---
      if (['serviceCategoryId', 'serviceName', '_id', 'providerApprovalStatus'].includes(key)) {
        if (key === 'serviceName') {
          if (!userMatchStage['$or']) {
            userMatchStage['$or'] = [
              { 'serviceName.en': { $regex: filters[key], $options: 'i' } },
              { 'serviceName.bn': { $regex: filters[key], $options: 'i' } }
            ];
          }
        } 
        else if (Array.isArray(value)) {
          userMatchStage[key] = { $in: value };
        }
        else if (key === '_id') {
          userMatchStage[key] = new mongoose.Types.ObjectId(value);
        }
        else if (key === 'serviceCategoryId'){
          userMatchStage[key] = new mongoose.Types.ObjectId(value);
        }
        else {
          userMatchStage[key] = value;
        }
      }
      // --- Extract location parameters ---
      else if (key === 'userLatitude') {
        userLatitude = parseFloat(value);
      }
      else if (key === 'userLongitude') {
        userLongitude = parseFloat(value);
      }
      else if (key === 'maxDistance') {
        maxDistance = parseInt(value);
      }
    }

    // Default to only approved providers
    if (!userMatchStage.providerApprovalStatus) {
      userMatchStage.providerApprovalStatus = 'accept';
    }

    // Filter out deleted
    userMatchStage.isDeleted = false;

    if (Object.keys(userMatchStage.createdAt).length === 0) {
      delete userMatchStage.createdAt;
    }

    // console.log("userMatchStage :: ", userMatchStage);
    // console.log("Location params :: ", { userLatitude, userLongitude, maxDistance });

    // 📍 Build pipeline based on whether geospatial search is needed
    let pipeline: any[] = [];

    if (userLatitude !== null && userLongitude !== null) {
      // ✅ WITH GEOSPATIAL SEARCH
      // Strategy: First get nearby locations, then join with ServiceProvider
      
      // Step 1: Get nearby locations using $geoNear
      const nearbyLocationsPipeline = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [userLongitude, userLatitude] // [longitude, latitude]
            },
            distanceField: 'distance', // Distance in meters
            maxDistance: maxDistance,
            spherical: true,
            key: 'location',
            query: { isDeleted: false } // Only non-deleted locations
          }
        },
        {
          $project: {
            locationId: '$_id',
            distance: 1,
            location: 1,
            address: 1
          }
        }
      ];

      const nearbyLocations:ILocation = await mongoose.model('Location').aggregate(nearbyLocationsPipeline);
      
      // console.log("nearbyLocations :: ", nearbyLocations);
      // console.log(`Found ${nearbyLocations.length} nearby locations`);

      if (nearbyLocations.length === 0) {
        // No locations found within radius
        // No users found within radius

        return {
          results: [],
          totalResults: 0,
          limit: options.limit || 10,
          page: options.page || 1,
          // totalPages: 0,
          // hasNextPage: false,
          // hasPrevPage: false
        };
      }

      /*------------
      // Create map for distance lookup
      const distanceMap = new Map(
        nearbyLocations.map(loc => [loc.locationId.toString(), {
          distance: loc.distance,
          location: loc.location,
          address: loc.address
        }])
      );
      ------------*/

      // const nearbyLocationIds = nearbyLocations.map((loc : ILocation) => loc._id);
      const nearbyLocationIds = nearbyLocations.map((loc : ILocation) => new mongoose.Types.ObjectId(loc._id));

      // Add locationId filter to match stage
      userMatchStage.locationId = { $in: nearbyLocationIds };

      // console.log("Updated userMatchStage with location filter: ", userMatchStage);

      // Build main pipeline
      pipeline = [
        // Step 1: Match service providers
        { $match: userMatchStage },

        
        // Step 2: Lookup provider user
        {
          $lookup: {
            from: 'users',
            localField: 'providerId',
            foreignField: '_id',
            as: 'provider'
          }
        },
        {
          $unwind: {
            path: '$provider',
            preserveNullAndEmptyArrays: true
          }
        },

        /*---------------------------------------------

        // Step 3: Lookup location details
        {
          $lookup: {
            from: 'locations',
            localField: 'locationId',
            foreignField: '_id',
            as: 'locationDetails'
          }
        },
        {
          $unwind: {
            path: '$locationDetails',
            preserveNullAndEmptyArrays: true
          }
        },

        -------------------------------------------*/
        // Step 4: Lookup attachments for gallery
        {
          $lookup: {
            from: 'attachments',
            localField: 'attachments',
            foreignField: '_id',
            as: 'attachmentsForGallery'
          }
        },

        

        // Step 5: Project fields
        {
          $project: {
            _id: 1,
            serviceProviderDetailsId: 1,
            providerId: 1,
            serviceName: 1,
            serviceCategoryId: 1,
            startPrice: 1,
            rating: 1,
            introOrBio: 1,
            description: 1,
            yearsOfExperience: 1,
            providerApprovalStatus: 1,
            createdAt: 1,
            locationId: 1,

            /*---------------------------------

            // Location info
            location: '$locationDetails.location',

            ---------------------------------*/
            
            // Provider info
            providerName: '$provider.name',
            profileImage: '$provider.profileImage',
            
            
            address: '$locationDetails.address',
            
            

            

            // Attachments
            attachmentsForGallery: {
              $map: { 
                input: '$attachmentsForGallery', 
                as: 'att', 
                in: '$$att.attachment' 
              }
            }


          }
        }
      ];

      // Execute pipeline
      let results = await ServiceProvider.aggregate(pipeline);

      // console.log("results ::: ↪️↪️", results);

      /*---------------------
      // Add distances from our pre-calculated map
      results = results.map(doc => {
        const locationData = distanceMap.get(doc.locationId?.toString());
        return {
          ...doc,
          distance: locationData?.distance || 0,
          distanceKm: ((locationData?.distance || 0) / 1000).toFixed(2),
          distanceMiles: ((locationData?.distance || 0) / 1609.34).toFixed(2)
        };
      });

      // Sort by distance (closest first)
      results.sort((a, b) => a.distance - b.distance);
      -----------------------*/

      

      // Manual pagination
      const page = options.page || 1;
      const limit = options.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const paginatedResults = results.slice(startIndex, endIndex);

      return {
        results: paginatedResults,
        totalResults: results.length,
        limit: limit,
        page: page,
        totalPages: Math.ceil(results.length / limit),
        // hasNextPage: endIndex < results.length,
        // hasPrevPage: page > 1,
        // pagingCounter: startIndex + 1,
        // prevPage: page > 1 ? page - 1 : null,
        // nextPage: endIndex < results.length ? page + 1 : null
      };

    } else {
      // ✅ WITHOUT GEOSPATIAL SEARCH (Normal listing)
      pipeline = [
        { $match: userMatchStage },

        // Lookup provider user
        {
          $lookup: {
            from: 'users',
            localField: 'providerId',
            foreignField: '_id',
            as: 'provider'
          }
        },
        {
          $unwind: {
            path: '$provider',
            preserveNullAndEmptyArrays: true
          }
        },

        // Lookup location details
        {
          $lookup: {
            from: 'locations',
            localField: 'locationId',
            foreignField: '_id',
            as: 'locationDetails'
          }
        },
        {
          $unwind: {
            path: '$locationDetails',
            preserveNullAndEmptyArrays: true
          }
        },

        // Lookup attachments for gallery
        {
          $lookup: {
            from: 'attachments',
            localField: 'attachments',
            foreignField: '_id',
            as: 'attachmentsForGallery'
          }
        },

        // Project fields
        {
          $project: {
            _id: 1,
            serviceProviderDetailsId: 1,
            providerId: 1,
            serviceName: 1,
            serviceCategoryId: 1,
            startPrice: 1,
            rating: 1,
            introOrBio: 1,
            description: 1,
            yearsOfExperience: 1,
            providerApprovalStatus: 1,
            createdAt: 1,
            locationId: 1,
            
            // Provider info
            providerName: '$provider.name',
            profileImage: '$provider.profileImage',
            
            // Location info
            location: '$locationDetails.location',
            address: '$locationDetails.address',
            
            // Attachments
            attachmentsForGallery: {
              $map: { 
                input: '$attachmentsForGallery', 
                as: 'att', 
                in: '$$att.attachment' 
              }
            }
          }
        }
      ];

      console.log("Pipeline :: ", JSON.stringify(pipeline, null, 2));

      // Use normal pagination
      const res = await PaginationService.aggregationPaginate(
        ServiceProvider,
        pipeline,
        options
      );

      return res;
    }
  }



  detailsAndNIDImagesFromUserProfile = async (userProfileId: string) => {
    const serviceProvider = await ServiceProvider.findOne({
      providerId: userProfileId,
    })
    .select('serviceName attachmentsForGallery yearsOfExperience startPrice introOrBio description')
    .populate([
      {
        path: "serviceCategoryId",
        select: "name"
      },
      { 
        path: 'attachmentsForGallery', 
        select: 'attachment attachmentType'
      },]
    )
    .lean();

    // console.log('serviceProvider: ', serviceProvider);

    const userProfile = await UserProfile.findOne({
      userId : userProfileId
    }).select('frontSideCertificateImage backSideCertificateImage faceImageFromFrontCam').populate(
      {
        path: 'frontSideCertificateImage backSideCertificateImage faceImageFromFrontCam',
        select: 'attachment',
      }
    ).lean();

    console.log('userProfile: ', userProfile);

    return {
      serviceProvider,
      userProfile
    };
  };
}
