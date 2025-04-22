import * as users from "./Schema/auth";
import * as events from "./Schema/events";
import * as rooms from "./Schema/rooms";
import * as billing from "./Schema/biling";
import * as integrations from "./Schema/integrations";

export type Building = {
  name: string;
  description: string;
  coordinates?: string;
  floors: Floor[];
};

export type Floor = {
  name: string;
  description?: string;
};

export type BillingDetails = {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
};

export type GenericPaymentDetails = {
  card?: CardGenericDetails;
  bankAccount?: BankAccountGenericDetails;
  paypal?: PaypalGenericDetails;
  googlePay?: GooglePayGenericDetails;
  applePay?: ApplePayGenericDetails;
};

export type EncryptedPaymentDetails = {
  card?: CardSensitiveDetails;
  bankAccount?: BankAccountSensitiveDetails;
  paypal?: PaypalSensitiveDetails;
  googlePay?: GooglePaySensitiveDetails;
  applePay?: ApplePaySensitiveDetails;
};

// --- Card Details ---
export type CardGenericDetails = {
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  fingerprint?: string;
};

export type CardSensitiveDetails = {
  cardNumber?: string;
  cvc?: string;
  expiryDate?: string;
  holderName?: string;
};

// --- Bank Account Details ---
export type BankAccountGenericDetails = {
  bankName?: string;
  last4?: string;
  accountType?: string;
};

export type BankAccountSensitiveDetails = {
  accountNumber?: string;
  routingNumber?: string;
  holderName?: string;
};

export type PaypalGenericDetails = {
  email?: string;
  payerId?: string;
};

export type PaypalSensitiveDetails = {
  token?: string; // or correlation id
};

export type GooglePayGenericDetails = {
  maskedAccountNumber?: string;
};

export type GooglePaySensitiveDetails = {
  token?: string;
};

export type ApplePayGenericDetails = {
  paymentMethodType?: string;
  paymentNetwork?: string;
};

export type ApplePaySensitiveDetails = {
  token?: string;
};

export type Account = typeof users.account.$inferInsert;
export type User = typeof users.user.$inferSelect;

export type Room = typeof rooms.rooms.$inferSelect;
export type RoomEvents = typeof events.roomEvents.$inferSelect;

export type Event = typeof events.events.$inferSelect;
export type EventException = typeof events.recurringExceptions.$inferSelect;
export type EventParticipant = typeof events.participants.$inferSelect;

export type SlackIntegration = typeof integrations.slack.$inferSelect;

export type Subscription = typeof billing.subscription.$inferSelect;
export type SubscriptionItem = typeof billing.subscriptionItem.$inferSelect;
export type Price = typeof billing.price.$inferSelect;
export type Product = typeof billing.product.$inferSelect;
export type Customer = typeof billing.customer.$inferSelect;
export type PaymentMethod = typeof billing.paymentMethod.$inferSelect;

export type SubscriptionDetails = {
  subscriptionId: string;
  subscriptionStatus: string;
  subscriptionPeriodEnd: string;
  subscriptionItemId: string;
  subscriptionItemQuantity: number;
  priceId: string;
  unitAmount: number;
  currency: string;
  recurringInterval: string;
  recurringIntervalCount: number;
  productName: string;
  productDescription: string;
};
