import { createWalletClient, custom } from "viem";
import { mainnet } from "viem/chains";
import { localStore } from "./state";

export async function connectWallet() {
  if (!window.ethereum) {
    console.error("No Ethereum provider found. Please install MetaMask.");
    return;
  }
  const [account] = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: custom(window.ethereum),
  });
  localStore.send({ type: "setWalletClient", walletClient });
}

export async function attemptCreateWalletClient() {
  if (!window.ethereum) {
    console.error("No Ethereum provider found. Please install MetaMask.");
    return;
  }
  const client = createWalletClient({
    chain: mainnet,
    transport: custom(window.ethereum),
  });
  const [account] = await client.getAddresses();
  if (account) {
    localStore.send({ type: "setWalletClient", walletClient: client });
  }
}
