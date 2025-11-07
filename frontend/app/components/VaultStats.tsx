'use client';

import { useVaultData } from '../hooks/useVaultContract';
import { useAccount } from 'wagmi';
import { useIsMounted } from '../hooks/useIsMounted';

export default function VaultStats() {
  const { isConnected } = useAccount();
  const { totalAssets, totalSupply, sharePrice, lastRecordedAssets } = useVaultData();
  const mounted = useIsMounted();

  const formatNumber = (num: string) => {
    const number = parseFloat(num);
    return number.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const formatLargeNumber = (num: string) => {
    const number = parseFloat(num);
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M';
    } else if (number >= 1000) {
      return (number / 1000).toFixed(1) + 'K';
    }
    return number.toFixed(2);
  };

  if (!mounted) {
    return (
      <div className="border border-black p-6">
        <h2 className="text-lg font-bold mb-4">VAULT STATISTICS</h2>
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-black p-6">
      <h2 className="text-lg font-bold mb-4">VAULT STATISTICS</h2>
      
      {!isConnected ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">Connect wallet to view vault statistics</div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Total Assets</span>
            <span className="font-mono font-bold">{formatNumber(totalAssets)} USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Total Share Supply</span>
            <span className="font-mono font-bold">{formatLargeNumber(totalSupply)} YDS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Share Price</span>
            <span className="font-mono font-bold">{sharePrice} USDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Watermark (Protected)</span>
            <span className="font-mono font-bold text-green-600">{formatNumber(lastRecordedAssets)} USDC</span>
          </div>
        </div>
      )}
      
      {/* Status indicator */}
      <div className="mt-6 pt-4 border-t border-gray-300">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-xs text-gray-600">
            {isConnected ? 'YIELD GENERATION ACTIVE' : 'WALLET NOT CONNECTED'}
          </span>
        </div>
      </div>
    </div>
  );
}