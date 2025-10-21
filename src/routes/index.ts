//@ts-ignore
import express from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { AttachmentRoutes } from '../modules/attachments/attachment.route';
import { NotificationRoutes } from '../modules/notification/notification.routes';
import { SettingsRoutes } from '../modules/settings/settings.routes';
import { ConversationRoute } from '../modules/chatting.module/conversation/conversation.route';
import { MessageRoute } from '../modules/chatting.module/message/message.route';
import { PaymentTransactionRoute } from '../modules/payment.module/paymentTransaction/paymentTransaction.route';
import stripeAccountRoutes from '../modules/payment.module/stripeAccount/stripeAccount.route';
import { informationVideoRoute } from '../modules/extra.module/informationVideo/informationVideo.route';
import { UserRoutes } from '../modules/user.module/user/user.route';
import { WalletTransactionHistoryRoute } from '../modules/wallet.module/walletTransactionHistory/walletTransactionHistory.route';
import { BankInfoRoute } from '../modules/wallet.module/bankInfo/bankInfo.route';
import { WithdrawalRequstRoute } from '../modules/wallet.module/withdrawalRequst/withdrawalRequst.route';
import { ServiceProvider } from '../modules/service.module/serviceProvider/serviceProvider.model';
import { ServiceProviderRoute } from '../modules/service.module/serviceProvider/serviceProvider.route';
import { ServiceCategoryRoute } from '../modules/service.module/serviceCategory/serviceCategory.route';

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
  // {
  //   path: '/admin',
  //   route: AdminRoutes,
  // },

  ////////////////////// Created By Mohammad Sheakh

  {
    path: '/settings',
    route: SettingsRoutes,
  },

  //////////////////////////////////////////// Cart Order
  

  ///////////////////////////////////////// Payment Transaction
  // { // 🟢
  //   path: '/payment-transactions',
  //   route: PaymentTransactionRoute,
  // },

  ///////////////////////////////////////// Chatting 
  { // 🟢
    path: '/conversations',
    route: ConversationRoute,
  },
  { // 🟢
    path: '/information-videos',
    route: informationVideoRoute,
  },
  ////////////////////////////////////////////  Person Relationship
  // { // 🟢
  //   path: '/doctor-appointments',
  //   route: DoctorAppointmentScheduleRoute,
  // },
  
  // { // 🟢
  //   path: '/doctor-appointments/bookings',
  //   route: DoctorPatientScheduleBookingRoute,
  // },

  ///////////////////////////////////////////// Person Relationships
  

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
  // {
  //   path: '/payments',
  //   route: PaymentTransactionRoute,
  // },

  //////////////////////////////////////// Subscription
  // {  // 🟢 from kappes
  //   path: '/stripe',
  //   route: stripeAccountRoutes,
  // },
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
  }
  
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
