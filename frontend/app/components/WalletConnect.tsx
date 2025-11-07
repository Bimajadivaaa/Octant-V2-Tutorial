'use client';

import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';
import { useState } from 'react';
import { useAutoSwitchNetwork } from '../hooks/useAutoSwitchNetwork';
import { useIsMounted } from '../hooks/useIsMounted';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [showConnectors, setShowConnectors] = useState(false);
  const mounted = useIsMounted();
  const chainId = useChainId();
  const { isCorrectNetwork, isSwitching, switchToLocal } = useAutoSwitchNetwork();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="px-4 py-3 bg-gray-200 text-gray-500 font-bold">
        LOADING...
      </div>
    );
  }

  if (isConnected && address) {
    // Show network status
    if (!isCorrectNetwork) {
      return (
        <div className="flex items-center gap-2 border border-red-500 p-3 bg-red-50">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="font-mono text-sm text-red-700">{formatAddress(address)}</span>
          <button
            onClick={switchToLocal}
            disabled={isSwitching}
            className="ml-2 px-3 py-1 text-xs bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 cursor-pointer"
          >
            {isSwitching ? 'SWITCHING...' : 'SWITCH TO LOCAL'}
          </button>
          <button
            onClick={() => disconnect()}
            className="ml-1 px-2 py-1 text-xs border border-gray-400 hover:bg-gray-50 cursor-pointer"
          >
            DISCONNECT
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 border border-black p-3">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="font-mono text-sm">{formatAddress(address)}</span>
        <span className="text-xs text-green-600">Local Chain</span>
        <button
          onClick={() => disconnect()}
          className="ml-2 px-2 py-1 text-xs border border-gray-400 hover:bg-gray-50 cursor-pointer"
        >
          DISCONNECT
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowConnectors(!showConnectors)}
        disabled={isPending}
        className="px-4 py-3 bg-black text-white font-bold hover:bg-gray-800 disabled:bg-gray-300 cursor-pointer"
      >
        {isPending ? 'CONNECTING...' : 'CONNECT WALLET'}
      </button>
      
      {showConnectors && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-black shadow-lg z-10 min-w-[200px]">
          <div className="p-2">
            <div className="text-xs font-bold mb-2">CHOOSE WALLET:</div>
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => {
                  connect({ connector });
                  setShowConnectors(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-200 last:border-b-0 cursor-pointer"
              >
                {connector.name}
                {isPending && connector.name === 'MetaMask' && (
                  <span className="text-xs text-gray-500"> (connecting...)</span>
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-200 p-2 text-xs text-gray-500">
            🔄 Auto-switch to Local Network (Chain ID: 31337)
            <br/>
            📡 RPC: http://127.0.0.1:8545
          </div>
        </div>
      )}
    </div>
  );
}