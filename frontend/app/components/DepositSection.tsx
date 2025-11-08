'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useUserBalance, useVaultData, useVaultOperations } from '../hooks/useVaultContract';
import { useIsMounted } from '../hooks/useIsMounted';

export default function DepositSection() {
  const [amount, setAmount] = useState('');
  const [lastAction, setLastAction] = useState<'approve' | 'deposit' | null>(null);
  const hasTriggeredAutoDeposit = useRef(false);
  const [showYieldSuccess, setShowYieldSuccess] = useState(false);
  const [yieldAmount, setYieldAmount] = useState('');
  const [hasDeposited, setHasDeposited] = useState(false);
  const { address, isConnected } = useAccount();
  const { usdcBalance, usdcAllowance, vaultShares, refetchUsdcBalance, refetchVaultShares, refetchUsdcAllowance } = useUserBalance(address);
  const { sharePrice } = useVaultData();
  const mounted = useIsMounted();
  const { 
    approve, 
    deposit,
    simulateYield,
    // Approve states
    isApprovePending,
    isApproveConfirming,
    isApproveConfirmed,
    approveError,
    // Deposit states
    isDepositPending,
    isDepositConfirming,
    isDepositConfirmed,
    depositError,
    // Yield states
    isYieldPending,
    isYieldConfirming,
    isYieldConfirmed,
    yieldError,
    // General states
    isPending,
    isConfirming,
    isConfirmed,
    error
  } = useVaultOperations();

  const needsApproval = amount && parseFloat(amount) > parseFloat(usdcAllowance);
  const isApproveProcessing = isApprovePending || isApproveConfirming;
  const isDepositProcessing = isDepositPending || isDepositConfirming;
  const isAnyProcessing = isApproveProcessing || isDepositProcessing;

  const handleApprove = useCallback(async () => {
    if (!amount) return;
    setLastAction('approve');
    hasTriggeredAutoDeposit.current = false; // Reset flag when starting new approve
    approve(amount);
  }, [amount, approve]);

  const handleDeposit = useCallback(async () => {
    if (!amount || !address) return;
    setLastAction('deposit');
    deposit(amount, address);
  }, [amount, address, deposit]);

  const triggerAutoDeposit = useCallback(() => {
    if (!hasTriggeredAutoDeposit.current && amount && address) {
      hasTriggeredAutoDeposit.current = true;
      setTimeout(() => {
        setLastAction('deposit');
        deposit(amount, address);
      }, 1500);
    }
  }, [amount, address, deposit]);

  // Auto-deposit after approve is confirmed
  useEffect(() => {
    if (isApproveConfirmed) {
      triggerAutoDeposit();
    }
  }, [isApproveConfirmed, triggerAutoDeposit]);

  // Clear form and reset action on successful deposit
  useEffect(() => {
    if (isDepositConfirmed) {
      // Use setTimeout to avoid direct setState in effect
      const timer = setTimeout(() => {
        setHasDeposited(true); // Mark that user has successfully deposited
      }, 100);
      
      // Manually refresh balances after successful deposit with staggered timing
      setTimeout(() => {
        refetchUsdcBalance();
        refetchVaultShares();
        refetchUsdcAllowance();
      }, 500); // Wait 500ms for blockchain state to update
      
      // Additional refetch after 2 seconds to ensure consistency
      setTimeout(() => {
        refetchUsdcBalance();
        refetchVaultShares();
        refetchUsdcAllowance();
      }, 2500);
      
      setTimeout(() => {
        setAmount('');
        setLastAction(null);
        hasTriggeredAutoDeposit.current = false; // Reset flag for next transaction
      }, 2000); // Keep success message visible for 2 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isDepositConfirmed, refetchUsdcBalance, refetchVaultShares, refetchUsdcAllowance]);

  // Check if user has vault shares (indicating previous deposits)
  const userHasShares = parseFloat(vaultShares) > 0;
  const canSimulateYield = hasDeposited || userHasShares;

  const handleSimulateYield = useCallback(() => {
    // Simulate 10% yield on the deposited amount or current vault value
    console.log('🎯 Simulate Yield clicked, amount:', amount, 'vaultShares:', vaultShares);
    
    let baseAmount = amount;
    // If no amount entered, use current vault shares value as base
    if (!amount && userHasShares) {
      baseAmount = (parseFloat(vaultShares) * parseFloat(sharePrice)).toString();
      console.log('🎯 Using vault value as base:', baseAmount, 'USDC');
    }
    
    if (baseAmount) {
      const yieldValue = parseFloat(baseAmount) * 0.1;
      // Use actual 10% calculation, avoid minimum override
      const calculatedYield = yieldValue.toFixed(6); // 6 decimals for USDC, avoid scientific notation
      setYieldAmount(calculatedYield); // Store yield amount for popup display
      console.log('🎯 Yield amount to simulate:', calculatedYield, 'USDC');
      simulateYield(calculatedYield);
    } else {
      console.log('❌ No amount to simulate yield for');
    }
  }, [amount, vaultShares, sharePrice, userHasShares, simulateYield]);

  // Show success popup when yield simulation is confirmed
  useEffect(() => {
    if (isYieldConfirmed && isYieldPending === false && isYieldConfirming === false) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowYieldSuccess(true);
      console.log('✅ Simulate yield transaction confirmed');
    }
  }, [isYieldConfirmed, isYieldPending, isYieldConfirming]);

  // Log errors for debugging
  useEffect(() => {
    if (yieldError) {
      console.error('❌ Simulate yield failed:', yieldError);
    }
  }, [yieldError]);

  // Debug user balance and shares
  console.log('📊 DepositSection Debug:', {
    userVaultShares: vaultShares,
    userUsdcBalance: usdcBalance,
    sharePrice,
    hasDeposited,
    userHasShares,
    canSimulateYield
  });


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
          <div className="text-sm">Please connect your wallet to deposit USDC</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-2">DEPOSIT USDC</h3>
        <p className="text-sm text-gray-600 mb-4">
          Deposit USDC to receive vault shares. Your funds will be invested to generate yield for public goods.
        </p>
      </div>

      {/* Error Display */}
      {(approveError || depositError || yieldError || error) && (
        <div className="bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
          Error: {approveError?.message || depositError?.message || yieldError?.message || error?.message || 'Transaction failed'}
        </div>
      )}

      {/* Success Display */}
      {(isApproveConfirmed || isDepositConfirmed) && (
        <div className="bg-green-50 border border-green-200 p-3 text-green-700 text-sm">
          {isApproveConfirmed && !isDepositConfirmed && '✅ Approval confirmed! Automatically proceeding with deposit...'}
          {isDepositConfirmed && '✅ Transaction confirmed! Your deposit was successful.'}
        </div>
      )}

      {/* Demo: Simulate Yield Button (appears if user has deposited before) */}
      {canSimulateYield && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-blue-800 mb-1">🎯 DEMO: Simulate Yield Generation</h4>
              <p className="text-xs text-blue-700">
                {userHasShares 
                  ? `Generate 10% yield on your ${(parseFloat(vaultShares) * parseFloat(sharePrice)).toFixed(2)} USDC vault position`
                  : 'Click below to instantly generate 10% yield for testing harvest functionality'
                }
              </p>
            </div>
            <button
              onClick={handleSimulateYield}
              disabled={isYieldPending || isYieldConfirming}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:bg-gray-300 cursor-pointer"
            >
              {isYieldPending || isYieldConfirming ? 'GENERATING...' : 'SIMULATE YIELD'}
            </button>
          </div>
          {(isPending || isConfirming) && (
            <div className="mt-2 text-xs text-blue-600">
              ⏳ Generating yield simulation...
            </div>
          )}
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
            disabled={isAnyProcessing}
          />
          <button
            onClick={() => setAmount(usdcBalance)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs border border-gray-400 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
            disabled={isAnyProcessing}
          >
            MAX
          </button>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Wallet Balance: {parseFloat(usdcBalance).toLocaleString()} USDC</span>
          <span>Allowance: {parseFloat(usdcAllowance).toLocaleString()} USDC</span>
        </div>
      </div>

      {/* Preview */}
      {amount && parseFloat(amount) > 0 && (
        <div className="bg-gray-50 border border-gray-300 p-4">
          <h4 className="text-sm font-bold mb-2">TRANSACTION PREVIEW</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>You deposit:</span>
              <span className="font-mono">{amount} USDC</span>
            </div>
            <div className="flex justify-between">
              <span>You receive:</span>
              <span className="font-mono">~{(parseFloat(amount) / parseFloat(sharePrice)).toFixed(2)} YDS shares</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Share price:</span>
              <span className="font-mono">{sharePrice} USDC</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {needsApproval && (
          <button
            onClick={handleApprove}
            disabled={!amount || parseFloat(amount) <= 0 || isAnyProcessing}
            className="w-full py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
{isApproveProcessing ? 'APPROVING...' : isDepositProcessing ? 'DEPOSITING...' : 'APPROVE & DEPOSIT'}
          </button>
        )}
        
{!needsApproval && (
          <button
            onClick={handleDeposit}
            disabled={!amount || parseFloat(amount) <= 0 || isAnyProcessing || parseFloat(amount) > parseFloat(usdcBalance)}
            className="w-full py-3 bg-black text-white font-bold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isDepositProcessing ? 'DEPOSITING...' : 'DEPOSIT'}
          </button>
        )}
      </div>

      {/* Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Your USDC will be invested in Aave to generate yield</p>
        <p>• Your principal is protected - only yield profits are donated</p>
        <p>• You can withdraw your principal at any time</p>
      </div>

      {/* Yield Success Popup */}
      {showYieldSuccess && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white border-2 border-black p-8 max-w-md mx-4 shadow-2xl transform transition-all duration-300 ease-out">
            <div className="text-center">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold mb-2">YIELD GENERATED!</h3>
              <p className="text-lg mb-4">
                Successfully simulated <span className="font-mono font-bold text-green-600">{yieldAmount ? parseFloat(yieldAmount).toFixed(2) : '0'} USDC</span> yield!
              </p>
              <div className="bg-green-50 border border-green-200 p-4 mb-4">
                <p className="text-sm text-green-700">
                  💰 <strong>Available Profit:</strong> +{yieldAmount ? parseFloat(yieldAmount).toFixed(2) : '0'} USDC<br />
                  🎯 <strong>Ready for Harvest:</strong> Switch to HARVEST tab<br />
                  🌱 <strong>Demo Purpose:</strong> Instant yield generation
                </p>
              </div>
              <button
                onClick={() => {
                  setShowYieldSuccess(false);
                  setYieldAmount(''); // Reset yield amount when manually closed
                }}
                className="px-6 py-2 bg-black text-white font-bold hover:bg-gray-800 cursor-pointer"
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