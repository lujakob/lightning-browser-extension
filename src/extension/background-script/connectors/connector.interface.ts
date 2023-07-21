import { ACCOUNT_CURRENCIES } from "~/common/constants";
import { OAuthToken } from "~/types";

export interface WebLNNode {
  alias: string;
  pubkey?: string;
  color?: string;
}

interface Route {
  total_amt: number;
  total_fees: number;
}

export type TransactionCustomRecords = {
  "696969"?: string;
  "7629169"?: string;
  "5482373484"?: string;
} & Record<string, string>;

export interface ITransaction {
  totalAmount: string;
  memo: string;
  preimage: string;
  settled: boolean;
  settleDate: number;
  custom_records?: TransactionCustomRecords;
}

export interface ConnectorInvoice extends ITransaction {
  id: string;
  type: "received";
}

export interface ConnectorTransaction extends ITransaction {
  totalFee: number;
  keysend: boolean;
  timestamp: number;
  type: "sent";
}

export interface MakeInvoiceArgs {
  amount: string | number;
  memo: string;
}

export interface GetTransactionsArgs {
  limit: number;
}

export type MakeInvoiceResponse = {
  data: {
    paymentRequest: string;
    rHash: string;
  };
};

export type GetInfoResponse<T extends WebLNNode = WebLNNode> = {
  data: T;
};

export type GetBalanceResponse = {
  data: {
    balance: number;
    currency?: ACCOUNT_CURRENCIES;
  };
};

export type GetInvoicesResponse = {
  data: {
    invoices: ConnectorInvoice[];
  };
};

export type GetTransactionsResponse = {
  data: {
    transactions: ConnectorTransaction[];
  };
};

export type SendPaymentResponse = {
  data: {
    preimage: string;
    paymentHash: string;
    route: Route;
  };
};

export interface SendPaymentArgs {
  paymentRequest: string;
}

export interface KeysendArgs {
  pubkey: string;
  amount: number;
  customRecords: Record<string, string>;
}

export interface CheckPaymentArgs {
  paymentHash: string;
}

export type CheckPaymentResponse = {
  data: {
    paid: boolean;
    preimage?: string;
  };
};

export interface SignMessageArgs {
  message: string;
  key_loc: {
    key_family: number;
    key_index: number;
  };
}

export interface SignMessageResponse {
  data: {
    message: string;
    signature: string;
  };
}

export interface ConnectPeerResponse {
  data: boolean;
}

export interface ConnectPeerArgs {
  pubkey: string;
  host: string;
}

export default interface Connector {
  init(): Promise<void>;
  unload(): Promise<void>;
  getInfo(): Promise<GetInfoResponse>;
  getBalance(): Promise<GetBalanceResponse>;
  getInvoices(): Promise<GetInvoicesResponse>;
  getTransactions(args?: GetTransactionsArgs): Promise<GetTransactionsResponse>;
  makeInvoice(args: MakeInvoiceArgs): Promise<MakeInvoiceResponse>;
  sendPayment(args: SendPaymentArgs): Promise<SendPaymentResponse>;
  keysend(args: KeysendArgs): Promise<SendPaymentResponse>;
  checkPayment(args: CheckPaymentArgs): Promise<CheckPaymentResponse>;
  signMessage(args: SignMessageArgs): Promise<SignMessageResponse>;
  connectPeer(args: ConnectPeerArgs): Promise<ConnectPeerResponse>;
  supportedMethods?: string[];
  requestMethod?(
    method: string,
    args: Record<string, unknown>
  ): Promise<{ data: unknown }>;
  getOAuthToken?(): OAuthToken | undefined;
}
