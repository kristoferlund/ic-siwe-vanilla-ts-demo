import { createWalletClient, custom } from "viem";
import { mainnet } from "viem/chains";

const [account] = await window.ethereum!.request({
  method: "eth_requestAccounts",
});

const client = createWalletClient({
  account,
  chain: mainnet,
  transport: custom(window.ethereum!),
});

export async function getAddress() {
  const [address] = await client.getAddresses();
  console.log(address);
  return address;
}
