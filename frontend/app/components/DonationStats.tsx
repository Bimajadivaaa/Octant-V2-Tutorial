'use client';

import { useDonationData } from '../hooks/useDonationData';
import { useAccount } from 'wagmi';
import { useIsMounted } from '../hooks/useIsMounted';

export default function DonationStats() {
  const { isConnected } = useAccount();
  const { totalDonated, currentProfit, lastHarvest, recipients } = useDonationData();
  const mounted = useIsMounted();

  const formatNumber = (num: string) => {
    const number = parseFloat(num);
    return number.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  if (!mounted) {
    return (
      <div className="border border-black p-6">
        <h2 className="text-lg font-bold mb-4">DONATION IMPACT</h2>
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-black p-6">
      <h2 className="text-lg font-bold mb-4">DONATION IMPACT</h2>
      
      {!isConnected ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">Connect wallet to view donation impact</div>
        </div>
      ) : (
        <>
          {/* Main stats */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Donated</span>
              <span className="font-mono font-bold">{formatNumber(totalDonated)} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Available to Harvest</span>
              <span className="font-mono font-bold text-green-600">{formatNumber(currentProfit)} USDC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Harvest</span>
              <span className="font-mono font-bold text-gray-500">{formatNumber(lastHarvest)} USDC</span>
            </div>
          </div>

          {/* Recipients breakdown */}
          <div className="border-t border-gray-300 pt-4">
            <h3 className="text-sm font-bold mb-3">ALLOCATION BREAKDOWN</h3>
            <div className="space-y-3">
              {recipients.map((recipient, index) => (
                <div key={index} className="text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-600">{recipient.name}</span>
                    <span className="font-bold">{recipient.allocation}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="font-mono text-gray-400">{recipient.address}</span>
                    <span className="font-mono font-bold">{formatNumber(recipient.received)} USDC</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Impact note */}
      <div className="mt-4 pt-4 border-t border-gray-300">
        <p className="text-xs text-gray-500">
          ✨ Your principal remains safe • Only yield is donated
        </p>
      </div>
    </div>
  );
}