import { ACCOUNT_CURRENCIES } from "~/common/constants";
import {
  ConnectPeerArgs,
  ConnectPeerResponse,
  MakeInvoiceArgs,
  MakeInvoiceResponse,
} from "~/extension/background-script/connectors/connector.interface";
import type {
  Account,
  AccountInfo,
  Accounts,
  Allowance,
  BitcoinNetworkType,
  ConnectorType,
  DbPayment,
  Invoice,
  LnurlAuthResponse,
  MessageAccountEdit,
  MessageAccountValidate,
  MessageInvoices,
  MessageLnurlAuth,
  MessageSettingsSet,
  NodeInfo,
  SettingsStorage,
  ValidateAccountResponse,
} from "~/types";

import {
  getAccountsCache,
  removeAccountFromCache,
  storeAccounts,
} from "./cache";
import msg from "./msg";

export interface AccountInfoRes {
  connectorType: ConnectorType;
  balance: { balance: string | number; currency: ACCOUNT_CURRENCIES };
  currentAccountId: string;
  info: { alias: string; pubkey?: string; lightning_address?: string };
  name: string;
  avatarUrl?: string;
  error?: string;
}

export interface GetAccountRes extends Pick<Account, "id" | "name"> {
  connectorType: ConnectorType;
  nostrEnabled: boolean;
  hasMnemonic: boolean;
  hasImportedNostrKey: boolean;
  bitcoinNetwork: BitcoinNetworkType;
  useMnemonicForLnurlAuth: boolean;
}
interface StatusRes {
  configured: boolean;
  unlocked: boolean;
  currentAccountId: string;
}

interface UnlockRes {
  currentAccountId: string;
}

interface BlocklistRes {
  blocked: boolean;
}

export const getAccountInfo = () => msg.request<AccountInfoRes>("accountInfo");

/**
 * stale-while-revalidate get account info
 * @param id - account id
 * @param callback - will be called first with cached (stale) data first, then with fresh data.
 */
export const swrGetAccountInfo = async (
  id: string,
  callback: (account: AccountInfo) => void,
  skipCache = false
): Promise<AccountInfo> => {
  const accountsCache = await getAccountsCache();

  return new Promise((resolve, reject) => {
    // skip cache for reloading in case of error
    if (!skipCache && accountsCache[id]) {
      if (callback) callback(accountsCache[id]);
      resolve(accountsCache[id]);
    }

    // Update account info with most recent data, save to cache.
    getAccountInfo()
      .then((response) => {
        let account: AccountInfo;
        if (response.error) {
          account = {
            id,
            name: response.name,
            connectorType: response.connectorType,
            error: response.error,
          };
        } else {
          const { alias } = response.info;
          const { balance: resBalance, currency } = response.balance;
          const name = response.name;
          const balance =
            typeof resBalance === "number" ? resBalance : parseInt(resBalance); // TODO: handle amounts
          account = {
            id,
            name,
            connectorType: response.connectorType,
            alias,
            balance,
            currency: currency || "BTC",
            avatarUrl: response.avatarUrl,
          };
        }
        // don't apply cache for connectors that failed to connect
        if (!response.error) {
          storeAccounts({
            ...accountsCache,
            [id]: account,
          });
        }

        if (callback) callback(account);
        return resolve(account);
      })
      .catch(reject);
  });
};
export const getAccounts = () => msg.request<Accounts>("getAccounts");
export const getAccount = (id?: string) =>
  msg.request<GetAccountRes>("getAccount", {
    id,
  });

const validateAccount = (
  account: MessageAccountValidate["args"]
): Promise<ValidateAccountResponse> => msg.request("validateAccount", account);

export const updateAllowance = () => msg.request<Accounts>("updateAllowance");
export const selectAccount = (id: string) =>
  msg.request("selectAccount", { id });
export const editAccount = (
  id: string,
  args: Omit<MessageAccountEdit["args"], "id">
) => msg.request("editAccount", { id, ...args });

export const getAllowance = (host: string) =>
  msg.request<Allowance>("getAllowance", { host });
export const getPayments = (options?: { limit?: number }) =>
  msg.request<{ payments: DbPayment[] }>("getPayments", options);
export const getPaymentsByAccount = (options: {
  accountId: Account["id"];
  limit?: number;
}) => msg.request<{ payments: DbPayment[] }>("getPaymentsByAccount", options);
export const getSettings = () => msg.request<SettingsStorage>("getSettings");
export const getStatus = () => msg.request<StatusRes>("status");
export const getInfo = () => msg.request<NodeInfo>("getInfo");
export const makeInvoice = ({ amount, memo }: MakeInvoiceArgs) =>
  msg.request<MakeInvoiceResponse["data"]>("makeInvoice", { amount, memo });
export const connectPeer = ({ host, pubkey }: ConnectPeerArgs) =>
  msg.request<ConnectPeerResponse["data"]>("connectPeer", { host, pubkey });
export const setSetting = (setting: MessageSettingsSet["args"]["setting"]) =>
  msg.request<SettingsStorage>("setSetting", {
    setting,
  });
export const removeAccount = (id: string) =>
  Promise.all([
    msg.request("removeAccount", { id }),
    removeAccountFromCache(id),
  ]);
export const unlock = (password: string) =>
  msg.request<UnlockRes>("unlock", { password });
export const getBlocklist = (host: string) =>
  msg.request<BlocklistRes>("getBlocklist", { host });
export const getInvoices = (options?: MessageInvoices["args"]) =>
  msg.request<{ invoices: Invoice[] }>("getInvoices", options);
export const lnurlAuth = (
  options: MessageLnurlAuth["args"]
): Promise<LnurlAuthResponse> =>
  msg.request<LnurlAuthResponse>("lnurlAuth", options);

export const getCurrencyRate = async () =>
  msg.request<{ rate: number }>("getCurrencyRate");

const getNostrPrivateKey = (id: string): Promise<string> =>
  msg.request("nostr/getPrivateKey", {
    id,
  });

const getNostrPublicKey = (id: string): Promise<string> =>
  msg.request("nostr/getPublicKey", {
    id,
  });

const generateNostrPrivateKey = (id: string): Promise<string> =>
  msg.request("nostr/generatePrivateKey", {
    id,
  });

const removeNostrPrivateKey = (id: string): Promise<void> =>
  msg.request("nostr/removePrivateKey", {
    id,
  });

const setNostrPrivateKey = (id: string, privateKey: string): Promise<void> =>
  msg.request("nostr/setPrivateKey", {
    id,
    privateKey,
  });

const getMnemonic = (id: string): Promise<string> =>
  msg.request("getMnemonic", {
    id,
  });

const generateMnemonic = (): Promise<string> => msg.request("generateMnemonic");

// TODO: consider adding removeMnemonic function, make mnemonic a string here
const setMnemonic = (id: string, mnemonic: string | null): Promise<void> =>
  msg.request("setMnemonic", {
    id,
    mnemonic,
  });

export default {
  getAccount,
  getAccountInfo,
  getAccounts,
  editAccount,
  getInfo,
  selectAccount,
  validateAccount,
  getAllowance,
  updateAllowance,
  getPayments,
  getPaymentsByAccount,
  getSettings,
  getStatus,
  makeInvoice,
  connectPeer,
  setSetting,
  swr: {
    getAccountInfo: swrGetAccountInfo,
  },
  removeAccount,
  unlock,
  getBlocklist,
  getInvoices,
  lnurlAuth,
  getCurrencyRate,
  nostr: {
    getPrivateKey: getNostrPrivateKey,
    getPublicKey: getNostrPublicKey,
    generatePrivateKey: generateNostrPrivateKey,
    setPrivateKey: setNostrPrivateKey,
    removePrivateKey: removeNostrPrivateKey,
  },
  getMnemonic,
  setMnemonic,
  generateMnemonic,
};
