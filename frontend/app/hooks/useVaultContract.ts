"use client";

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { YDS_VAULT_ABI, ERC20_ABI, MOCK_YIELD_ADAPTER_ABI } from "../lib/abis";
import { CONTRACTS } from "../lib/wagmi";
import { parseUnits, formatUnits } from "viem";

// Read vault data
export function useVaultData() {
  const { data: totalAssets } = useReadContract({
    address: CONTRACTS.YDS_VAULT,
    abi: YDS_VAULT_ABI,
    functionName: "totalAssets",
    query: {
      refetchInterval: 3000, // Auto-refetch every 3 seconds
    },
  });

  const { data: totalSupply } = useReadContract({
    address: CONTRACTS.YDS_VAULT,
    abi: YDS_VAULT_ABI,
    functionName: "totalSupply",
    query: {
      refetchInterval: 3000, // Auto-refetch every 3 seconds
    },
  });

  const { data: lastRecordedAssets } = useReadContract({
    address: CONTRACTS.YDS_VAULT,
    abi: YDS_VAULT_ABI,
    functionName: "lastRecordedAssets",
    query: {
      refetchInterval: 3000, // Auto-refetch every 3 seconds
    },
  });

  return {
    totalAssets: totalAssets ? formatUnits(totalAssets, 6) : "0", // USDC has 6 decimals
    totalSupply: totalSupply ? formatUnits(totalSupply, 18) : "0", // Vault shares have 18 decimals
    lastRecordedAssets: lastRecordedAssets
      ? formatUnits(lastRecordedAssets, 6)
      : "0",
    sharePrice:
      totalSupply && totalAssets && totalSupply > BigInt(0)
        ? (
            Number(formatUnits(totalAssets, 6)) /
            Number(formatUnits(totalSupply, 18))
          ).toFixed(4)
        : "1.0000",
  };
}

// Read user balance
export function useUserBalance(userAddress?: `0x${string}`) {
  const { data: usdcBalance, refetch: refetchUsdcBalance } = useReadContract({
    address: CONTRACTS.USDC_MOCK,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
      refetchInterval: 3000, // Auto-refetch every 3 seconds
    },
  });

  const { data: vaultShares, refetch: refetchVaultShares } = useReadContract({
    address: CONTRACTS.YDS_VAULT,
    abi: YDS_VAULT_ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
      refetchInterval: 3000, // Auto-refetch every 3 seconds
    },
  });

  const { data: usdcAllowance, refetch: refetchUsdcAllowance } =
    useReadContract({
      address: CONTRACTS.USDC_MOCK,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: userAddress ? [userAddress, CONTRACTS.YDS_VAULT] : undefined,
      query: {
        enabled: !!userAddress,
        refetchInterval: 3000, // Auto-refetch every 3 seconds
      },
    });

  // Debug logging for vault shares
  if (
    userAddress &&
    (vaultShares === undefined ||
      vaultShares === null ||
      vaultShares === BigInt(0))
  ) {
    console.log("🔍 useUserBalance Debug:", {
      userAddress,
      vaultSharesRaw: vaultShares,
      vaultSharesFormatted: vaultShares ? formatUnits(vaultShares, 18) : "0",
      contractAddress: CONTRACTS.YDS_VAULT,
    });
  }

  return {
    usdcBalance: usdcBalance ? formatUnits(usdcBalance, 6) : "0",
    vaultShares: vaultShares ? formatUnits(vaultShares, 18) : "0",
    usdcAllowance: usdcAllowance ? formatUnits(usdcAllowance, 6) : "0",
    // Expose refetch functions for manual refresh
    refetchUsdcBalance,
    refetchVaultShares,
    refetchUsdcAllowance,
  };
}

// Contract write operations with separate tracking
export function useVaultOperations() {
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
    error: approveError,
  } = useWriteContract();

  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositPending,
    error: depositError,
  } = useWriteContract();

  const {
    writeContract: writeGeneral,
    data: generalHash,
    isPending: isGeneralPending,
    error: generalError,
  } = useWriteContract();

  const {
    writeContract: writeYield,
    data: yieldHash,
    isPending: isYieldPending,
    error: yieldError,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    });

  const { isLoading: isDepositConfirming, isSuccess: isDepositConfirmed } =
    useWaitForTransactionReceipt({
      hash: depositHash,
    });

  const { isLoading: isGeneralConfirming, isSuccess: isGeneralConfirmed } =
    useWaitForTransactionReceipt({
      hash: generalHash,
    });

  const { isLoading: isYieldConfirming, isSuccess: isYieldConfirmed } =
    useWaitForTransactionReceipt({
      hash: yieldHash,
    });

  const approve = (amount: string) => {
    writeApprove({
      address: CONTRACTS.USDC_MOCK,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONTRACTS.YDS_VAULT, parseUnits(amount, 6)],
    });
  };

  const deposit = (amount: string, receiver: `0x${string}`) => {
    writeDeposit({
      address: CONTRACTS.YDS_VAULT,
      abi: YDS_VAULT_ABI,
      functionName: "deposit",
      args: [parseUnits(amount, 6), receiver],
    });
  };

  const withdraw = (
    amount: string,
    receiver: `0x${string}`,
    owner: `0x${string}`
  ) => {
    writeGeneral({
      address: CONTRACTS.YDS_VAULT,
      abi: YDS_VAULT_ABI,
      functionName: "withdraw",
      args: [parseUnits(amount, 6), receiver, owner],
    });
  };

  const redeem = (
    shares: string,
    receiver: `0x${string}`,
    owner: `0x${string}`
  ) => {
    writeGeneral({
      address: CONTRACTS.YDS_VAULT,
      abi: YDS_VAULT_ABI,
      functionName: "redeem",
      args: [parseUnits(shares, 18), receiver, owner],
    });
  };

  const harvest = () => {
    writeGeneral({
      address: CONTRACTS.YDS_VAULT,
      abi: YDS_VAULT_ABI,
      functionName: "harvest",
    });
  };

  const mintUSDC = (amount: string, recipient: `0x${string}`) => {
    writeGeneral({
      address: CONTRACTS.USDC_MOCK,
      abi: ERC20_ABI,
      functionName: "mint",
      args: [recipient, parseUnits(amount, 6)],
      gas: BigInt(100000),
    });
  };

  const simulateYield = (yieldAmount: string) => {
    try {
      // Validate and clean the yield amount
      const cleanAmount = parseFloat(yieldAmount).toFixed(6);
      const parsedAmount = parseUnits(cleanAmount, 6);

      console.log("🎯 simulateYield called with:", {
        yieldAmount,
        cleanAmount,
        parsedAmount,
        contractAddress: CONTRACTS.MOCK_YIELD_ADAPTER,
      });

      // Use dedicated writeYield instead of writeGeneral to avoid interface conflicts
      writeYield({
        address: CONTRACTS.MOCK_YIELD_ADAPTER,
        abi: MOCK_YIELD_ADAPTER_ABI,
        functionName: "simulateYield",
        args: [parsedAmount],
        gas: BigInt(150000),
      });
    } catch (error) {
      console.error("❌ simulateYield error:", error);
    }
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
    // Yield-specific states
    isYieldPending,
    isYieldConfirming,
    isYieldConfirmed,
    yieldHash,
    yieldError,
    // General states (for other operations like harvest, withdraw)
    isPending: isGeneralPending,
    isConfirming: isGeneralConfirming,
    isConfirmed: isGeneralConfirmed,
    hash: generalHash,
    error: generalError,
  };
}
