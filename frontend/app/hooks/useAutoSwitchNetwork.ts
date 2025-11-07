'use client';

import { useAccount, useSwitchChain, useChainId } from 'wagmi';
import { useEffect } from 'react';
import { localhost } from 'wagmi/chains';

export function useAutoSwitchNetwork() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const targetChainId = 31337; // Explicit chain ID

  useEffect(() => {
    // Auto switch ke local chain setelah wallet connected
    if (isConnected && chainId !== targetChainId) {
      // Delay sedikit untuk memastikan connection stable
      const timer = setTimeout(() => {
        switchChain({ chainId: targetChainId });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isConnected, chainId, targetChainId, switchChain]);

  return {
    isCorrectNetwork: chainId === targetChainId,
    isSwitching: isPending,
    switchToLocal: () => switchChain({ chainId: targetChainId }),
    currentChainId: chainId,
    targetChainId
  };
}