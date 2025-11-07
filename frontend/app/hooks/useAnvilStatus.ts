'use client';

import { useEffect, useState } from 'react';

export function useAnvilStatus() {
  const [isAnvilRunning, setIsAnvilRunning] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAnvil = async () => {
      try {
        setIsChecking(true);
        const response = await fetch('http://127.0.0.1:8545', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_chainId',
            params: [],
            id: 1,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Check if it's Anvil (chain ID 31337 = 0x7a69)
          setIsAnvilRunning(data.result === '0x7a69');
        } else {
          setIsAnvilRunning(false);
        }
      } catch (error) {
        console.log('Anvil not running:', error);
        setIsAnvilRunning(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAnvil();
    
    // Check every 10 seconds
    const interval = setInterval(checkAnvil, 10000);
    return () => clearInterval(interval);
  }, []);

  return { isAnvilRunning, isChecking };
}