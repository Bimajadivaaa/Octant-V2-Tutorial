'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useUserBalance, useVaultData, useVaultOperations } from '../hooks/useVaultContract';
import { useIsMounted } from '../hooks/useIsMounted';

export default function WithdrawSection() {
  const [amount, setAmount] = useState('');
  const { address, isConnected } = useAccount();
  const { vaultShares } = useUserBalance(address);
  const { sharePrice } = useVaultData();
  const mounted = useIsMounted();
  const { 
    withdraw, 
    isPending, 
    isConfirming, 
    isConfirmed, 
    error 
  } = useVaultOperations();

  const maxWithdraw = (parseFloat(vaultShares) * parseFloat(sharePrice)).toFixed(2);
  const isProcessing = isPending || isConfirming;

  const handleWithdraw = async () => {
    if (!amount || !address) return;
    withdraw(amount, address, address);
  };

  // Clear form on successful transaction
  if (isConfirmed) {
    setTimeout(() => setAmount(''), 500);
  }

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
          <div className="text-sm">Please connect your wallet to withdraw funds</div>
        </div>
      </div>
    );
  }

  if (parseFloat(vaultShares) === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-gray-500">
          <div className="text-lg font-bold mb-2">No Vault Shares</div>
          <div className="text-sm">You need to deposit USDC first to have shares to withdraw</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-2">WITHDRAW USDC</h3>
        <p className="text-sm text-gray-600 mb-4">
          Redeem your vault shares to withdraw your principal. Your deposited amount remains protected.
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
          ✅ Transaction confirmed! Your withdrawal was successful.
        </div>
      )}

      {/* Amount Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium">
          AMOUNT (USDC)
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 border border-black text-lg font-mono focus:outline-none focus:ring-2 focus:ring-black"
            disabled={isProcessing}
          />
          <button
            onClick={() => setAmount(maxWithdraw)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs border border-gray-400 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            disabled={isProcessing}
          >
            MAX
          </button>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Vault Shares: {parseFloat(vaultShares).toLocaleString()} YDS</span>
          <span>Max Withdrawal: {parseFloat(maxWithdraw).toLocaleString()} USDC</span>
        </div>
      </div>

      {/* Preview */}
      {amount && parseFloat(amount) > 0 && (
        <div className="bg-gray-50 border border-gray-300 p-4">
          <h4 className="text-sm font-bold mb-2">WITHDRAWAL PREVIEW</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>You redeem:</span>
              <span className="font-mono">~{(parseFloat(amount) / parseFloat(sharePrice)).toFixed(2)} YDS shares</span>
            </div>
            <div className="flex justify-between">
              <span>You receive:</span>
              <span className="font-mono">{amount} USDC</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Share price:</span>
              <span className="font-mono">{sharePrice} USDC</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleWithdraw}
        disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(maxWithdraw) || isProcessing}
        className="w-full py-3 bg-black text-white font-bold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {isConfirming ? 'CONFIRMING...' : 'WITHDRAW'}
      </button>

      {/* Account Info */}
      <div className="border border-gray-300 p-4">
        <h4 className="text-sm font-bold mb-2">YOUR VAULT POSITION</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Vault Shares:</span>
            <span className="font-mono">{parseFloat(vaultShares).toLocaleString()} YDS</span>
          </div>
          <div className="flex justify-between">
            <span>Current Value:</span>
            <span className="font-mono">{parseFloat(maxWithdraw).toLocaleString()} USDC</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Share Price:</span>
            <span className="font-mono">{sharePrice} USDC/share</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Withdrawal returns your protected principal</p>
        <p>• Generated yield has been donated to public goods</p>
        <p>• No withdrawal fees or penalties</p>
      </div>
    </div>
  );
}