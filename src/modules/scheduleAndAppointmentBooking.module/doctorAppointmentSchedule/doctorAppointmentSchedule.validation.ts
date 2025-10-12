import mongoose from 'mongoose';
import { z } from 'zod';
import { TDoctorAppointmentScheduleStatus, TMeetingLink } from './doctorAppointmentSchedule.constant';

export const createDoctorAppointmentScheduleValidationSchema = z.object({
  body: z.object({
    scheduleName: z  
    .string({
        required_error: 'scheduleName is required, scheduleName must be a string.',
        invalid_type_error: 'scheduleName must be a string.',
      }).min(2, {
      message: 'scheduleName must be at least 2 characters long.',
    }).max(300, {
      message: 'scheduleName must be at most 300 characters long.',
    }),

    scheduleDate: z.string({ // TODO : it should be Date
      required_error: 'scheduleDate is required.',
      invalid_type_error: 'scheduleDate must be a string.',
    }), // TODO : later we have to convert this string to date .. 
    startTime: z.string({ // TODO : it should be Date
      required_error: 'startTime is required.',
      invalid_type_error: 'startTime must be a string.',
    }),
    endTime: z.string({ // TODO : it should be Date
      required_error: 'endTime is required.',
      invalid_type_error: 'endTime must be a string.',
    }),
    description: z.string({
      required_error: 'description is required.',
      invalid_type_error: 'description must be a string.',
    }),
    price: z.string({
      required_error: 'price is required.',
      invalid_type_error: 'price must be a string.',
    }),// TODO : price must be a number 
    typeOfLink: z.enum([
      TMeetingLink.zoom,
      TMeetingLink.googleMeet,
      TMeetingLink.others
    ], {
      required_error: 'typeOfLink is required.',
      invalid_type_error: 'typeOfLink must be a valid enum value.',
    }),
    meetingLink: z.string({
      required_error: 'meetingLink is required.',
      invalid_type_error: 'meetingLink must be a string.',
    }),
  }),

  // params: z.object({
  //   id: z.string().optional(),
  // }),
  // query: z.object({
  //   page: z.string().optional(),
  // }),
   
});






