/**
 * Nagad Payment Flow:
 * 1. Create payment request
 * 2. Get Nagad payment URL
 * 3. User completes payment
 * 4. Verify payment callback
 * 5. Process payment completion
 */

interface NagadConfig {
    base_url: string;
    merchant_id: string;
    merchant_number: string;
    public_key: string;
    private_key: string;
}

const nagadConfig: NagadConfig = {
    base_url: config.nagad.base_url || 'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs',
    merchant_id: config.nagad.merchant_id,
    merchant_number: config.nagad.merchant_number,
    public_key: config.nagad.public_key,
    private_key: config.nagad.private_key,
};