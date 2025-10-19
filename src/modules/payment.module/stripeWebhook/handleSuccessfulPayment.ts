import stripe from "../../../config/stripe.config";
import { TUser } from "../../user.module/user/user.interface";
import { User } from "../../user.module/user/user.model";
import { TPaymentGateway, TPaymentStatus } from "../paymentTransaction/paymentTransaction.constant";
import { PaymentTransaction } from "../paymentTransaction/paymentTransaction.model";

// ✅ Safe date helper
// const safeDate = (timestamp?: number) => 
//   (timestamp ? new Date(timestamp * 1000) : null);

// // ✅ Robust date calculator

// const calculateSubscriptionDates = (subscription, invoice) => {
//   const trialEnd   = safeDate(subscription.trial_end);
//   const subStart   = safeDate(subscription.start_date);

//   const currentPeriodStart = safeDate(invoice.period_start) || safeDate(subscription.current_period_start);
//   const currentPeriodEnd   = safeDate(invoice.period_end)   || safeDate(subscription.current_period_end);

//   return {
//     subscriptionStartDate: subStart,                // first ever subscription date
//     currentPeriodStartDate: currentPeriodStart,     // beginning of this billing cycle
//     expirationDate: trialEnd || currentPeriodEnd,   // trial end OR billing cycle end
//     renewalDate: trialEnd || currentPeriodEnd,      // trial end OR billing cycle end
//     isInTrial: !!trialEnd && trialEnd > new Date()
//   };
// };

export interface IMetadataForFreeTrial{
    userId: string;
    subscriptionType: string;
    subscriptionPlanId?: string; // ⚡ we will add this in webhook for standard plan after free trial end
    referenceId: string; // this is userSubscription._id
    referenceFor: string; // TTransactionFor.UserSubscription
    currency: string;
    amount: string;
}

/*****
 * 🔥🔥 event.type customer.subscription.trial_will_end
 * 
 * This event fires 3 days before the trial ends, giving you time to:

    Notify the user
    Handle potential payment failures
    Provide last-chance offers
 * 
 * ****** */

export const handleSuccessfulPayment = async (invoice) => {
  console.log("1️⃣ ℹ️ handleSuccessfulPayment ::: ", invoice);
  try {
    // if (invoice.billing_reason !== 'subscription_cycle') {
    //   return; // Only handle recurring subscription payments
    // }

    // Handle both subscription creation and recurring payments
    const validBillingReasons = ['subscription_create', 'subscription_cycle', 'subscription_update'];
    
    if (!validBillingReasons.includes(invoice.billing_reason)) {
      console.log(`Skipping invoice with billing_reason: ${invoice.billing_reason}`);
      return;
    }

/*

'subscription_create' -> First payment after trial ends (or immediate if no trial)
'subscription_cycle'  -> Regular recurring billing cycle
'subscription_update' -> Plan change, proration, etc.
'trial_end'           ->  ⚠️ Not used directly in invoice.paid , but trial ends trigger an invoice
                       with subscription_create

*/

    /******
     * 
     * as we set metadata under subscription data ..
     * so first we have to get subscription from invoice.subscription
     * then we can get metadata from subscription object
     * 
     * *** */

    const subscriptionId = invoice.subscription;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // ✅ Access metadata from subscription, not invoice
    const metadata:IMetadataForFreeTrial = subscription.metadata;
 
    const invoiceInfo = {
      customer : invoice.customer,
      payment_intent : invoice.payment_intent,
      price_id : invoice.lines.data[0].price.id,
      period_start : invoice.period_start,
      period_end : invoice.period_end,
      amount_paid : invoice.amount_paid,
      billing_reason : invoice.billing_reason,
      subscriptionId : invoice.subscription,
      subscription_metadata :  {
        userId: metadata.userId,
        subscriptionType: metadata.subscriptionType,
        referenceId : metadata.referenceId,
        referenceFor: metadata.referenceFor,
        currency: metadata.currency,
        amount: metadata.amount
      }
    }

    console.log("---------- invoice.billing_reason handleSuccessfulPayment :: ", invoice.billing_reason ) 
    console.log("⚡⚡⚡ invoiceInfo from handleSuccessfulPayment -> amount paid :: ", invoiceInfo ) 


    // Find user by Stripe customer ID
    const user:TUser = await User.findOne({ 
      stripe_customer_id: subscription.customer 
    });

    if (!user) {
      console.error('User not found for customer:', subscription.customer);
      return;
    }
   
    // ✅ Use proper Stripe dates instead of manual calculation
    // const dates = calculateSubscriptionDates(subscription, invoice);
   

    if(invoice.billing_reason === 'subscription_create'){
        console.log("⚡ This is first payment after trial or immediate payment without trial");

        // ⭕ these dates are undifind ⭕ ⭕ ⭕  
        // const { current_period_start, current_period_end } = subscription;
        // console.log("⚡⚡ current_period_start :: current_period_end -> ", current_period_start, current_period_end)


        const newPayment = await PaymentTransaction.create({
          userId: user._id,
          referenceFor : invoiceInfo.subscription_metadata.referenceFor, // If this is for Order .. we pass "Order" here
          referenceId :  invoiceInfo.subscription_metadata.referenceId, // If this is for Order .. then we pass OrderId here
          paymentGateway: TPaymentGateway.stripe,
          transactionId: invoiceInfo.charge,
          paymentIntent: invoiceInfo.payment_intent,
          amount: invoiceInfo.subscription_metadata.amount,
          currency : invoiceInfo.subscription_metadata.currency,
          paymentStatus: TPaymentStatus.completed,
          gatewayResponse: invoiceInfo,
        });

        /*********
        // 1. Update UserSubscription with Stripe IDs
        await UserSubscription.findByIdAndUpdate(metadata.referenceId, {
          $set: {
            stripe_subscription_id: subscriptionId,
            stripe_transaction_id: invoice.payment_intent,
            subscriptionPlanId: metadata.subscriptionPlanId, // You'll need to fetch this
            status: UserSubscriptionStatusType.active,
            subscriptionStartDate :  new Date(invoice.period_start * 1000),   // when user first subscribed
            // currentPeriodStartDate: null, // THIS billing cycle start
            // expirationDate: null,                 // end of trial or billing cycle
            // billingCycle : 1 , // TODO : we have to check already how many billing cycle passed .. 
            isAutoRenewed : true,
            // renewalDate:  null, // 
            // Add other fields as needed
          }
        });

        // 2. Mark user as having used free trial (option 2: after first payment)
        await User.findByIdAndUpdate(metadata.userId, {
          $set: { 
            hasUsedFreeTrial: true,
            subscriptionType: metadata.subscriptionType 
           }
        });

        *********** */


    }else if(invoice.billing_reason === 'subscription_cycle'){
        console.log("⚡ This is recurring subscription payment");
/*
        {
          customer: 'cus_SzzhhEPsNynY9B',
          payment_intent: 'pi_3SEvpURw9NX4Ne6p19BCN1jV',
          price_id: 'price_1S3YyYRw9NX4Ne6puniNEZQp',
          period_start: 1757089863,
          period_end: 1759681863,
          amount_paid: 35000,
          billing_reason: 'subscription_cycle',
          subscriptionId: 'sub_1S42XVRw9NX4Ne6peXI84QDf',
          subscription_metadata: {
            userId: '68b951f71859ecfc7332ea8f',
            subscriptionType: 'standard',
            referenceId: '68bb1033e6d83d6270549703',
            referenceFor: 'UserSubscription',
            currency: 'usd',
            amount: '350'
          }
        }
*/
        const { current_period_start, current_period_end } = subscription;

        const newPayment = await PaymentTransaction.create({
          userId: invoiceInfo.subscription_metadata.userId,
          referenceFor : invoiceInfo.subscription_metadata.referenceFor, // If this is for Order .. we pass "Order" here
          referenceId :  invoiceInfo.subscription_metadata.referenceId, // If this is for Order .. then we pass OrderId here
          paymentGateway: TPaymentGateway.stripe,
          transactionId: null,  // TODO : need to think about this
          paymentIntent: invoiceInfo.payment_intent,
          amount: invoiceInfo.subscription_metadata.amount,
          currency : invoiceInfo.subscription_metadata.currency,
          paymentStatus: TPaymentStatus.completed,
          gatewayResponse: invoiceInfo,
        });


        /***********

        // TODO : referenceFor theke Model ta select korte hobe Best practice
        // 1. Update UserSubscription with Stripe IDs
        await UserSubscription.findByIdAndUpdate(metadata.referenceId, {
          $set: {
            stripe_subscription_id: subscriptionId,
            stripe_transaction_id: invoice.payment_intent,
            subscriptionPlanId: metadata.subscriptionPlanId, // You'll need to fetch this
            status: UserSubscriptionStatusType.active,
            subscriptionStartDate :  new Date(invoice.period_start * 1000),   // when user first subscribed
            // currentPeriodStartDate: null, // THIS billing cycle start
            // expirationDate: null,                 // end of trial or billing cycle
            // billingCycle : 1 , // TODO : we have to check already how many billing cycle passed .. 
            isAutoRenewed : true,
            // renewalDate:  null, // 
            // Add other fields as needed
          }
        });

        // 2. Mark user as having used free trial (option 2: after first payment)
        await User.findByIdAndUpdate(metadata.userId, {
          $set: { 
            hasUsedFreeTrial: true,
            subscriptionType: metadata.subscriptionType 
           }
        });

        ********* */

    }else if(invoice.billing_reason === 'subscription_update'){
        console.log("⚡ This is subscription update payment (plan change, proration, etc.)");
    
    
      }else if(invoice.billing_reason === 'trial_end'){
        console.log("⚠️ This is trial end - usually triggers subscription_create invoice");
    }else {
        console.log("⚡ Other billing reason:", invoice.billing_reason);
    }

    
    return true;
  } catch (error) {
    console.error('⛔ Error handling successful payment:', error);

    // 5. Log for retry
    // await FailedWebhook.create({
    //   eventId: invoice.id,
    //   invoiceId: invoice.id,
    //   subscriptionId,
    //   metadata,
    //   error: error.message,
    //   stage: 'unknown',
    //   attemptCount: 1
    // });

    // 6. Alert (optional)
    // await sendCriticalAlert(err, invoice, metadata);

    // 7. Re-throw to trigger Stripe retry (optional)
    // throw err; // only if you want Stripe to retry
  }
}


/******
    // 🎯 CONVERT FROM TRIAL TO PAID SUBSCRIPTION
    if (user.subscriptionStatus === 'trial') {
      const subscriptionStartDate = new Date();
      const subscriptionEndDate = new Date();
      
      // Calculate end date based on billing interval
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      
      if (price.recurring.interval === 'year') {
        subscriptionEndDate.setFullYear(subscriptionStartDate.getFullYear() + 1);
      } else {
        subscriptionEndDate.setMonth(subscriptionStartDate.getMonth() + 1);
      }
      
      // Update user to paid subscription
      await User.findByIdAndUpdate(user._id, {
        subscriptionStatus: getPlanTypeFromStripePrice(priceId),
        subscriptionStartDate: subscriptionStartDate,
        subscriptionEndDate: subscriptionEndDate,
        isSubscriptionActive: true,
        
        // Clear trial fields
        freeTrialStartDate: null,
        freeTrialEndDate: null,
        freeTrialPlanType: null
      });
      
      console.log(`✅ User ${user.email} automatically upgraded to paid subscription ($${price.unit_amount/100})`);
      
      // Send upgrade confirmation email
      await sendSubscriptionUpgradeEmail(user);
    }

    ****** */

    /****** Chat GPT Idea .. Must to Implement this 
     * 
     * {
        userId: user._id,                                  // from metadata or customer lookup
        subscriptionPlanId: dbPlan._id,                    // lookup via stripe_price_id
        subscriptionStartDate: invoice.period_start,       // billing cycle start
        currentPeriodStartDate: invoice.period_start,
        expirationDate: invoice.period_end,                // this period ends here
        renewalDate: invoice.period_end,                   // next billing date
        billingCycle: 1,
        isAutoRenewed: true,
        status: "active",                                  // since payment succeeded
        stripe_subscription_id: invoice.subscription,
        stripe_transaction_id: invoice.payment_intent,
      }
     * 
     * ***** */