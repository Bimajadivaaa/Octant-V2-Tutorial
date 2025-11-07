'use client';

import { useState } from 'react';
import DepositSection from './components/DepositSection';
import WithdrawSection from './components/WithdrawSection';
import HarvestSection from './components/HarvestSection';
import MintUSDC from './components/MintUSDC';
import VaultStats from './components/VaultStats';
import DonationStats from './components/DonationStats';
import WalletConnect from './components/WalletConnect';
import NetworkChecker from './components/NetworkChecker';
import AnvilStatus from './components/AnvilStatus';

export default function Home() {
  const [activeTab, setActiveTab] = useState('mint');

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-black">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">OCTANT V2</h1>
            <p className="text-sm mt-1 text-gray-600">
              Yield-Driven Staking for Public Goods Funding
            </p>
          </div>
          <WalletConnect />
        </div>
      </header>

      {/* Anvil Status */}
      <AnvilStatus />

      {/* Network Check Warning */}
      <NetworkChecker />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <VaultStats />
          <DonationStats />
        </div>

        {/* Action Tabs */}
        <div className="bg-white border border-black rounded-none">
          {/* Tab Navigation */}
          <div className="border-b border-black">
            <nav className="flex">
              {[
                { id: 'mint', label: 'MINT USDC' },
                { id: 'deposit', label: 'DEPOSIT' },
                { id: 'withdraw', label: 'WITHDRAW' },
                { id: 'harvest', label: 'HARVEST' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-r border-black last:border-r-0 transition-colors cursor-pointer
                    ${activeTab === tab.id 
                      ? 'bg-black text-white' 
                      : 'bg-white text-black hover:bg-gray-50'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'mint' && <MintUSDC />}
            {activeTab === 'deposit' && <DepositSection />}
            {activeTab === 'withdraw' && <WithdrawSection />}
            {activeTab === 'harvest' && <HarvestSection />}
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-12 border-t border-black pt-8">
          <h2 className="text-xl font-bold mb-6">HOW OCTANT V2 WORKS</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="border border-black p-6">
              <div className="text-2xl font-bold mb-2">01</div>
              <h3 className="font-bold mb-2">MINT USDC</h3>
              <p className="text-sm text-gray-600">
                First, mint test USDC tokens to your wallet. This simulates having USDC for demo purposes.
              </p>
            </div>

            <div className="border border-black p-6">
              <div className="text-2xl font-bold mb-2">02</div>
              <h3 className="font-bold mb-2">DEPOSIT</h3>
              <p className="text-sm text-gray-600">
                Deposit USDC and receive vault shares. Your funds are invested in Aave to generate yield.
              </p>
            </div>
            
            <div className="border border-black p-6">
              <div className="text-2xl font-bold mb-2">03</div>
              <h3 className="font-bold mb-2">YIELD GENERATION</h3>
              <p className="text-sm text-gray-600">
                Your deposited funds earn yield through DeFi protocols. Your principal remains protected.
              </p>
            </div>
            
            <div className="border border-black p-6">
              <div className="text-2xl font-bold mb-2">04</div>
              <h3 className="font-bold mb-2">HARVEST & DONATE</h3>
              <p className="text-sm text-gray-600">
                Generated yield is automatically donated to public goods. You keep your principal.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black mt-16">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <p className="text-xs text-gray-500">
            Octant V2 Tutorial • Built for Hackathon Demo • Local Blockchain
          </p>
        </div>
      </footer>
    </div>
  );
}
