//TODO : MUST : use generic service here ..
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { INotification } from './notification.interface';
import { Notification } from './notification.model';
import { User } from '../user.module/user/user.model';
import { PaginateOptions, PaginateResult } from '../../types/paginate';
import ApiError from '../../errors/ApiError';

const addNotification = async (
  payload: INotification
): Promise<INotification> => {
  // Save the notification to the database
  const result = await Notification.create(payload);
  return result;
};

const getALLNotification = async (
  filters: Partial<INotification>,
  options: PaginateOptions,
  userId: string
) => {
  filters.receiverId = userId;

  const unViewNotificationCount = await Notification.countDocuments({
    receiverId: userId,
    viewStatus: false,
  });

  options.sortBy='-createdAt';

  const result = await Notification.paginate(filters, options);
  return { ...result, unViewNotificationCount };
};

const getAdminNotifications = async (
  filters: Partial<INotification>,
  options: PaginateOptions
): Promise<PaginateResult<INotification>> => {
  
  filters.receiverRole = 'admin'; // Important SQL
  options.sortBy='-createdAt'

  return Notification.paginate(filters, options);
};

const getSingleNotification = async (
  notificationId: string
): Promise<INotification | null> => {
  const result = await Notification.findById(notificationId);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
  }
  return result;
};



const viewNotification = async (notificationId: string) => {
  const result = await Notification.findByIdAndUpdate(
    notificationId,
    { viewStatus: true },
    { new: true }
  );
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
  }
  return result;
};

// Test korte hobe .. 
const deleteNotification = async (notificationId: string) => {
  const result = await Notification.findByIdAndDelete(notificationId);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
  }
  return result;
};

// Test korte hobe ... 
const clearAllNotification = async (userId: string) => {
  const user = await User.findById(userId);
  if (user?.role === 'projectManager') {
    const result = await Notification.deleteMany({ role: 'projectManager' });
    return result;
  }
  const result = await Notification.deleteMany({ receiverId: userId });
  return result;
};

export const NotificationService = {
  addNotification,
  getALLNotification,
  getAdminNotifications,
  getSingleNotification,
  viewNotification,
  deleteNotification,
  clearAllNotification,
};
