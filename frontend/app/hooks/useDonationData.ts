'use client';

import { useReadContract, useBlockNumber } from 'wagmi';
import { CONTRACTS } from '../lib/wagmi';
import { YDS_VAULT_ABI, ERC20_ABI } from '../lib/abis';
import { formatUnits } from 'viem';
import { useMemo } from 'react';

export function useDonationData() {
  // Get current vault data untuk calculate potential profit
  const { data: totalAssets } = useReadContract({
    address: CONTRACTS.YDS_VAULT,
    abi: YDS_VAULT_ABI,
    functionName: 'totalAssets',
  });

  const { data: lastRecordedAssets } = useReadContract({
    address: CONTRACTS.YDS_VAULT,
    abi: YDS_VAULT_ABI,
    functionName: 'lastRecordedAssets',
  });

  // Get recipient balances (simple way to estimate total donated)
  const { data: recipient1Balance } = useReadContract({
    address: CONTRACTS.USDC_MOCK,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8'], // recipient 1 from DonationRouter
  });

  const { data: recipient2Balance } = useReadContract({
    address: CONTRACTS.USDC_MOCK,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: ['0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'], // recipient 2 from DonationRouter
  });

  // Calculate donation metrics
  const donationMetrics = useMemo(() => {
    const currentAssets = totalAssets ? parseFloat(formatUnits(totalAssets, 6)) : 0;
    const watermark = lastRecordedAssets ? parseFloat(formatUnits(lastRecordedAssets, 6)) : 0;
    const currentProfit = Math.max(0, currentAssets - watermark);
    
    const rec1Balance = recipient1Balance ? parseFloat(formatUnits(recipient1Balance, 6)) : 0;
    const rec2Balance = recipient2Balance ? parseFloat(formatUnits(recipient2Balance, 6)) : 0;
    const totalDonated = rec1Balance + rec2Balance;

    return {
      totalDonated: totalDonated.toFixed(2),
      currentProfit: currentProfit.toFixed(2),
      lastHarvest: '0.00', // Akan diupdate dari events nanti
      recipients: [
        { 
          name: 'Public Goods #1', 
          allocation: '70%', 
          received: rec1Balance.toFixed(2),
          address: '0x7099...79C8'
        },
        { 
          name: 'Public Goods #2', 
          allocation: '30%', 
          received: rec2Balance.toFixed(2),
          address: '0x3C44...93BC'
        }
      ]
    };
  }, [totalAssets, lastRecordedAssets, recipient1Balance, recipient2Balance]);

  return donationMetrics;
}