import type { AccountInfoRes } from "~/common/lib/api";
import state from "~/extension/background-script/state";
import type { MessageAccountInfo } from "~/types";

const info = async (message: MessageAccountInfo) => {
  try {
    const connector = await state.getState().getConnector();
    const currentAccountId = state.getState().currentAccountId;
    const currentAccount = state.getState().getAccount();

    const [info, balance] = await Promise.all([
      connector.getInfo(),
      connector.getBalance(),
    ]);

    if (!currentAccount || !currentAccountId) {
      return { error: "No current account set" };
    }

    if (currentAccount.name === "LND") {
      throw new Error("simulate LND fail");
    }

    const result: AccountInfoRes = {
      currentAccountId: currentAccountId,
      name: currentAccount.name,
      info: info.data,
      balance: {
        balance: balance.data.balance,
        currency: balance.data.currency || "BTC", // set default currency for every account
      },
    };

    return {
      data: result,
    };
  } catch (e) {
    console.error(e);
    return {
      error: "fetching account info failed",
    };
  }
};

export default info;
