//@ts-ignore
import express from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { AttachmentRoutes } from '../modules/attachments/attachment.route';
import { NotificationRoutes } from '../modules/notification/notification.routes';
import { ConversationRoute } from '../modules/chatting.module/conversation/conversation.route';
import { MessageRoute } from '../modules/chatting.module/message/message.route';
import { PaymentTransactionRoute } from '../modules/payment.module/paymentTransaction/paymentTransaction.route';
import stripeAccountRoutes from '../modules/payment.module/stripeAccount/stripeAccount.route';
import { UserRoutes } from '../modules/user.module/user/user.route';
import { WalletTransactionHistoryRoute } from '../modules/wallet.module/walletTransactionHistory/walletTransactionHistory.route';
import { BankInfoRoute } from '../modules/wallet.module/bankInfo/bankInfo.route';
import { WithdrawalRequstRoute } from '../modules/wallet.module/withdrawalRequst/withdrawalRequst.route';
import { ServiceProviderRoute } from '../modules/service.module/serviceProvider/serviceProvider.route';
import { ServiceCategoryRoute } from '../modules/service.module/serviceCategory/serviceCategory.route';
import { ServiceBookingRoute } from '../modules/service.module/serviceBooking/serviceBooking.route';
import { ReviewRoute } from '../modules/service.module/review/review.route';
import { ContactUsRoute } from '../modules/settings.module/contactUs/contactUs.route';
import { SettingsRoutes } from '../modules/settings.module/settings/settings.routes';
import { AdditionalCostRoute } from '../modules/service.module/additionalCost/additionalCost.route';
import { BannerRoute } from '../modules/banner/banner.route';
import { AdminPercentageRoute } from '../modules/adminPercentage/adminPercentage.route';
import { SupportMessageRoute } from '../modules/supportMessage/supportMessage.route';
import { AgoraCallingRoute } from '../modules/chatting.module/agoraCalling/agoraCalling.route';

// import { ChatRoutes } from '../modules/chat/chat.routes';
// import { MessageRoutes } from '../modules/message/message.routes';
const router = express.Router();

const apiRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/notifications',
    route: NotificationRoutes,
  },

  ////////////////////// Created By Mohammad Sheakh

  ///////////////////////////////////////// Support Message
  { // 🟢
    path: '/support-messages',
    route: SupportMessageRoute,
  },

  ///////////////////////////////////////// 
  { // 🟢
    path: '/banners',
    route: BannerRoute,
  },
  
  ///////////////////////////////////////// Payment Transaction
  { // 🟢
    path: '/payment-transactions',
    route: PaymentTransactionRoute,
  },

  ///////////////////////////////////////// Chatting 
  { // 🟢
    path: '/conversations',
    route: ConversationRoute,
  },
  // { // 🟢
  //   path: '/information-videos',
  //   route: informationVideoRoute,
  // },
  ////////////////////////////////////////////  Person Relationship
  // { // 🟢
  //   path: '/doctor-appointments',
  //   route: DoctorAppointmentScheduleRoute,
  // },
  
  // { // 🟢
  //   path: '/doctor-appointments/bookings',
  //   route: DoctorPatientScheduleBookingRoute,
  // },

  ///////////////////////////////////////////// Admin Percentage
  {
    path: '/admin-percentage',
    route: AdminPercentageRoute,
  },
  
  ///////////////////////////////////////////// Service Booking
  {
    path: '/service-bookings',
    route: ServiceBookingRoute,
  },

  ///////////////////////////////////////////// Service Provider
  {
    path: '/service-providers',
    route: ServiceProviderRoute,
  },
  ///////////////////////////////////////////// Service Categories
  {
    path: '/service-categories',
    route: ServiceCategoryRoute,
  },
  ///////////////////////////////////////////// Settings And Contact Us
  {
    path: '/settings',
    route: SettingsRoutes,
  },
  {
    path: '/contact-us',
    route: ContactUsRoute,
  },
  ///////////////////////////////////////////// Reviews
  {
    path: '/reviews',
    route: ReviewRoute,
  },
  {
    path: '/attachments',
    route: AttachmentRoutes,
  },
  {
    path: '/activitys',
    route: NotificationRoutes,
  },
  {
    path: '/messages',
    route: MessageRoute,
  },
  {
    path: '/call',
    route: AgoraCallingRoute,
  },

  // {
  //   path: '/payments',
  //   route: PaymentTransactionRoute,
  // },

  //////////////////////////////////////// Subscription Or Purchase
  // {  // 🟢 from kappes
  //   path: '/stripe',
  //   route: stripeAccountRoutes,
  // },
  {  // 🟢 from kappes
    path: '/ssl',
    route: stripeAccountRoutes,
  },
  ///////////////////////////////////////////// Wallet
  { // 🟢
    path: '/wallet-transactions',
    route: WalletTransactionHistoryRoute,
  },
  { // 🟢
    path: '/withdrawal-requst',
    route: WithdrawalRequstRoute,
  },
  { // 🟢
    path: '/bank-info',
    route: BankInfoRoute,
  },
  { // 🟢
    path: '/additional-cost',
    route: AdditionalCostRoute,
  }
  
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
