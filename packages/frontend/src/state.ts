import { createStore } from "@xstate/store";
import { WalletClient } from "viem";

interface Context {
  walletClient?: WalletClient;
}

const initialState: Context = {
  walletClient: undefined,
};

export const localStore = createStore({
  context: initialState,
  on: {
    setWalletClient: (_, event: { walletClient: WalletClient }) => ({
      walletClient: event.walletClient,
    }),
  },
});
