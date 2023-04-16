import { Wallet } from "ethers";

export const getBurnerWallet = (worldAddress?: string) => {
  const storageKey = worldAddress ? `mud:burnerWallet:${worldAddress}` : "mud:burnerWallet";

  if (!worldAddress) {
    const urlKey = new URLSearchParams(window.location.search).get("privateKey");
    if (urlKey) return new Wallet(urlKey);

    // Migrate old private keys from previous localStorage key
    const previousPrivateKey = localStorage.getItem("burnerWallet");
    if (previousPrivateKey) {
      localStorage.removeItem("burnerWallet");
      localStorage.setItem(storageKey, previousPrivateKey);
    }
  }

  const privateKey = localStorage.getItem(storageKey);
  if (privateKey) return new Wallet(privateKey);

  const burnerWallet = Wallet.createRandom();
  localStorage.setItem(storageKey, burnerWallet.privateKey);
  return burnerWallet;
};
