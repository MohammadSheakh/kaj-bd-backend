// 7. HANDLE SUBSCRIPTION CANCELLATION WEBHOOK
export const handleSubscriptionCancellation = async (subscription) => {
  try {
    const user = await User.findOne({ 
      stripe_subscription_id: subscription.id 
    });
    
    if (!user) return;
    
    // Update user status to cancelled
    await User.findByIdAndUpdate(user._id, {
      subscriptionStatus: 'none',
      isSubscriptionActive: false,
      stripe_subscription_id: null
    });
    
    console.log(`🔚 Subscription cancelled for user: ${user.email}`);
    
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}
