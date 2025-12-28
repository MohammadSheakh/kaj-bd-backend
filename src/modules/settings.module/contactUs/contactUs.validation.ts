//@ts-ignore
import mongoose from 'mongoose';
//@ts-ignore
import { z } from 'zod';

export const createContactUsInformationValidationSchema = z.object({
  body: z.object({
    email: z  
    .string({
        required_error: 'email is required, email must be a string.',
        invalid_type_error: 'email must be a string.',
      }).email('Invalid email address.'),

    detailsOverview: z  
    .string({
        required_error: 'detailsOverview is required, detailsOverview must be a string.',
        invalid_type_error: 'detailsOverview must be a string.',
      }),  

    phoneNumber: z  
    .string({
        required_error: 'phoneNumber is required, phoneNumber must be a string.',
        invalid_type_error: 'phoneNumber must be a string.',
      }),
  }),

  // params: z.object({
  //   id: z.string().optional(),
  // }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
   
});






