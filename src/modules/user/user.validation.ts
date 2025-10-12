//@ts-ignore
import mongoose from 'mongoose';
//@ts-ignore
import { z } from 'zod';
import { TApprovalStatus } from './userProfile/userProfile.constant';

export const changeApprovalStatusValidationSchema = z.object({
  // body: z.object({
    
  // }),

  // params: z.object({
  //   id: z.string().optional(),
  // }),
  query: z.object({
    userId: z.string({
      required_error: 'userId is required, userId must be a string.',
      invalid_type_error: 'userId must be a string.',
    }).refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: 'Invalid userId format. Must be a valid MongoDB ObjectId.',
    }),
    approvalStatus: z.enum([
      TApprovalStatus.approved,
      TApprovalStatus.rejected,
      // 'approved',
      // 'rejected'
    ])
    // .optional()
    ,
  }),
   
});
