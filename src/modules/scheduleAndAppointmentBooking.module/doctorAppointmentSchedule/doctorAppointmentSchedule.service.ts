//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { DoctorAppointmentSchedule } from './doctorAppointmentSchedule.model';
import { IDoctorAppointmentSchedule } from './doctorAppointmentSchedule.interface';
import { GenericService } from '../../_generic-module/generic.services';
//@ts-ignore
import { DateTime } from 'luxon';
import { toLocalTime, toUTCTime } from '../../../utils/timezone';
import { PaginateOptions } from '../../../types/paginate';
import PaginationService from '../../../common/service/paginationService';
//@ts-ignore
import mongoose from 'mongoose';
import { scheduleQueue } from '../../../helpers/bullmq/bullmq';
import { logger } from '../../../shared/logger';
//@ts-ignore
import colors from 'colors';
import { formatDelay } from '../../../utils/formatDelay';


export class DoctorAppointmentScheduleService extends GenericService<
  typeof DoctorAppointmentSchedule,
  IDoctorAppointmentSchedule
> {
  constructor() {
    super(DoctorAppointmentSchedule);
  }

  async createV2(data:IDoctorAppointmentSchedule, userTimeZone: string) : Promise<IDoctorAppointmentSchedule> {
    /********
     * 📝
     * Here first we have to check 
     * scheduleDate , startTime , endTime
     * -------------------------------
     * date time valid or not 
     * ****** */
    if(data.scheduleDate && data.startTime && data.endTime) {
        const scheduleDate = new Date(data.scheduleDate);
        
        data.startTime = toUTCTime(data.startTime, userTimeZone);
        data.endTime = toUTCTime(data.endTime, userTimeZone);

        if(isNaN(scheduleDate.getTime()) || isNaN(data.startTime.getTime()) || isNaN(data.endTime.getTime())) {
            throw new Error('Invalid date or time format');
        }

        if(data.startTime >= data.endTime) {
            throw new Error('Start time must be before end time');
        }
        const now = new Date();
        if(data.startTime < now) {
            throw new Error('Start time must be in the future');
        }

        // Check for overlapping schedules for the same doctor
        const overlappingSchedule = await DoctorAppointmentSchedule.findOne({
            doctorId: data.createdBy,
            scheduleDate: scheduleDate,
            $or: [
                {
                    startTime: { $lt: data.endTime },
                    endTime: { $gt: data.startTime }
                }
            ]
        });

        if(overlappingSchedule) {
            throw new Error('Overlapping schedule exists for the doctor');
        }
    } else {
        throw new Error('scheduleDate, startTime and endTime are required');
    }
    const createdDoc = await this.model.create(data);

    
    addToBullQueueToExpireDoctorAppointmentScheduleAfterEndTime(createdDoc);


    // Convert back to user's timezone before returning
    const transformedDoc = {
        ...createdDoc.toObject(), // or .toJSON() if you prefer
        
        startTime: toLocalTime(createdDoc.startTime, userTimeZone),
        endTime:  toLocalTime(createdDoc.endTime, userTimeZone),
    };

    return transformedDoc;

  }
 
  // ⚙️
  async getAllAvailableScheduleAndRecentBookedScheduleOfDoctor(filters:any, options: PaginateOptions, populateOptions:any, patientId:string) : Promise<any> {
    const pipeline = [
        // 1. Match schedules for the doctor
        {
            $match: {
                createdBy: new mongoose.Types.ObjectId(filters.createdBy), // 👈 your doctor ID
            }
        },

        // 2. Lookup recent bookings by this patient (max 3, sorted by latest first)
        {
            $lookup: {
            from: "doctorpatientschedulebookings", // 👈 your booking collection name
            let: { scheduleId: "$_id" },
            pipeline: [
                {
                    $match: {
                        $expr: { $eq: ["$doctorScheduleId", "$$scheduleId"] },
                        patientId: new mongoose.Types.ObjectId(patientId) // 👈 your patient ID
                    }
                },
                {
                    $sort: { createdAt: -1 } // or use scheduleDate if no createdAt
                },
                {
                    $limit: 3 // Only get the latest booking for this schedule (if multiple exist)
                },
                {
                    $project: {
                        _id: 1,
                        status: 1,
                        scheduleDate: 1,
                        patientId: 1,
                        startTime: 1,
                        endTime: 1,
                        // Add any other fields you need from booking
                    }
                }
            ],
            as: "patientBookings"
            }
        },
        // 
        // {
        //     $unwind: "$patientBookings",
        // },

        {  // Fixed with proper syntax ✅ CRITICAL: Unwind to create 1 doc per booking
            $unwind: {
                path: "$patientBookings",
                preserveNullAndEmptyArrays: true
            }
        },


        // 3. Unwind + add fields (flatten the booking info into root)
        // {
        //     $addFields: {
        //     patientBooking: { $arrayElemAt: ["$patientBookings", 0] } // Get first (latest) booking
        //     }
        // },

        // 4. Project final shape — inject booking fields into schedule
        {
            $project: {
                _id: 1,
                scheduleName: 1,
                description: 1,
                createdBy: 1,
                scheduleDate: 1,
                startTime: 1,
                endTime: 1,
                scheduleStatus: 1,
                booked_by: 1,

                // ✅ Include meeting info
                // meetingLink: 1,
                // typeOfLink: 1,
                typeOfLink: {
                    $cond: {
                        if: {
                            $in: [
                                "$patientBookings.status",
                                ["scheduled", "completed"] // 👈 your allowed statuses
                            ]
                        },
                        then: "$typeOfLink",
                        else: null
                    }
                },
                meetingLink: {
                    $cond: {
                        if: {
                            $in: [
                                "$patientBookings.status",
                                ["scheduled", "completed"]
                            ]
                        },
                        then: "$meetingLink",
                        else: null
                    }
                },

                // ✅ Return full array of bookings
                patientBookings: 1, // ← This includes all bookings with _id, status, etc.
      
                // 👇 Booking fields — will be null for S2, S3 👇 Inject booking info if exists
                // patientBookingId: "$patientBookings._id",
                // patientBookingStatus: "$patientBookings.status",
                // patientBookingScheduleDate: "$patientBookings.scheduleDate",
                // patientBookingCreatedAt: "$patientBookings.createdAt",


                // 👇 Optional: include if you want to know if this schedule is booked by this patient
                // isBookedByPatient: { $ne: ["$patientBookings", null] } // true for S1, false for S2/S3
                // isBookedByPatient: { $gt: [{ $size: "$patientBookings" }, 0] },
                
               
                //**** latestBookingStatus: { $arrayElemAt: ["$patientBookings.status", 0] } // optional
                
            }
        },

        // 5. Optional: Sort schedules (e.g., by date ascending)
        {
            $sort: { scheduleDate: 1, startTime: 1 }
        }
    ];

    return await PaginationService.aggregationPaginate(DoctorAppointmentSchedule, pipeline,
      //  {
      //   page: options.page,
      //   limit: options.limit
      // }
      options
    );
  }
}


/*********
 * we actually expire this one and create a new schedule for next day ..
 * because making the same schedule free for the next day is not good .. it create 
 * complexity
 * ******** */
async function addToBullQueueToExpireDoctorAppointmentScheduleAfterEndTime(
    createdDoctorSchedule : IDoctorAppointmentSchedule){

    const endTime = new Date(createdDoctorSchedule.endTime);

    const now = Date.now();
    
    const delay = endTime.getTime() - now;
    
    if (delay > 0) {
        await scheduleQueue.add(
            "expireDoctorAppointmentScheduleAfterEndTime",
            { 
                scheduleId: createdDoctorSchedule._id,
            },
            { delay }
        );
        /*************
            Retries & Backoff

            Currently if a job fails, it just logs.

            You should configure retries (e.g. 3–5 retries with exponential backoff).
            {
                attempts: 5, // retry 5 times
                backoff: { type: "exponential", delay: 5000 }, // 5s, 10s, 20s...
                removeOnComplete: true,
                removeOnFail: false, // keep failed jobs for inspection
            }
        ********** */

        // ${delay / 1000}s -> 
        console.log(`⏰ Job added to expire schedule ${createdDoctorSchedule._id} in ${formatDelay(delay)} `);
        logger.info(colors.green(`⏰ Job added to expire schedule ${createdDoctorSchedule._id} in ${formatDelay(delay)} `));
    }
}



/************
 const pipelineV2Claude = [
        // 1. Match schedules for the doctor
        {
            $match: {
                createdBy: new mongoose.Types.ObjectId(filters.createdBy), // 👈 your doctor ID
            }
        },

        // 2. Lookup recent bookings by this patient (max 3, sorted by latest first)
        {
            $lookup: {
                from: "doctorpatientschedulebookings", // 👈 your booking collection name
                let: { scheduleId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$doctorScheduleId", "$$scheduleId"] },
                            patientId: new mongoose.Types.ObjectId(patientId) // 👈 your patient ID
                        }
                    },
                    {
                        $sort: { createdAt: -1 } // or use scheduleDate if no createdAt
                    },
                    {
                        $limit: 3 // Only get the latest 3 bookings for this schedule
                    },
                    {
                        $project: {
                            _id: 1,
                            status: 1,
                            scheduleDate: 1,
                            patientId: 1,
                            startTime: 1,
                            endTime: 1,
                            // Add any other fields you need from booking
                        }
                    }
                ],
                as: "patientBookings"
            }
        },

        // 3. Add a field to create multiple documents
        {
            $addFields: {
                documentsToCreate: {
                    $cond: {
                        if: { $gt: [{ $size: "$patientBookings" }, 0] },
                        // If there are bookings, create array with bookings + one extra for rebooking
                        then: {
                            $concatArrays: [
                                "$patientBookings",
                                [null] // Add null element for rebooking option
                            ]
                        },
                        // If no bookings, create array with one null element
                        else: [null]
                    }
                }
            }
        },

        // 4. Unwind to create separate documents
        {
            $unwind: {
                path: "$documentsToCreate",
                preserveNullAndEmptyArrays: true
            }
        },

        // 5. Project final shape — inject booking fields into schedule
        {
            $project: {
                _id: 1,
                scheduleName: 1,
                description: 1,
                createdBy: 1,
                scheduleDate: 1,
                startTime: 1,
                endTime: 1,
                scheduleStatus: 1,
                booked_by: 1,

                // ✅ Include meeting info only for scheduled/completed bookings
                typeOfLink: {
                    $cond: {
                        if: {
                            $and: [
                                { $ne: ["$documentsToCreate", null] },
                                {
                                    $in: [
                                        "$documentsToCreate.status",
                                        ["scheduled", "completed"] // 👈 your allowed statuses
                                    ]
                                }
                            ]
                        },
                        then: "$typeOfLink",
                        else: null
                    }
                },
                meetingLink: {
                    $cond: {
                        if: {
                            $and: [
                                { $ne: ["$documentsToCreate", null] },
                                {
                                    $in: [
                                        "$documentsToCreate.status",
                                        ["scheduled", "completed"]
                                    ]
                                }
                            ]
                        },
                        then: "$meetingLink",
                        else: null
                    }
                },

                // ✅ Current booking info (will be null for the rebooking document)
                currentBooking: "$documentsToCreate",
                
                // ✅ Full array of all patient bookings for reference
                allPatientBookings: "$patientBookings",

                // ✅ Flag to identify if this is a rebooking option
                isRebookingOption: { $eq: ["$documentsToCreate", null] },
                
                // ✅ Flag to identify if patient has any bookings for this schedule
                hasExistingBookings: { $gt: [{ $size: "$patientBookings" }, 0] }
            }
        },

        // 6. Optional: Sort schedules (e.g., by date ascending)
        {
            $sort: { 
                scheduleDate: 1, 
                startTime: 1,
                isRebookingOption: 1 // This will put rebooking options first within same schedule
            }
        }
    ];
 * ********** */

/***************
 
const pipeline = [
        // 1. Match schedules for the doctor
        {
            $match: {
                createdBy: new mongoose.Types.ObjectId(filters.createdBy), // 👈 your doctor ID
            }
        },

        // 2. Lookup recent bookings by this patient (max 3, sorted by latest first)
        {
            $lookup: {
            from: "doctorpatientschedulebookings", // 👈 your booking collection name
            let: { scheduleId: "$_id" },
            pipeline: [
                {
                    $match: {
                        $expr: { $eq: ["$doctorScheduleId", "$$scheduleId"] },
                        patientId: new mongoose.Types.ObjectId(patientId) // 👈 your patient ID
                    }
                },
                {
                    $sort: { createdAt: -1 } // or use scheduleDate if no createdAt
                },
                {
                    $limit: 3 // Only get the latest booking for this schedule (if multiple exist)
                },
                {
                    $project: {
                        _id: 1,
                        status: 1,
                        scheduleDate: 1,
                        patientId: 1,
                        startTime: 1,
                        endTime: 1,
                        // Add any other fields you need from booking
                    }
                }
            ],
            as: "patientBookings"
            }
        },
        // 
        // {
        //     $unwind: "$patientBookings",
        // },

        {  // Fixed with proper syntax ✅ CRITICAL: Unwind to create 1 doc per booking
            $unwind: {
                path: "$patientBookings",
                preserveNullAndEmptyArrays: true
            }
        },


        // 3. Unwind + add fields (flatten the booking info into root)
        // {
        //     $addFields: {
        //     patientBooking: { $arrayElemAt: ["$patientBookings", 0] } // Get first (latest) booking
        //     }
        // },

        // 4. Project final shape — inject booking fields into schedule
        {
            $project: {
                _id: 1,
                scheduleName: 1,
                description: 1,
                createdBy: 1,
                scheduleDate: 1,
                startTime: 1,
                endTime: 1,
                scheduleStatus: 1,
                booked_by: 1,

                // ✅ Include meeting info
                // meetingLink: 1,
                // typeOfLink: 1,
                typeOfLink: {
                    $cond: {
                        if: {
                            $in: [
                                "$patientBookings.status",
                                ["scheduled", "completed"] // 👈 your allowed statuses
                            ]
                        },
                        then: "$typeOfLink",
                        else: null
                    }
                },
                meetingLink: {
                    $cond: {
                        if: {
                            $in: [
                                "$patientBookings.status",
                                ["scheduled", "completed"]
                            ]
                        },
                        then: "$meetingLink",
                        else: null
                    }
                },

                // ✅ Return full array of bookings
                patientBookings: 1, // ← This includes all bookings with _id, status, etc.
      
                // 👇 Booking fields — will be null for S2, S3 👇 Inject booking info if exists
                // patientBookingId: "$patientBookings._id",
                // patientBookingStatus: "$patientBookings.status",
                // patientBookingScheduleDate: "$patientBookings.scheduleDate",
                // patientBookingCreatedAt: "$patientBookings.createdAt",


                // 👇 Optional: include if you want to know if this schedule is booked by this patient
                // isBookedByPatient: { $ne: ["$patientBookings", null] } // true for S1, false for S2/S3
                // isBookedByPatient: { $gt: [{ $size: "$patientBookings" }, 0] },
                
               
                //**** latestBookingStatus: { $arrayElemAt: ["$patientBookings.status", 0] } // optional
                
            }
        },

        // 5. Optional: Sort schedules (e.g., by date ascending)
        {
            $sort: { scheduleDate: 1, startTime: 1 }
        }
    ];

    ************* */