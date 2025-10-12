// 6. CANCEL SUBSCRIPTION (USER REQUEST)
async function cancelUserSubscription(userId, cancelImmediately = false) {
  try {
    const user = await User.findById(userId);
    
    if (!user || !user.stripe_subscription_id) {
      throw new Error('No active subscription found');
    }
    
    if (cancelImmediately) {
      // Cancel immediately - user loses access right away
      await stripe.subscriptions.cancel(user.stripe_subscription_id);
      
      // Update user immediately
      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: 'none',
        isSubscriptionActive: false,
        subscriptionEndDate: new Date(),
        stripe_subscription_id: null
      });
      
      console.log(`🛑 User ${user.email} subscription cancelled immediately`);
      
    } else {
      // Cancel at period end - user keeps access until billing cycle ends
      await stripe.subscriptions.update(user.stripe_subscription_id, {
        cancel_at_period_end: true
      });
      
      console.log(`⏰ User ${user.email} subscription will cancel at period end`);
    }
    
    // Send cancellation confirmation email
    await sendCancellationEmail(user, cancelImmediately);
    
    return { 
      success: true, 
      message: cancelImmediately 
        ? 'Subscription cancelled immediately' 
        : 'Subscription will cancel at the end of current billing period'
    };
    
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}