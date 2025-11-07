'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useUserBalance, useVaultOperations } from '../hooks/useVaultContract';
import { useIsMounted } from '../hooks/useIsMounted';

export default function MintUSDC() {
  const [amount, setAmount] = useState('');
  const [showMintSuccess, setShowMintSuccess] = useState(false);
  const [mintedAmount, setMintedAmount] = useState('');
  const { address, isConnected } = useAccount();
  const { usdcBalance, refetchUsdcBalance } = useUserBalance(address);
  const mounted = useIsMounted();
  const { 
    mintUSDC, 
    isPending, 
    isConfirming, 
    isConfirmed, 
    error 
  } = useVaultOperations();

  const isProcessing = isPending || isConfirming;

  const handleMint = async () => {
    if (!amount || !address) return;
    setMintedAmount(amount); // Store amount before minting
    mintUSDC(amount, address);
  };

  // Show success popup when mint is confirmed
  useEffect(() => {
    if (isConfirmed && !isPending && !isConfirming && mintedAmount) {
      // Use setTimeout to avoid direct setState in effect
      const timer = setTimeout(() => {
        setShowMintSuccess(true);
        // Manually refresh USDC balance immediately after successful mint
        refetchUsdcBalance();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, isPending, isConfirming, mintedAmount, refetchUsdcBalance]);

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
          <div className="text-sm">Please connect your wallet to mint USDC</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-2">MINT USDC (TEST TOKENS)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Mint test USDC tokens to your wallet. This is only available on the demo/test environment.
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
          ✅ Transaction confirmed! USDC minted successfully.
        </div>
      )}

      {/* Current Balance */}
      <div className="bg-blue-50 border border-blue-200 p-4">
        <h4 className="text-sm font-bold mb-2">CURRENT BALANCE</h4>
        <div className="text-lg font-mono font-bold text-blue-800">
          {parseFloat(usdcBalance).toLocaleString()} USDC
        </div>
        <div className="text-xs text-blue-600 mt-1">
          Your current USDC balance in wallet
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium">
          AMOUNT TO MINT (USDC)
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
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <button
              onClick={() => setAmount('1000')}
              className="px-2 py-1 text-xs border border-gray-400 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              disabled={isProcessing}
            >
              1K
            </button>
            <button
              onClick={() => setAmount('10000')}
              className="px-2 py-1 text-xs border border-gray-400 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
              disabled={isProcessing}
            >
              10K
            </button>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Suggested amounts: 1,000 or 10,000 USDC</span>
          <span>For demo/testing purposes</span>
        </div>
      </div>

      {/* Preview */}
      {amount && parseFloat(amount) > 0 && (
        <div className="bg-gray-50 border border-gray-300 p-4">
          <h4 className="text-sm font-bold mb-2">MINT PREVIEW</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>You will receive:</span>
              <span className="font-mono font-bold">{amount} USDC</span>
            </div>
            <div className="flex justify-between">
              <span>New balance will be:</span>
              <span className="font-mono font-bold">
                {(parseFloat(usdcBalance) + parseFloat(amount)).toLocaleString()} USDC
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleMint}
        disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
        className="cursor-pointer w-full py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? (isPending ? 'SUBMITTING...' : 'CONFIRMING...') : 'MINT USDC'}
      </button>

      {/* Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• This is mock USDC for demo purposes only</p>
        <p>• Real USDC cannot be minted by users</p>
        <p>• Use minted USDC to test the vault deposit function</p>
        <p>• Recommended: Mint 1,000+ USDC for meaningful testing</p>
      </div>

      {/* Mint Success Popup */}
      {showMintSuccess && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white border-2 border-black p-8 max-w-md mx-4 shadow-2xl transform transition-all duration-300 ease-out">
            <div className="text-center">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-2xl font-bold mb-2">TOKENS MINTED!</h3>
              <p className="text-lg mb-4">
                Successfully minted <span className="font-mono font-bold text-blue-600">{mintedAmount ? parseFloat(mintedAmount).toLocaleString() : '0'} USDC</span>!
              </p>
              <div className="bg-blue-50 border border-blue-200 p-4 mb-4">
                <p className="text-sm text-blue-700">
                  💳 <strong>New Balance:</strong> {parseFloat(usdcBalance).toLocaleString()} USDC<br />
                  ✅ <strong>Ready for Deposit:</strong> Switch to DEPOSIT tab<br />
                  🎯 <strong>Demo Purpose:</strong> Test tokens for vault interaction<br />
                  🚀 <strong>Next Step:</strong> Deposit to start earning yield
                </p>
              </div>
              <button
                onClick={() => {
                  setShowMintSuccess(false);
                  setMintedAmount('');
                }}
                className="px-6 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 cursor-pointer"
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