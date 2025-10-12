//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { SpecialistPatient } from './specialistPatient.model';
import { ISpecialistPatient } from './specialistPatient.interface';
import { GenericService } from '../../_generic-module/generic.services';
//@ts-ignore
import mongoose from 'mongoose';
import PaginationService from '../../../common/service/paginationService';
import { User } from '../../user/user.model';

export class SpecialistPatientService extends GenericService<
  typeof SpecialistPatient,
  ISpecialistPatient
> {
  constructor() {
    super(SpecialistPatient);
  }

  //---------------------------------
  // Specialist | Members And Protocol | Show all patient and their doctors, subscriptionPlan
  //---------------------------------
  async showAllPatientsAndTheirDoctors(specialistId: string,
    filters: any,
    options: any
  ){
    // Has issue .. 
    // Business logic: Build the aggregation pipeline
    // const pipeline = [
    //   // Get all document for this specialist to get all patients..
    //   {
    //     $match: {
    //       specialistId: new mongoose.Types.ObjectId(specialistId),
    //       isDeleted: { $ne: true }
    //     }
    //   },
    //   // Join with doctorPatient to get doctors for each patient
    //   {
    //     $lookup: {
    //       from: 'doctorpatients',
    //       let: { patientId: '$patientId' },
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: {
    //               $and: [
    //                 { $eq: ['$patientId', '$$patientId'] },
    //                 { $ne: ['$isDeleted', true] }
    //               ]
    //             }
    //           }
    //         },
    //         {
    //           $lookup: {
    //             from: 'users',
    //             localField: 'doctorId',
    //             foreignField: '_id',
    //             as: 'doctor'
    //           }
    //         },
    //         {
    //           $unwind: {
    //             path: '$doctor',
    //             preserveNullAndEmptyArrays: true
    //           }
    //         }
    //       ]
    //     }
    //   },
    //   // Join with user to get patient details
    //   {
    //     $lookup: {
    //       from: 'users',
    //       localField: 'patientId',
    //       foreignField: '_id',
    //       as: 'patient'
    //     }
    //   },
    //   {
    //     $unwind: {
    //       path: '$patient',
    //       preserveNullAndEmptyArrays: true
    //     }
    //   },
    //   // Project only needed fields
    //   {
    //     $project: {
    //       _id: 1,
    //       createdAt: 1,
    //       updatedAt: 1,
    //       patient: {
    //         _id: 1,
    //         name: 1,
    //         email: 1,
    //         profileImage: 1,
    //         avatar: 1
    //       },
    //       doctors: '$doctor'
    //     }
    //   } 
    // ];

    const pipeline = [
      // Get all documents for this specialist to get all patients
      {
        $match: {
          specialistId: new mongoose.Types.ObjectId(specialistId),
          isDeleted: { $ne: true }
        }
      },
      // Join with doctorPatient to get doctors for each patient
      {
        $lookup: {
          from: 'doctorpatients',
          let: { patientId: '$patientId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$patientId', '$$patientId'] },
                    { $ne: ['$isDeleted', true] }
                  ]
                }
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'doctorId',
                foreignField: '_id',
                as: 'doctor'
              }
            },
            {
              $unwind: {
                path: '$doctor',
                preserveNullAndEmptyArrays: true
              }
            }
          ],
          as: 'doctorPatients'
        }
      },
      // Join with user to get patient details
      {
        $lookup: {
          from: 'users',
          localField: 'patientId',
          foreignField: '_id',
          as: 'patient'
        }
      },
      {
        $unwind: {
          path: '$patient',
          preserveNullAndEmptyArrays: true
        }
      },
      
      // Project only needed fields
      {
        $project: {
          _id: 1,
          createdAt: 1, // this is actually connect date .. 
          patient: {
            _id: 1,
            name: 1,
          
            profileImage: 1,
            
            subscriptionType: 1
          },
          //---------------------------------
          // return all doctor objects ..
          //---------------------------------
          // doctors: '$doctorPatients.doctor', // Array of doctors
          
          //---------------------------------
          // return array of doctor names .. instead of objects
          //---------------------------------
          // doctors: {
          //   $map: {
          //     input: {
          //       $filter: {
          //         input: '$doctorPatients',
          //         cond: { $ne: ['$$this.doctor', null] }
          //       }
          //     },
          //     as: 'docPatient',
          //     in: '$$docPatient.doctor.name'
          //   }
          // }

          //---------------------------------
          // return array of doctor object .. which has only name and id
          //---------------------------------
          doctors: {
            $map: {
              input: '$doctorPatients.doctor',
              as: 'doc',
              // in: '$$doc.name'
              in: {
                _id: '$$doc._id',
                name: '$$doc.name'
              }
            }
          },
        }
      }
    ];

    // Use pagination service for aggregation
    return await PaginationService.aggregationPaginate(SpecialistPatient, pipeline,
      options
    );
  }
  
  async getUnknownSpecialistsForPatient(patientId: string, 
    // options: PaginateOptions = {}
    filters : any,
    options :any
  ) {
    
    //📈⚙️ OPTIMIZATION: 
    const pipeline = [
      // Match all specialists
      {
        $match: {
          role: 'specialist',
          isDeleted: { $ne: true }
        }
      },
      // Left join with specialistpatient relationship
      {
        $lookup: {
          from: 'specialistpatients',
          let: { specialistId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$specialistId', '$$specialistId'] },
                    { $eq: ['$patientId', new mongoose.Types.ObjectId(patientId)] },
                    { $ne: ['$isDeleted', true] }
                  ]
                }
              }
            }
          ],
          as: 'relationship'
        }
      },
      // Filter out doctors with existing relationship
      {
        $match: {
          'relationship.0': { $exists: false }
        }
      },
      /********************************* */

      {
      $lookup: {
        from: 'userprofiles', // References 'UserProfile' collection
        localField: 'profileId',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              description: 1,
              approvalStatus: 1,
              howManyPrograms: 1, 
              protocolNames : 1
            }
          }
        ],
        as: 'profile'
      }
    },
    {
      $unwind: {
        path: '$profile',
        preserveNullAndEmptyArrays: true
      }
    },

      /********************************* */
      // Project only needed fields
      {
        $project: {
          _id: 1,
          name: 1,
          profileImage : 1,
          avatar: 1,
          profile: 1
        }
      }
    ];

    // Use pagination service for aggregation
    return await PaginationService.aggregationPaginate(SpecialistPatient, pipeline,
      //  {
      //   page: options.page,
      //   limit: options.limit
      // }
      options
    );
  }

  //---------------------------------
  // Doctor | Protocol Section | Show all Specialist for assign to a patient
  //---------------------------------
  async getUnknownSpecialistsForPatientForAssign(patientId: string, 
    // options: PaginateOptions = {}
    filters : any,
    options :any
  ) {
    // Business logic: Build the aggregation pipeline
    const pipeline = [
        // Match all specialists
        {
          $match: {
            role: 'specialist',
            isDeleted: { $ne: true }
          }
        },
        // Left join with specialistpatient relationship
        {
          $lookup: {
            from: 'specialistpatients',
            let: { specialistId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$specialistId', '$$specialistId'] },
                      { $eq: ['$patientId', new mongoose.Types.ObjectId(patientId)] },
                      { $ne: ['$isDeleted', true] }
                    ]
                  }
                }
              }
            ],
            as: 'relationship'
          }
        },
        // Filter out doctors with existing relationship
        {
          $match: {
            'relationship.0': { $exists: false }
          }
        },
        /********************************* */

        {
        $lookup: {
          from: 'userprofiles', // References 'UserProfile' collection
          localField: 'profileId',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                description: 1,
                approvalStatus: 1,
                howManyPrograms: 1, 
                protocolNames : 1
              }
            }
          ],
          as: 'profile'
        }
      },
      {
        $unwind: {
          path: '$profile',
          preserveNullAndEmptyArrays: true
        }
      },

      // Filter for only approved specialists
      {
        $match: {
          'profile.approvalStatus': 'approved'
        }
      },

      /********************************* */
      // Project only needed fields
      {
        $project: {
          _id: 1,
          name: 1,
          profileImage : 1,
          avatar: 1,
          profile: 1
        }
      }
    ];


    const result = await User.aggregate(pipeline).exec();

    return result;

    /************
    // Use pagination service for aggregation
    return await PaginationService.aggregationPaginate(User, pipeline,
      //  {
      //   page: options.page,
      //   limit: options.limit
      // }
      options
    );
    ********* */
  }
}
