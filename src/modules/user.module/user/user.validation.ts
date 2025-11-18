//@ts-ignore
import mongoose from 'mongoose';
//@ts-ignore
import { z } from 'zod';

export const sendInvitationToBeAdminValidationSchema = z.object({

  body: z.object({
    email : z.
      string({
        required_error: 'email is required.',
        invalid_type_error: 'email must be a string.',
      })
      .email('Invalid email address.'),
    password : z
      .string({
        required_error: 'password is required.',
        invalid_type_error: 'password must be a string.',
      }),
      
    name: z.string({
      required_error: 'name is required.',
      invalid_type_error: 'name must be a string.',
    }),
  
    role :  z.string({
        required_error: 'role is required.',
        invalid_type_error: 'role must be a string.',
      }),
    message :  z.string({
        required_error: 'message is required.',
        invalid_type_error: 'message must be a string.',
      })
    
    }),
});