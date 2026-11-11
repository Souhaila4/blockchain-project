"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getAddress } from "ethers";
import { describeConnectError } from "@/lib/errors";
import { CHAIN_NAME } from "@/lib/config";
import {
  connectWallet,
  disconnectWallet,
  getEthereum,
  isLoyalChain,
  restoreWallet,
  toAccounts,
} from "@/lib/wallet";

type WalletState = {
  /** Connected account, or null. */
  account: string | null;
  /** False until the first silent check for an already-approved account has finished. */
  ready: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  /** Leaves the app. The home page shows the connect button again. */
  disconnect: () => Promise<void>;
};

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connectingRef = useRef(false);

  useEffect(() => {
    let active = true;

    restoreWallet().then((restored) => {
      if (!active) return;
      setAccount(restored);
      setReady(true);
    });

    const ethereum = getEthereum();
    if (!ethereum?.on) {
      return () => {
        active = false;
      };
    }

    const onAccountsChanged = (accounts: unknown) => {
      const [next] = toAccounts(accounts);
      setAccount(next ? getAddress(next) : null);
    };

    const onChainChanged = (chainId: unknown) => {
      // Connecting switches the chain on purpose, so only react to changes made afterwards.
      if (connectingRef.current || isLoyalChain(chainId)) return;
      setAccount(null);
      setError(`Switch MetaMask to ${CHAIN_NAME} and connect again.`);
    };

    ethereum.on("accountsChanged", onAccountsChanged);
    ethereum.on("chainChanged", onChainChanged);

    return () => {
      active = false;
      ethereum.removeListener?.("accountsChanged", onAccountsChanged);
      ethereum.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    connectingRef.current = true;
    setConnecting(true);
    setError(null);

    try {
      setAccount(await connectWallet());
    } catch (connectError) {
      setAccount(null);
      setError(describeConnectError(connectError));
    } finally {
      connectingRef.current = false;
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectWallet();
    setAccount(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({ account, ready, connecting, error, connect, disconnect }),
    [account, ready, connecting, error, connect, disconnect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used inside <WalletProvider>.");
  return context;
}
