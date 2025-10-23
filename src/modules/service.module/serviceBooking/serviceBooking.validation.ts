//@ts-ignore
import mongoose from 'mongoose';
//@ts-ignore
import { z } from 'zod';

export const bookAServiceValidationSchema = z.object({
  body: z.object({
     // TODO : later we have to convert this string to date .. 
    bookingDateTime : z.string({ // TODO : it should be Date
      required_error: 'bookingDateTime is required.',
      invalid_type_error: 'bookingDateTime must be a string.',
    }),
    
    address: z.string({
      required_error: 'address is required.',
      invalid_type_error: 'address must be a string.',
    }),

    lat: z.string({
      required_error: 'lat is required.',
      invalid_type_error: 'lat must be a string.',
    }),

    long: z.string({
      required_error: 'long is required.',
      invalid_type_error: 'long must be a string.',
    }),

    providerId: z.string({
        required_error: 'id is required in params.',
        invalid_type_error: 'id must be a mongoose object.',
      }).refine(value => mongoose.Types.ObjectId.isValid(value), {
        message: 'id must be a valid mongoose ObjectId.',
      }),
  }),

  // params: z.object({
  //   id: z.string().optional(),
  // }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
   
});
