import {
    text,
    timestamp,
    boolean,
    integer,
    json,
    pgSchema,
    uuid,
    varchar,
  } from "drizzle-orm/pg-core";
  import { organization } from "./auth";
  import {
    BillingDetails,
    GenericPaymentDetails,
    EncryptedPaymentDetails,
  } from "../types";
  
  const auditColumns = {
    createdAt: timestamp("created_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
  };
  
  /**
   * The billing schema is kept in its own namespace.
   * All tables below are created within the "billing" schema.
   */
  export const billing = pgSchema("billing");
  
  /**
   * Customer Table
   *
   * A customer represents a person or business profiled for billing.
   * It can reference either a user or an organization from your auth system.
   */
  export const customer = billing.table("customer", {
    id: uuid("id").primaryKey().defaultRandom(),
    // A customer is owned either by a user or an organization.
    ownerOrganizationId: text("owner_organization_id").references(
      () => organization.id,
      { onDelete: "cascade" }
    ),
    primaryEmail: text("primary_email").notNull(),
    description: text("description"),
    metadata: json("metadata"),
    ...auditColumns,
  });
  
  /**
   * Product Table
   *
   * Represents products or services that you sell.
   */
  export const product = billing.table("product", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    active: boolean("active").notNull().default(true),
    metadata: json("metadata"),
    ...auditColumns,
  });
  
  /**
   * Price Table
   *
   * A price is associated with a product and contains the unit amount,
   * currency, and (if recurring) billing interval information.
   */
  export const price = billing.table("price", {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    unitAmount: integer("unit_amount").notNull(),
    currency: text("currency").notNull(),
    // For recurring prices only:
    recurringInterval: text("recurring_interval"), // e.g. day, week, month, year
    recurringIntervalCount: integer("recurring_interval_count"),
    active: boolean("active").notNull().default(true),
    metadata: json("metadata"),
    ...auditColumns,
  });
  
  /**
   * Payment Method Table
   *
   * Stores payment method details for a given customer.
   */
  export const paymentMethod = billing.table("payment_method", {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    type: varchar("type", {
      enum: ["card", "bank_account", "paypal", "google_pay", "apple_pay"],
    }).notNull(), // e.g. "card", "bank_account"
    billingDetails: json("billing_details").$type<BillingDetails>(),
    genericDetails: json("generic_details").$type<GenericPaymentDetails>(),
    encryptedData: json("encrypted_data").$type<EncryptedPaymentDetails>(),
    isDefault: boolean("is_default").default(false),
    ...auditColumns,
  });
  
  /**
   * Payment Intent Table
   *
   * Represents a payment flow toward a particular charge.
   * It may be associated with a specific PaymentMethod.
   */
  export const paymentIntent = billing.table("payment_intent", {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    paymentMethodId: uuid("payment_method_id").references(
      () => paymentMethod.id,
      { onDelete: "cascade" }
    ),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    status: text("status").notNull(), // e.g. "requires_payment_method", "processing", "succeeded", "failed"
    description: text("description"),
    metadata: json("metadata"),
    ...auditColumns,
  });
  
  /**
   * Subscription Table
   *
   * Represents a customer's recurring billing relationship.
   */
  export const subscription = billing.table("subscription", {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    status: varchar("status", {
      enum: ["active", "past_due", "canceled"],
    }).notNull(),
    startDate: timestamp("start_date").notNull(),
    currentPeriodStart: timestamp("current_period_start").notNull(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    canceledAt: timestamp("canceled_at"),
    endedAt: timestamp("ended_at"),
    trialStart: timestamp("trial_start"),
    trialEnd: timestamp("trial_end"),
    metadata: json("metadata"),
    ...auditColumns,
  });
  
  /**
   * Invoice Table
   *
   * An invoice may be generated for a customer either for subscription
   * payments or for one-off charges.
   */
  export const invoice = billing.table("invoice", {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "no action" }),
    subscriptionId: uuid("subscription_id").references(() => subscription.id),
    paymentIntentId: uuid("payment_intent_id").references(() => paymentIntent.id),
    amountTotal: integer("amount_total").notNull(),
    amountPaid: integer("amount_paid").notNull(),
    currency: text("currency").notNull(),
    status: text("status").notNull(), // e.g. "draft", "open", "paid", "uncollectible", "void"
    dueDate: timestamp("due_date"),
    metadata: json("metadata"),
    ...auditColumns,
  });
  
  /**
   * Invoice Item Table
   *
   * Line items for an invoice. They can represent a product/service,
   * a subscription period, etc.
   */
  export const invoiceItem = billing.table("invoice_item", {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoice.id),
    productId: uuid("product_id").references(() => product.id),
    description: text("description"),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    quantity: integer("quantity").notNull().default(1),
    periodStart: timestamp("period_start"),
    periodEnd: timestamp("period_end"),
    metadata: json("metadata"),
    createdAt: timestamp("created_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
  });
  
  /**
   * Subscription Item Table
   *
   * Specifies a component (i.e. a priced product) of a subscription.
   */
  export const subscriptionItem = billing.table("subscription_item", {
    id: uuid("id").primaryKey().defaultRandom(),
    subscriptionId: uuid("subscription_id")
      .notNull()
      .references(() => subscription.id),
    priceId: uuid("price_id")
      .notNull()
      .references(() => price.id),
    quantity: integer("quantity").notNull().default(1),
    metadata: json("metadata"),
    ...auditColumns,
  });
  
  /**
   * Charge Table
   *
   * Represents a charge created from a completed PaymentIntent.
   */
  export const charge = billing.table("charge", {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentIntentId: uuid("payment_intent_id")
      .notNull()
      .references(() => paymentIntent.id),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "no action" }),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    status: text("status").notNull(), // e.g. "succeeded", "pending", "failed"
    fee: integer("fee"),
    metadata: json("metadata"),
    ...auditColumns,
  });
  
  /**
   * Refund Table
   *
   * Tracks refunds issued on charges.
   */
  export const refund = billing.table("refund", {
    id: uuid("id").primaryKey().defaultRandom(),
    chargeId: uuid("charge_id")
      .notNull()
      .references(() => charge.id),
    amount: integer("amount").notNull(),
    reason: text("reason"),
    status: text("status").notNull(), // e.g. "pending", "succeeded", "failed"
    metadata: json("metadata"),
    ...auditColumns,
  });
  
  /**
   * Coupon Table
   *
   * A coupon can be applied to a customer or subscription for a discount.
   */
  export const coupon = billing.table("coupon", {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(),
    percentageOff: integer("percentage_off"),
    amountOff: integer("amount_off"),
    duration: text("duration").notNull(), // e.g. "once", "repeating", "forever"
    durationInMonths: integer("duration_in_months"),
    maxRedemptions: integer("max_redemptions"),
    redeemedCount: integer("redeemed_count").notNull().default(0),
    valid: boolean("valid").notNull().default(true),
    metadata: json("metadata"),
    ...auditColumns,
  });
  
  /**
   * Customer Coupon Table
   *
   * Associates a coupon with a customer when redeemed.
   */
  export const customerCoupon = billing.table("customer_coupon", {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupon.id),
    redeemedAt: timestamp("redeemed_at", { withTimezone: false })
      .notNull()
      .defaultNow(),
  });
  
  /**
   * Tax Rate Table
   *
   * Stores tax rate information that may be applied on invoices.
   */
  export const taxRate = billing.table("tax_rate", {
    id: uuid("id").primaryKey().defaultRandom(),
    percentage: integer("percentage").notNull(), // Represented as an integer percent
    inclusive: boolean("inclusive").notNull().default(false),
    description: text("description"),
    metadata: json("metadata"),
    ...auditColumns,
  });
  
  /**
   * Webhook Event Table
   *
   * Logs events (or incoming webhooks) for later processing or audit.
   */
  export const webhookEvent = billing.table("webhook_event", {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(), // e.g. "charge.succeeded", etc.
    payload: json("payload").notNull(),
    processed: boolean("processed").notNull().default(false),
    metadata: json("metadata"),
    ...auditColumns,
  });
  