/**
 * AamarPay - Another popular BD payment gateway
 */

interface AamarPayConfig {
    store_id: string;
    signature_key: string;
    base_url: string;
}

const aamarpayConfig: AamarPayConfig = {
    store_id: config.aamarpay.store_id,
    signature_key: config.aamarpay.signature_key,
    base_url: config.aamarpay.base_url || 'https://sandbox.aamarpay.com',
};
