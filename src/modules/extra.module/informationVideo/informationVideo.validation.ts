//@ts-ignore
import mongoose from 'mongoose';
//@ts-ignore
import { z } from 'zod';

export const createInfomationVideoValidationSchema = z.object({
  body: z.object({
    videoLink: z  
    .string({
        required_error: 'videoLink is required, videoLink must be a string.',
        invalid_type_error: 'videoLink must be a string.',
      }).optional(),

    title: z  
    .string({
        required_error: 'title is required, title must be a string.',
        invalid_type_error: 'title must be a string.',
      }).min(2, {
      message: 'title must be at least 2 characters long.',
    }).max(100, {
      message: 'title must be at most 100 characters long.',
    }),
    
    description: z.string({
        required_error: 'description is required, description must be a string.',
        invalid_type_error: 'description must be a string.',
      }).min(2, {
      message: 'description must be at least 2 characters long.',
    }).max(1000, {
      message: 'description must be at most 1000 characters long.',
    }),
  }),
  // params: z.object({
  //   id: z.string().optional(),
  // }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
});






