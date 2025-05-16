// import { createClient } from '@vercel/kv';

// const kv = createClient({
//   url: process.env.KV_REST_API_URL || '',
//   token: process.env.KV_REST_API_TOKEN || '',
// });

// export default kv;

// // Helper function to format payment keys
// export function getPaymentKey(checkoutRequestId: string) {
//   return `payment:${checkoutRequestId}`;
// }

// // Helper function to format callback keys
// export function getCallbackKey(checkoutRequestId: string) {
//   return `callback:${checkoutRequestId}`;
// }