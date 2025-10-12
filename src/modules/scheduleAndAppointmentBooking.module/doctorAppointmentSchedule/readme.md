🟢🟢 getAllAvailableScheduleAndRecentBookedScheduleOfDoctor

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
                
               /** V2
                * latestBookingStatus: { $arrayElemAt: ["$patientBookings.status", 0] } // optional
                */
            }
        },

        // 5. Optional: Sort schedules (e.g., by date ascending)
        {
            $sort: { scheduleDate: 1, startTime: 1 }
        }
    ];
