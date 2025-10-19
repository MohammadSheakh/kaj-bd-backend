
import { User } from "../../user.module/user/user.model";

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

    return true;
  } catch (error) {
    console.error('⛔ Error handling successful payment:', error);
  }
}
