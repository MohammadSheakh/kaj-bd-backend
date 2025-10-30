
// import { IJwtPayload } from '../auth/auth.interface';
// import { User } from '../user/user.model';
import { StripeAccount } from './stripeAccount.model';
import { successHTMLstripeConnection } from './stripeAccount.utils';
import stripe from '../../../config/paymentGateways/stripe.config';
import { User } from '../../user.module/user/user.model';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';

// user: IJwtPayload | any
const createConnectedStripeAccount = async (user: any, host: string, protocol: string): Promise<any> => {
     /*****
      * 
      * from controller we can get that host and protocol
      * req.get('host') || '', req.protocol
      * 
      * and user is req.user
      * ******* */

     const existingAccount = await StripeAccount.findOne({
          user: user.id,
     }).select('user accountId isCompleted');
     console.log('existingAccount', existingAccount);

     if (existingAccount) {
          //---------------------------------
          // if stripe account exist for a user .. we create and update account for no reason
          //---------------------------------
          if (existingAccount.isCompleted) {
               return {
                    success: false,
                    message: 'Account already exists',
                    data: existingAccount,
               };
          }

          const onboardingLink = await stripe.accountLinks.create({
               account: existingAccount.accountId,
               refresh_url: `${protocol}://${host}/api/v1/payments/refreshAccountConnect/${existingAccount.accountId}`,
               return_url: `${protocol}://${host}/api/v1/payments/success-account/${existingAccount.accountId}`,
               type: 'account_onboarding',
          });
          // console.log('onboardingLink-1', onboardingLink);

          return {
               success: true,
               message: 'Please complete your account',
               url: onboardingLink.url,
          };
     }

     //---------------------------------
     // if no account found .. create stripe account
     //---------------------------------
     const account = await stripe.accounts.create({
          type: 'express',
          email: user.email,
          country: 'US',
          capabilities: {
               card_payments: { requested: true },
               transfers: { requested: true },
          },
     });
     console.log('stripe account', account);

     await StripeAccount.create({ accountId: account.id, userId: user.id });

     const onboardingLink = await stripe.accountLinks.create({
          account: account.id,
          refresh_url: `${protocol}://${host}/api/v1/payments/refreshAccountConnect/${account.id}`,
          return_url: `${protocol}://${host}/api/v1/payments/success-account/${account.id}`,
          type: 'account_onboarding',
     });
     console.log('onboardingLink-2', onboardingLink);

     /********
      * Now if account creation is successful then we pass that user to /success-account/:accountId
      * which is return_url
      * 
      * If something wrong happen .. then we redirect him into refresh_url
      * ******* */

     return {
          success: true,
          message: 'Please complete your account',
          url: onboardingLink.url,
     };
};

const refreshAccountConnect = async (id: string, host: string, protocol: string): Promise<string> => {
     const onboardingLink = await stripe.accountLinks.create({
          account: id,
          refresh_url: `${protocol}://${host}/api/v1/stripe/refreshAccountConnect/${id}`,
          return_url: `${protocol}://${host}/api/v1/stripe/success-account/${id}`,
          type: 'account_onboarding',
     });
     return onboardingLink.url;
};

const onConnectedStripeAccountSuccess = async (accountId: string) => {
     console.log({ accountId });
     if (!accountId) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'account Id not found');
     }

     type TPopulatedUser = {
          full_name: string;
          email: string;
          image: string;
     };

     const stripeAccounts = await StripeAccount.findOne({ accountId }).populate({
          path: 'userId',
          select: 'full_name email image',
     });

     if (!stripeAccounts) {
          throw new ApiError(StatusCodes.NOT_FOUND, 'account not found');
     }

     await StripeAccount.updateOne({ accountId }, { isCompleted: true });

     const userUpdate = await User.updateOne({ _id: stripeAccounts.userId._id }, { $set: { stripeConnectedAccount: accountId } });
     console.log(userUpdate);

     const user = stripeAccounts.userId as unknown as TPopulatedUser;

     const html = successHTMLstripeConnection({
          name: user.full_name,
          email: user.email,
          profileImg: user.image,
     });

     // const data = { user: { name: user.full_name } };
     // io.emit('join stripe account', data);

     return html;
};

export const stripeAccountService = {
     createConnectedStripeAccount,
     refreshAccountConnect,
     onConnectedStripeAccountSuccess,
};
