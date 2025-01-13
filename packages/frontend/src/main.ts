import "./style.css";
import typescriptLogo from "/typescript.svg";
import icLogo from "/ic.svg";
import ethLogo from "/ethereum.svg";
import { SIWEProvider, store } from "ic-use-siwe-identity";
import {
  canisterId,
  idlFactory,
} from "../../ic_siwe_provider/declarations/index";
import { createWalletClient, custom } from "viem";
import { mainnet } from "viem/chains";
import { DelegationIdentity } from "@dfinity/identity";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${icLogo}" class="logo" alt="Internet Computer" />
    </a>
    <a href="https://vite.dev" target="_blank">
      <img src="${ethLogo}" class="logo" alt="Ethereum" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo" alt="TypeScript" />
    </a>
    <h1>Sign in with Ethereum</h1>
    <div>This React demo application and template demonstrates how to login Ethereum users into an IC canister using the ic-use-siwe-identity hook and ic-siwe-provider canister.</div>
    <div class="ethAddress" id="ethAddress"></div>
    <div class="icPrincipal" id="icPrincipal"></div>
    <button id="button" type="button">Login</button>
    <div class="error" id="error"></div>
    </div>
  </div>
`;

const [account] = await window.ethereum!.request({
  method: "eth_requestAccounts",
});

const client = createWalletClient({
  account,
  chain: mainnet,
  transport: custom(window.ethereum!),
});

const siwe = new SIWEProvider(idlFactory, canisterId);

const ethAddressDiv = document.querySelector<HTMLDivElement>("#ethAddress")!;
const icPrincipalDiv = document.querySelector<HTMLDivElement>("#icPrincipal")!;
const button = document.querySelector<HTMLButtonElement>("#button")!;
const errorDiv = document.querySelector<HTMLDivElement>("#error")!;

async function getAddress() {
  const [address] = await client.getAddresses();
  console.log(address);
  return address;
}
getAddress().then((address) => {
  ethAddressDiv.innerHTML = address.slice(0, 6) + "..." + address.slice(-4);
});

function setIcPrincipalText(identity?: DelegationIdentity) {
  if (identity) {
    let principal = identity.getPrincipal().toText();
    icPrincipalDiv.innerHTML =
      principal.slice(0, 6) + "..." + principal.slice(-4);
    return;
  }
  icPrincipalDiv.innerHTML = "";
}

const identity = store.getSnapshot().context.identity;
setIcPrincipalText(identity);
setButtonText(identity);

function setButtonText(identity?: DelegationIdentity) {
  if (identity) {
    button.innerHTML = "Logout";
    return;
  }
  button.innerHTML = "Login";
}
button.addEventListener("click", () => {
  const identity = store.getSnapshot().context.identity;
  if (identity) {
    siwe.clear();
  } else {
    siwe.login();
  }
});

store.subscribe((state) => {
  const {
    prepareLoginStatus,
    prepareLoginError,
    loginStatus,
    loginError,
    identity,
  } = state.context;

  if (prepareLoginStatus === "preparing") {
    button.innerHTML = "Preparing...";
  } else if (loginStatus === "logging-in") {
    button.innerHTML = "Logging in...";
  } else {
    setButtonText(identity);
  }

  setIcPrincipalText(identity);

  if (loginError) {
    errorDiv.innerHTML = loginError.message;
  } else if (prepareLoginError) {
    errorDiv.innerHTML = prepareLoginError.message;
  } else {
    errorDiv.innerHTML = "";
  }
});
