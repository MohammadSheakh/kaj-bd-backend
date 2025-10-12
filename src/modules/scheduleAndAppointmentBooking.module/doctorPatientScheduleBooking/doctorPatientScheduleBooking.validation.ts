import mongoose from 'mongoose';
import { z } from 'zod';

export const doctorPatientScheduleBookingValidationSchema = z.object({
  // body: z.object({
  //   DoctorPatientScheduleBooking: z  
  //   .string({
  //       required_error: 'message is required, message must be a string.',
  //       invalid_type_error: 'dateOfBirth must be a string.',
  //     }).min(5, {
  //     message: 'message must be at least 5 characters long.',
  //   }).max(500, {
  //     message: 'message must be at most 500 characters long.',
  //   }),
  
  //    userId: z.string({
  //       required_error: 'id is required in params.',
  //       invalid_type_error: 'id must be a mongoose object.',
  //     }).refine(value => mongoose.Types.ObjectId.isValid(value), {
  //       message: 'id must be a valid mongoose ObjectId.',
  //     }),
  // }),

  params: z.object({
    // id: z.string().optional(),
    doctorScheduleId: z.string({
        required_error: 'doctorScheduleId is required in params.',
        invalid_type_error: 'doctorScheduleId must be a mongoose object.',
      }).refine(value => mongoose.Types.ObjectId.isValid(value), {
        message: 'doctorScheduleId must be a valid mongoose ObjectId.',
      }),
  }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
   
});






