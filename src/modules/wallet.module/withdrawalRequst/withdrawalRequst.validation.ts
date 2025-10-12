//@ts-ignore
import mongoose from 'mongoose';
//@ts-ignore
import { z } from 'zod';

export const createWithdrawalRequstValidationSchema = z.object({
  body: z.object({
  
    requestedAmount: z.number({
      required_error: 'requestedAmount is required.',
      invalid_type_error: 'requestedAmount must be a number.',  
    })

  }),

  // params: z.object({
  //   id: z.string().optional(),
  // }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
   
});

export const updateStatusOfWithdrawalRequestValidationSchema = z.object({
  // body: z.object({

  // }),

  params: z.object({
    id: z.string({
      required_error: 'withdrawalRequestId is required.',
      invalid_type_error: 'withdrawalRequestId must be a mongoose object.',
    }).refine(value => mongoose.Types.ObjectId.isValid(value), {
      message: 'withdrawalRequestId must be a valid mongoose ObjectId in params.',
    }),
  }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
   
});
