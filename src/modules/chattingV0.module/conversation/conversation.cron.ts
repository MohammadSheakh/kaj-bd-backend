import mongoose from 'mongoose';
import { cronService } from '../../cron/cron.service';
import { Conversation } from './conversation.model';
import { MessagerService } from '../message/message.service';
import { RoleType } from '../message/message.constant';
import { Roles } from '../../../middlewares/roles';

let messageService = new MessagerService();

export const initConversationCronJobs = (): void => {
  // Schedule daily message by bot to all conversations at 9:00 AM
  // You can adjust the schedule as needed - this example is daily at 9 AM

  console.log('⌛Scheduling daily message to all conversations after 12 hours ..  ⌛');

  // cronService.schedule(
  //   'daily-conversation-message',
  //   //'0 9 * * *', // At 9:00 AM every day
  //   // '*/3 * * * *', // This will run every 3 minute for testing
  //   '0 0/12 * * *',  // This will run every 12 hours 
  //   "This will run every 12 hours", // additional message
  //   sendDailyMessageToAllConversations
  // );

  // Add any other conversation-related cron jobs here
}


