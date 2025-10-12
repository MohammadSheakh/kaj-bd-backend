//@ts-ignore
import mongoose from 'mongoose';
//@ts-ignore
import { z } from 'zod';

export const assignSpecialistForAPatientValidationSchema = z.object({
  body: z.object({
    patientId : z.string({
      required_error: 'patientId is required in params.',
      invalid_type_error: 'patientId must be a mongoose object.',
    }).refine(value => mongoose.Types.ObjectId.isValid(value), {
      message: 'patientId must be a valid mongoose ObjectId.',
    }),

    specialistId : z.string({
      required_error: 'specialistId is required in params.',
      invalid_type_error: 'specialistId must be a mongoose object.',
    }).refine(value => mongoose.Types.ObjectId.isValid(value), {
      message: 'specialistId must be a valid mongoose ObjectId.',
    }),
  }),

  // params: z.object({
  //   id: z.string().optional(),
  // }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
   
});






