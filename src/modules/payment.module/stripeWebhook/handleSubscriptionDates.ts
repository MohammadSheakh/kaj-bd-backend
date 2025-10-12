import { UserSubscription } from "../../subscription.module/userSubscription/userSubscription.model";
import { User } from "../../user/user.model";

export interface IMetadataForFreeTrial{
    userId: string;
    subscriptionType: string;
    subscriptionPlanId?: string; // ⚡ we will add this in webhook for standard plan after free trial end
    referenceId: string; // this is userSubscription._id
    referenceFor: string; // TTransactionFor.UserSubscription
    currency: string;
    amount: string;
}

export const handleSubscriptionDates = async (subscription) => {
  console.log("2️⃣ ℹ️");
  try {
    // console.log("🟢 Subscription from handleSubscriptionDates to update 🟢", subscription);

    const metadata = subscription.metadata || {};
    const userId = metadata.userId;
    const referenceId = metadata.referenceId; // UserSubscription._id

    if (!userId || !referenceId) {
      console.error("❌ Missing userId or referenceId in subscription metadata");
      return false;
    }

    // Convert Stripe timestamps to JS Dates
    const currentPeriodStart = new Date(subscription.current_period_start * 1000);
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000); // This is your RENEWAL / EXPIRATION DATE

    // Optional: preserve original subscription start date (first time ever)
    // You might want to store this only on first subscription creation
    const subscriptionStartDate = new Date(subscription.start_date * 1000);

    // Determine if this is a NEW subscription or a RENEWAL
    // You can check if UserSubscription already exists with this referenceId
    const existingSubscription = await UserSubscription.findById(referenceId);

    let billingCycle = 1;
    if (existingSubscription && existingSubscription.billingCycle) {
      billingCycle = existingSubscription.billingCycle + 1;
    }

    // 1. Update UserSubscription
    const updateData = {
      $set: {
        currentPeriodStartDate: currentPeriodStart,
        expirationDate: currentPeriodEnd, // <-- ✅ This is your key field!
        renewalDate: currentPeriodEnd,    // <-- ✅ Same as expiration for auto-renewal
        billingCycle,
      }
    };

    await UserSubscription.findByIdAndUpdate(referenceId, updateData, { new: true });

    console.log(`✅ UserSubscription ${referenceId} updated with renewal date: ${currentPeriodEnd.toISOString()}`);

    // 2. Mark user as having used free trial (if this is first paid cycle)
    // Only mark if this is the first billing cycle (or if user hasn't been marked yet)
    if (billingCycle === 1) {
      await User.findByIdAndUpdate(userId, {
        $set: {
          hasUsedFreeTrial: true,
          subscriptionType: metadata.subscriptionType,
          stripe_customer_id: subscription.customer, // ensure consistency
        }
      });
      console.log(`✅ User ${userId} marked as having used free trial`);
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