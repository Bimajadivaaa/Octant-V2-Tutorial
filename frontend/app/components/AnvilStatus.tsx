'use client';

import { useAnvilStatus } from '../hooks/useAnvilStatus';

export default function AnvilStatus() {
  const { isAnvilRunning, isChecking } = useAnvilStatus();

  if (isChecking) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-2">
        <div className="bg-blue-50 border border-blue-200 p-3 text-center">
          <div className="text-sm text-blue-600">
            🔍 Checking local blockchain status...
          </div>
        </div>
      </div>
    );
  }

  if (isAnvilRunning === false) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-2">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex items-start">
            <div className="text-red-400 mr-3">🚫</div>
            <div>
              <h3 className="text-sm font-bold text-red-800">Local Blockchain Not Running</h3>
              <div className="text-sm text-red-700 mt-1">
                Please start Anvil local blockchain to use this demo:
              </div>
              <div className="mt-2 p-2 bg-gray-800 text-green-400 font-mono text-xs rounded">
                anvil --host 0.0.0.0 --chain-id 31337
              </div>
              <div className="text-xs text-red-600 mt-2">
                Make sure Anvil is running on http://127.0.0.1:8545
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isAnvilRunning === true) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-2">
        <div className="bg-green-50 border border-green-200 p-3 text-center">
          <div className="text-sm text-green-600">
            ✅ Local blockchain connected • Chain ID: 31337 • RPC: http://127.0.0.1:8545
          </div>
        </div>
      </div>
    );
  }

  return null;
}