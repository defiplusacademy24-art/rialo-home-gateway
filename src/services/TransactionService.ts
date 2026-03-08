import { supabase } from "@/integrations/supabase/client";

export interface TransactionConditions {
  payment_confirmed: boolean;
  buyer_signed: boolean;
  seller_signed: boolean;
  title_verified: boolean;
}

export interface PropertyTransaction {
  id: string;
  property_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  status: string;
  contract_id: string;
  deadline: string;
  conditions: TransactionConditions;
  created_at: string;
  updated_at: string;
}

export const TRANSACTION_STATUSES = [
  "PAYMENT_INITIATED",
  "FUNDS_LOCKED",
  "CONTRACT_ACTIVE",
  "TITLE_VERIFICATION",
  "SETTLEMENT_EXECUTION",
  "COMPLETED",
] as const;

export class TransactionService {
  static async create(params: {
    property_id: string;
    seller_id: string;
    amount: number;
    currency: string;
  }): Promise<PropertyTransaction> {
    const { data, error } = await supabase.functions.invoke("reactive-transaction-engine", {
      body: { action: "create", ...params },
    });
    if (error) {
      // For FunctionsHttpError, try to read the response body for transaction_id
      try {
        const body = await (error as any).context?.json?.();
        if (body?.transaction_id) {
          const err = new Error(body.error || "Active transaction exists") as any;
          err.transaction_id = body.transaction_id;
          throw err;
        }
      } catch (parseErr: any) {
        if (parseErr.transaction_id) throw parseErr;
      }
      throw error;
    }
    if (data?.error) {
      const err = new Error(data.error) as any;
      if (data.transaction_id) err.transaction_id = data.transaction_id;
      throw err;
    }
    return data;
  }

  static async get(transaction_id: string): Promise<PropertyTransaction> {
    const { data, error } = await supabase.functions.invoke("reactive-transaction-engine", {
      body: { action: "get", transaction_id },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }

  static async list(): Promise<PropertyTransaction[]> {
    const { data, error } = await supabase.functions.invoke("reactive-transaction-engine", {
      body: { action: "list" },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }

  static async updateCondition(
    transaction_id: string,
    condition: keyof TransactionConditions,
    value: boolean = true
  ): Promise<PropertyTransaction> {
    const { data, error } = await supabase.functions.invoke("reactive-transaction-engine", {
      body: { action: "update-condition", transaction_id, condition, value },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  }
}
