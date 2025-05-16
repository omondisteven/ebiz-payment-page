// // /src/lib/paymentMonitor.ts
// import { Database } from 'better-sqlite3';

// export class PaymentMonitor {
//   private intervalId: NodeJS.Timeout | null = null;
//   private timeoutId: NodeJS.Timeout | null = null;
//   private isComplete = false;
//   private currentCheckoutId: string | null = null;

//   constructor(
//     private phone: string,
//     private account: string,
//     private onStatusChange: (status: string) => void,
//     private onCleanup: () => void,
//     private db: Database
//   ) {}

//   start(checkoutRequestId: string): void {
//     this.currentCheckoutId = checkoutRequestId;
//     this.timeoutId = setTimeout(() => this.handleTimeout(), 60000);
//     this.intervalId = setInterval(() => this.checkStatus(), 5000);
//   }

//   stop(): void {
//     if (this.intervalId) clearInterval(this.intervalId);
//     if (this.timeoutId) clearTimeout(this.timeoutId);
//     if (!this.isComplete) this.onCleanup();
//     this.currentCheckoutId = null;
//   }

//   private async checkStatus(): Promise<void> {
//     try {
//       if (!this.currentCheckoutId) return;

//       const row = this.db.prepare(`
//         SELECT status FROM transactions
//         WHERE checkout_request_id = ?
//       `).get(this.currentCheckoutId) as { status: string } | undefined;

//       if (!row) return;

//       switch (row.status) {
//         case 'Success':
//           this.complete('Payment successful!');
//           break;
//         case 'Cancelled':
//           this.complete('Payment was cancelled by user');
//           break;
//         case 'Failed':
//           this.complete('Payment failed');
//           break;
//         case 'Timeout':
//           this.complete('Payment timed out');
//           break;
//       }
//     } catch (error) {
//       console.error('Status check error:', error);
//       this.complete('Error checking payment status');
//     }
//   }

//   private handleTimeout(): void {
//     if (!this.isComplete) {
//       try {
//         if (this.currentCheckoutId) {
//           this.db.prepare(`
//             UPDATE transactions
//             SET status = 'Timeout'
//             WHERE checkout_request_id = ?
//           `).run(this.currentCheckoutId);
//         }
//       } catch (error) {
//         console.error('Failed to update transaction status:', error);
//       }
//       this.complete('Payment timed out');
//     }
//   }

//   private complete(message: string): void {
//     if (this.isComplete) return;
    
//     this.isComplete = true;
//     this.stop();
//     this.onStatusChange(message);
//   }
// }