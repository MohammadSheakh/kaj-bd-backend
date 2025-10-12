//@ts-ignore
import mongoose from 'mongoose';
//@ts-ignore
import { z } from 'zod';

export const createOrUpdateBankInfoValidationSchema = z.object({
  body: z.object({
    
    bankAccountNumber: z
      .string({
        required_error: 'bankAccountNumber is required',
        invalid_type_error: 'bankAccountNumber must be a string',
      })
      .min(2, { message: 'bankAccountNumber must be at least 5 characters long' }),

    bankRoutingNumber: z
      .string({
        required_error: 'bankRoutingNumber is required',
        invalid_type_error: 'bankRoutingNumber must be a string',
      })
      .min(2, { message: 'bankRoutingNumber must be at least 5 characters long' }),

    bankAccountHolderName: z
      .string({
        required_error: 'bankAccountHolderName is required',
        invalid_type_error: 'bankAccountHolderName must be a string',
      })
      .min(2, { message: 'bankAccountHolderName must be at least 2 characters long' }),

    bankAccountType: z.enum(['savings', 'current'], {
      required_error: 'bankAccountType is required',
      invalid_type_error: 'bankAccountType must be either "savings" or "current"',
    }),

    bankBranch: z
      .string({
        required_error: 'bankBranch is required',
        invalid_type_error: 'bankBranch must be a string',
      })
      .min(2, { message: 'bankBranch must be at least 2 characters long' }),

    bankName: z
      .string({
        required_error: 'bankName is required',
        invalid_type_error: 'bankName must be a string',
      })
      .min(2, { message: 'bankName must be at least 2 characters long' }),

  }),

  // params: z.object({
  //   id: z.string().optional(),
  // }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
   
});






