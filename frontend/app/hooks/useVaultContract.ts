'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { YDS_VAULT_ABI, ERC20_ABI, MOCK_YIELD_ADAPTER_ABI } from '../lib/abis';
import { CONTRACTS } from '../lib/wagmi';
import { parseUnits, formatUnits } from 'viem';

// Read vault data
export function useVaultData() {
  const { data: totalAssets } = useReadContract({
    address: CONTRACTS.YDS_VAULT,
    abi: YDS_VAULT_ABI,
    functionName: 'totalAssets',
  });

  const { data: totalSupply } = useReadContract({
    address: CONTRACTS.YDS_VAULT,
    abi: YDS_VAULT_ABI,
    functionName: 'totalSupply',
  });

  const { data: lastRecordedAssets } = useReadContract({
    address: CONTRACTS.YDS_VAULT,
    abi: YDS_VAULT_ABI,
    functionName: 'lastRecordedAssets',
  });

  return {
    totalAssets: totalAssets ? formatUnits(totalAssets, 6) : '0', // USDC has 6 decimals
    totalSupply: totalSupply ? formatUnits(totalSupply, 18) : '0', // Vault shares have 18 decimals
    lastRecordedAssets: lastRecordedAssets ? formatUnits(lastRecordedAssets, 6) : '0',
    sharePrice: totalSupply && totalAssets && totalSupply > 0n 
      ? (Number(formatUnits(totalAssets, 6)) / Number(formatUnits(totalSupply, 18))).toFixed(4)
      : '1.0000'
  };
}

// Read user balance
export function useUserBalance(userAddress?: `0x${string}`) {
  const { data: usdcBalance } = useReadContract({
    address: CONTRACTS.USDC_MOCK,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    }
  });

  const { data: vaultShares } = useReadContract({
    address: CONTRACTS.YDS_VAULT,
    abi: YDS_VAULT_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    }
  });

  const { data: usdcAllowance } = useReadContract({
    address: CONTRACTS.USDC_MOCK,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: userAddress ? [userAddress, CONTRACTS.YDS_VAULT] : undefined,
    query: {
      enabled: !!userAddress,
    }
  });

  return {
    usdcBalance: usdcBalance ? formatUnits(usdcBalance, 6) : '0',
    vaultShares: vaultShares ? formatUnits(vaultShares, 18) : '0',
    usdcAllowance: usdcAllowance ? formatUnits(usdcAllowance, 6) : '0',
  };
}

// Contract write operations with separate tracking
export function useVaultOperations() {
  const { 
    writeContract: writeApprove, 
    data: approveHash, 
    isPending: isApprovePending, 
    error: approveError 
  } = useWriteContract();
  
  const { 
    writeContract: writeDeposit, 
    data: depositHash, 
    isPending: isDepositPending, 
    error: depositError 
  } = useWriteContract();
  
  const { 
    writeContract: writeGeneral, 
    data: generalHash, 
    isPending: isGeneralPending, 
    error: generalError 
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
    hash: approveHash,
  });
  
  const { isLoading: isDepositConfirming, isSuccess: isDepositConfirmed } = useWaitForTransactionReceipt({
    hash: depositHash,
  });
  
  const { isLoading: isGeneralConfirming, isSuccess: isGeneralConfirmed } = useWaitForTransactionReceipt({
    hash: generalHash,
  });

  const approve = (amount: string) => {
    writeApprove({
      address: CONTRACTS.USDC_MOCK,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.YDS_VAULT, parseUnits(amount, 6)],
    });
  };

  const deposit = (amount: string, receiver: `0x${string}`) => {
    writeDeposit({
      address: CONTRACTS.YDS_VAULT,
      abi: YDS_VAULT_ABI,
      functionName: 'deposit',
      args: [parseUnits(amount, 6), receiver],
    });
  };

  const withdraw = (amount: string, receiver: `0x${string}`, owner: `0x${string}`) => {
    writeGeneral({
      address: CONTRACTS.YDS_VAULT,
      abi: YDS_VAULT_ABI,
      functionName: 'withdraw',
      args: [parseUnits(amount, 6), receiver, owner],
    });
  };

  const redeem = (shares: string, receiver: `0x${string}`, owner: `0x${string}`) => {
    writeGeneral({
      address: CONTRACTS.YDS_VAULT,
      abi: YDS_VAULT_ABI,
      functionName: 'redeem',
      args: [parseUnits(shares, 18), receiver, owner],
    });
  };

  const harvest = () => {
    writeGeneral({
      address: CONTRACTS.YDS_VAULT,
      abi: YDS_VAULT_ABI,
      functionName: 'harvest',
    });
  };

  const mintUSDC = (amount: string, recipient: `0x${string}`) => {
    writeGeneral({
      address: CONTRACTS.USDC_MOCK,
      abi: ERC20_ABI,
      functionName: 'mint',
      args: [recipient, parseUnits(amount, 6)],
      gas: 100000n,
    });
  };

  const simulateYield = (yieldAmount: string) => {
    writeGeneral({
      address: CONTRACTS.MOCK_YIELD_ADAPTER,
      abi: MOCK_YIELD_ADAPTER_ABI,
      functionName: 'simulateYield',
      args: [parseUnits(yieldAmount, 6)],
      gas: 100000n,
    });
  };

  return {
    approve,
    deposit,
    withdraw,
    redeem,
    harvest,
    mintUSDC,
    simulateYield,
    // Approve-specific states
    isApprovePending,
    isApproveConfirming,
    isApproveConfirmed,
    approveHash,
    approveError,
    // Deposit-specific states
    isDepositPending,
    isDepositConfirming,
    isDepositConfirmed,
    depositHash,
    depositError,
    // General states (for other operations)
    isPending: isGeneralPending,
    isConfirming: isGeneralConfirming,
    isConfirmed: isGeneralConfirmed,
    hash: generalHash,
    error: generalError,
  };
}