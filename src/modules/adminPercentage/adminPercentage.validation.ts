//@ts-ignore
import mongoose from 'mongoose';
//@ts-ignore
import { z } from 'zod';

export const createAdminPercentageValidationSchema = z.object({
  body: z.object({
    percentage: z  
    .number({
        required_error: 'percentage is required, percentage must be a number.',
        invalid_type_error: 'percentage must be a number.',
      })
  }),

  // params: z.object({
  //   id: z.string().optional(),
  // }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
   
});






