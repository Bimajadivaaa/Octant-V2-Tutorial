'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useVaultData, useVaultOperations, useUserBalance } from '../hooks/useVaultContract';
import { useDonationData } from '../hooks/useDonationData';
import { useIsMounted } from '../hooks/useIsMounted';

export default function HarvestSection() {
  const [showHarvestSuccess, setShowHarvestSuccess] = useState(false);
  const [harvestedAmount, setHarvestedAmount] = useState('');
  const { isConnected, address } = useAccount();
  const { totalAssets, lastRecordedAssets } = useVaultData();
  const { currentProfit, recipients } = useDonationData();
  const { refetchVaultShares, refetchUsdcBalance } = useUserBalance(address);
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
    // Store the current profit amount before harvest
    setHarvestedAmount(currentProfit);
    harvest();
  };

  // Show success popup when harvest is confirmed
  useEffect(() => {
    if (isConfirmed && !isPending && !isConfirming && harvestedAmount) {
      // Manually refresh balances immediately after successful harvest
      if (refetchVaultShares) refetchVaultShares();
      if (refetchUsdcBalance) refetchUsdcBalance();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowHarvestSuccess(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed, isPending, isConfirming, harvestedAmount]);

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
            <div>Vault assets haven&apos;t exceeded the watermark yet. Wait for yield to accumulate.</div>
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

      {/* Harvest Success Popup */}
      {showHarvestSuccess && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white border-2 border-black p-8 max-w-lg mx-4 shadow-2xl transform transition-all duration-300 ease-out">
            <div className="text-center">
              <div className="text-6xl mb-4">💝</div>
              <h3 className="text-2xl font-bold mb-2">HARVEST SUCCESSFUL!</h3>
              <p className="text-lg mb-4">
                Successfully harvested <span className="font-mono font-bold text-green-600">{harvestedAmount ? parseFloat(harvestedAmount).toFixed(2) : '0'} USDC</span> profit!
              </p>
              <div className="bg-green-50 border border-green-200 p-4 mb-4">
                <p className="text-sm text-green-700">
                  🎁 <strong>Total Donated:</strong> {harvestedAmount ? parseFloat(harvestedAmount).toFixed(2) : '0'} USDC<br />
                  📊 <strong>Distribution:</strong> {recipients.length > 0 && recipients[0] ? recipients[0].allocation : '70%'} to {recipients.length > 0 && recipients[0] ? recipients[0].name : 'Recipient 1'}, {recipients.length > 1 && recipients[1] ? recipients[1].allocation : '30%'} to {recipients.length > 1 && recipients[1] ? recipients[1].name : 'Recipient 2'}<br />
                  🌱 <strong>Impact:</strong> Supporting public goods ecosystem<br />
                  💰 <strong>Your Principal:</strong> Remains 100% protected
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-3 mb-4">
                <p className="text-xs text-blue-700">
                  <strong>🎯 Octant V2 Demo Complete!</strong><br />
                  You&apos;ve successfully demonstrated: Mint → Deposit → Simulate Yield → Harvest & Donate
                </p>
              </div>
              <button
                onClick={() => {
                  setShowHarvestSuccess(false);
                  setHarvestedAmount('');
                }}
                className="px-6 py-2 bg-green-600 text-white font-bold hover:bg-green-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}