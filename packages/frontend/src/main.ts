import "./style.css";
import typescriptLogo from "/typescript.svg";
import icLogo from "/ic.svg";
import ethLogo from "/ethereum.svg";
import { SIWEProvider, store } from "ic-use-siwe-identity";
import {
  canisterId,
  idlFactory,
} from "../../ic_siwe_provider/declarations/index";
import { createWalletClient, custom, WalletClient } from "viem";
import { mainnet } from "viem/chains";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <div>
      <a href="https://internetcomputer.org" target="_blank">
        <img src="${icLogo}" class="logo" alt="Internet Computer" />
      </a>
      <a href="https://ethereum.org" target="_blank">
        <img src="${ethLogo}" class="logo" alt="Ethereum" />
      </a>
      <a href="https://www.typescriptlang.org/" target="_blank">
        <img src="${typescriptLogo}" class="logo" alt="TypeScript" />
      </a>
    </div>
    <h1>Sign in with Ethereum</h1>
    <div>This demo application and template demonstrates how to sign in Ethereum users into an IC canister using ic-use-siwe-identity and ic-siwe-provider canister.</div>
    <div class="pill-container">
      <div class="pill">Vanilla TS</div>
      <div class="pill">No framework</div>
    </div>
    <div class="container">
      <div class="ethAddress" id="ethAddress"></div>
      <div class="icPrincipal" id="icPrincipal"></div>
      <button id="connectButton" type="button">Connect</button>
      <button id="loginButton" type="button" hidden>Login</button>
      <button id="logoutButton" type="button" hidden>Logout</button>
      <div class="error" id="error"></div>
    </div>
`;

import { createStore } from "@xstate/store";

interface Context {
  walletClient?: WalletClient;
}

const initialState: Context = {
  walletClient: undefined,
};

const localStore = createStore({
  context: initialState,
  on: {
    setWalletClient: (_, event: { walletClient: WalletClient }) => ({
      walletClient: event.walletClient,
    }),
  },
});

const siwe = new SIWEProvider(idlFactory, canisterId);

const ethAddressDiv = document.querySelector<HTMLDivElement>("#ethAddress")!;
const icPrincipalDiv = document.querySelector<HTMLDivElement>("#icPrincipal")!;
const connectButton =
  document.querySelector<HTMLButtonElement>("#connectButton")!;
const loginButton = document.querySelector<HTMLButtonElement>("#loginButton")!;
const logoutButton =
  document.querySelector<HTMLButtonElement>("#logoutButton")!;
const errorDiv = document.querySelector<HTMLDivElement>("#error")!;

connectButton.addEventListener("click", connectWallet);
loginButton.addEventListener("click", () => siwe.login());
logoutButton.addEventListener("click", () => siwe.clear());

async function connectWallet() {
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

async function attemptCreateWalletClient() {
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
attemptCreateWalletClient();

function updateIcPrincipalDiv() {
  const identity = store.getSnapshot().context.identity;
  if (identity) {
    let principal = identity.getPrincipal().toText();
    icPrincipalDiv.innerHTML =
      principal.slice(0, 6) + "..." + principal.slice(-4);
    return;
  }
  icPrincipalDiv.innerHTML = "";
}
updateIcPrincipalDiv();

function showHideLoginLogout() {
  const walletClient = localStore.getSnapshot().context.walletClient;
  if (!walletClient) return;
  const identity = store.getSnapshot().context.identity;
  if (identity) {
    loginButton.hidden = true;
    logoutButton.hidden = false;
    return;
  }
  loginButton.hidden = false;
  logoutButton.hidden = true;
}
showHideLoginLogout();

store.subscribe((state) => {
  const { prepareLoginStatus, prepareLoginError, loginStatus, loginError } =
    state.context;

  if (loginStatus === "idle") {
    loginButton.innerHTML = "Login";
  }
  if (prepareLoginStatus === "preparing") {
    loginButton.innerHTML = "Preparing...";
  }
  if (loginStatus === "logging-in") {
    loginButton.innerHTML = "Logging in...";
  }

  showHideLoginLogout();
  updateIcPrincipalDiv();

  if (loginError) {
    errorDiv.innerHTML = loginError.message;
  } else if (prepareLoginError) {
    errorDiv.innerHTML = prepareLoginError.message;
  } else {
    errorDiv.innerHTML = "";
  }
});

localStore.subscribe(async (state) => {
  const context = state.context;
  if (context.walletClient) {
    connectButton.hidden = true;
    loginButton.hidden = false;
    const [address] = await context.walletClient.getAddresses();
    if (address) {
      ethAddressDiv.innerHTML = address.slice(0, 6) + "..." + address.slice(-4);
    }
  }
});
