import SSLCommerzPayment from 'sslcommerz-lts';
import axios from 'axios';
import { config } from '..';

// SSL Commerz Configuration
const sslConfig = {
    store_id: config.sslcommerz.store_id,
    store_passwd: config.sslcommerz.store_passwd,
    is_live: config.sslcommerz.is_live || false, // true for production
};