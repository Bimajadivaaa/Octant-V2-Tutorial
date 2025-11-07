'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useVaultData, useVaultOperations } from '../hooks/useVaultContract';
import { useDonationData } from '../hooks/useDonationData';
import { useIsMounted } from '../hooks/useIsMounted';

export default function HarvestSection() {
  const { isConnected } = useAccount();
  const { totalAssets, lastRecordedAssets } = useVaultData();
  const { currentProfit, recipients } = useDonationData();
  const mounted = useIsMounted();
  const { 
    harvest, 
    isPending, 
    isConfirming, 
    isConfirmed, 
    error 
  } = useVaultOperations();

  const isProcessing = isPending || isConfirming;
  const hasProfit = parseFloat(currentProfit) > 0;

  const handleHarvest = async () => {
    harvest();
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg font-bold mb-2">Loading...</div>
          <div className="text-sm">Please wait</div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg font-bold mb-2">Connect Wallet</div>
          <div className="text-sm">Please connect your wallet to harvest yield</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-2">HARVEST YIELD</h3>
        <p className="text-sm text-gray-600 mb-4">
          Harvest accumulated yield and donate it to public goods. Your principal remains protected.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
          Error: {error.message || 'Transaction failed'}
        </div>
      )}

      {/* Success Display */}
      {isConfirmed && (
        <div className="bg-green-50 border border-green-200 p-3 text-green-700 text-sm">
          ✅ Transaction confirmed! Yield successfully harvested and donated.
        </div>
      )}

      {/* Harvest Stats */}
      <div className="border border-gray-300 p-4">
        <h4 className="text-sm font-bold mb-3">HARVEST STATUS</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Current Total Assets:</span>
            <span className="font-mono font-bold">{parseFloat(totalAssets).toLocaleString()} USDC</span>
          </div>
          <div className="flex justify-between">
            <span>Watermark (Protected):</span>
            <span className="font-mono font-bold text-green-600">{parseFloat(lastRecordedAssets).toLocaleString()} USDC</span>
          </div>
          <div className="flex justify-between">
            <span>Available Profit:</span>
            <span className={`font-mono font-bold ${hasProfit ? 'text-green-600' : 'text-gray-500'}`}>
              {parseFloat(currentProfit).toLocaleString()} USDC
            </span>
          </div>
          <div className="flex justify-between">
            <span>Watermark Protection:</span>
            <span className="text-green-600 text-xs">✓ ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Donation Preview */}
      {hasProfit && (
        <div className="bg-gray-50 border border-gray-300 p-4">
          <h4 className="text-sm font-bold mb-2">DONATION BREAKDOWN</h4>
          <div className="space-y-1 text-sm">
            {recipients.map((recipient, index) => (
              <div key={index} className="flex justify-between">
                <span>{recipient.name} ({recipient.allocation}):</span>
                <span className="font-mono">~{(parseFloat(currentProfit) * (recipient.allocation === '70%' ? 0.7 : 0.3)).toFixed(2)} USDC</span>
              </div>
            ))}
            <div className="border-t border-gray-400 pt-1 mt-2">
              <div className="flex justify-between font-bold">
                <span>Total to Donate:</span>
                <span className="font-mono">{parseFloat(currentProfit).toLocaleString()} USDC</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Profit Message */}
      {!hasProfit && (
        <div className="bg-blue-50 border border-blue-200 p-4 text-center">
          <div className="text-sm text-blue-700">
            <div className="font-bold mb-1">No Profit Available</div>
            <div>Vault assets haven't exceeded the watermark yet. Wait for yield to accumulate.</div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleHarvest}
        disabled={!hasProfit || isProcessing}
        className="w-full py-3 bg-black text-white font-bold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {isProcessing ? (isPending ? 'SUBMITTING...' : 'CONFIRMING...') : 'HARVEST & DONATE'}
      </button>

      {/* How It Works */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Harvest captures profit above your principal (watermark)</p>
        <p>• All generated yield is donated to public goods recipients</p>
        <p>• Your original deposit amount remains completely safe</p>
        <p>• Anyone can call harvest to benefit public goods</p>
      </div>
    </div>
  );
}