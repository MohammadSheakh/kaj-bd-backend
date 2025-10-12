import { model, Schema } from 'mongoose';
import paginate from '../../../common/plugins/paginate';
/***

 Add Final Safety Check: Health Endpoint + Monitoring
// GET /api/v1/admin/webhook-health
const countFailed = await FailedWebhook.countDocuments();
res.json({ failedWebhooks: countFailed });
----------- And monitor it with UptimeRobot, Datadog, etc.
 * *** */

const failedWebhookSchema = new Schema<any>(
  {
    eventId: String, // Stripe event ID
    invoiceId: String,
    subscriptionId: String,
    metadata: Map,
    error: String,
    stage: String, // e.g., "update-user-subscription"
    attemptCount: { type: Number, default: 0 },
    lastAttempt: Date,
    createdAt: Date
  },
  { timestamps: true }
);

failedWebhookSchema.plugin(paginate);

// Use transform to rename _id to _projectId
failedWebhookSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._paymentTransactionId = ret._id;  // Rename _id to _paymentTransactionId
    delete ret._id;  // Remove the original _id field
    return ret;
  }
});

export const FailedWebhook = model<any, any>(
  'FailedWebhook',
  failedWebhookSchema
);
