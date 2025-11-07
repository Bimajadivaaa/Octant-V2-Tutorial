'use client';

import { useAccount } from 'wagmi';
import { useAutoSwitchNetwork } from '../hooks/useAutoSwitchNetwork';
import { useIsMounted } from '../hooks/useIsMounted';

export default function NetworkChecker() {
  const { isConnected } = useAccount();
  const { isCorrectNetwork, switchToLocal, isSwitching, currentChainId } = useAutoSwitchNetwork();
  const mounted = useIsMounted();

  // Wait for hydration
  if (!mounted) return null;

  // Hanya tampil jika wallet connected tapi network salah
  if (!isConnected || isCorrectNetwork) return null;

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet';
      case 5: return 'Goerli Testnet';
      case 137: return 'Polygon Mainnet';
      case 31337: return 'Local Anvil (Chain 31337)';
      default: return `Chain ${chainId}`;
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-4">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <div className="text-yellow-400 mr-2">⚠️</div>
              <h3 className="text-sm font-bold text-yellow-800">Wrong Network Detected</h3>
            </div>
            <div className="text-sm text-yellow-700 mt-1">
              You&apos;re connected to <span className="font-mono">{getNetworkName(currentChainId || 0)}</span>. 
              Please switch to <span className="font-mono">Local Anvil</span> to use this demo.
            </div>
            <div className="text-xs text-yellow-600 mt-2">
              This demo requires connection to local blockchain (Chain ID: 31337)
              <br />
              Debug: Current Chain ID = {currentChainId}, isCorrectNetwork = {String(isCorrectNetwork)}
            </div>
          </div>
          <button
            onClick={switchToLocal}
            disabled={isSwitching}
            className="px-4 py-2 bg-yellow-600 text-white text-sm font-bold hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSwitching ? 'SWITCHING...' : 'SWITCH NETWORK'}
          </button>
        </div>
      </div>
    </div>
  );
}