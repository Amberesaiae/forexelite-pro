'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';

type Step = 'brokers' | 'preferences';

interface BrokerFormData {
  brokerType: 'OANDA' | 'MT5_AGENT' | 'METAAPI';
  name: string;
  apiKey: string;
  accountId: string;
  environment: 'practice' | 'live';
  pairingCode?: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<Step>('brokers');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [brokers, setBrokers] = useState<BrokerFormData[]>([]);
  const [currentBroker, setCurrentBroker] = useState<BrokerFormData>({
    brokerType: 'OANDA',
    name: '',
    apiKey: '',
    accountId: '',
    environment: 'practice',
  });
  const [preferences, setPreferences] = useState({
    riskPercent: 1.0,
    accountCurrency: 'USD',
    preferredPairs: [] as string[],
    disclaimerAccepted: false,
  });

  const instruments = [
    'EUR_USD', 'GBP_USD', 'USD_JPY', 'AUD_USD', 'USD_CAD', 'NZD_USD',
    'XAU_USD', 'XAG_USD', 'US30_USD', 'NAS100_USD', 'SPX500_USD'
  ];

  const addBroker = () => {
    if (!currentBroker.name || !currentBroker.apiKey || !currentBroker.accountId) {
      setError('Please fill in all required fields');
      return;
    }
    setBrokers([...brokers, { ...currentBroker }]);
    setCurrentBroker({
      brokerType: 'OANDA',
      name: '',
      apiKey: '',
      accountId: '',
      environment: 'practice',
    });
  };

  const removeBroker = (index: number) => {
    setBrokers(brokers.filter((_, i) => i !== index));
  };

  const validateAndSaveBrokers = async () => {
    if (brokers.length === 0) {
      setError('Please add at least one broker connection');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Save each broker
      for (const broker of brokers) {
        const { error: brokerError } = await supabase
          .from('broker_connections')
          .insert({
            user_id: user.id,
            broker_type: broker.brokerType,
            name: broker.name,
            credentials: {
              api_key: broker.apiKey,
              account_id: broker.accountId,
              environment: broker.environment,
            },
            is_active: true,
          });

        if (brokerError) {
          throw new Error(`Failed to save ${broker.name}: ${brokerError.message}`);
        }
      }

      setStep('preferences');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences.disclaimerAccepted) {
      setError('You must accept the trading disclaimer to continue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const riskToleranceMap: Record<string, string> = {
        '1': 'conservative',
        '2': 'moderate',
        '3': 'aggressive',
      };
      const riskLevel = preferences.riskPercent <= 1 ? 'conservative' : preferences.riskPercent <= 3 ? 'moderate' : 'aggressive';

      const { error: prefsError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          risk_tolerance: riskLevel,
          onboarding_complete: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (prefsError) {
        throw new Error(`Failed to save preferences: ${prefsError.message}`);
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">
              {step === 'brokers' ? 'Connect Your Brokers' : 'Risk Preferences'}
            </h1>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${step === 'brokers' ? 'bg-[#f5a623]' : 'bg-[#22c55e]'}`} />
              <div className={`w-3 h-3 rounded-full ${step === 'preferences' ? 'bg-[#f5a623]' : 'bg-[#2a2a4a]'}`} />
            </div>
          </div>
          <p className="text-[#9090a8]">
            Step {step === 'brokers' ? '1' : '2'} of 2: {step === 'brokers' ? 'Connect your trading accounts' : 'Set your risk parameters'}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 'brokers' ? (
            <motion.div
              key="brokers"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Broker form */}
              <div className="rounded-xl border border-[#2a2a4a] bg-[#16162a] p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Add Broker Connection</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#9090a8]">Broker Type</label>
                    <select
                      value={currentBroker.brokerType}
                      onChange={(e) => setCurrentBroker({ ...currentBroker, brokerType: e.target.value as any })}
                      className="w-full rounded-xl border border-[#2a2a4a] bg-[#0f0f1a] px-4 py-3 text-foreground transition-all focus:border-[#f5a623] focus:outline-none"
                    >
                      <option value="OANDA">OANDA</option>
                      <option value="MT5_AGENT">MT5 Agent</option>
                      <option value="METAAPI">MetaApi</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#9090a8]">Connection Name</label>
                    <input
                      type="text"
                      value={currentBroker.name}
                      onChange={(e) => setCurrentBroker({ ...currentBroker, name: e.target.value })}
                      placeholder="My OANDA Account"
                      className="w-full rounded-xl border border-[#2a2a4a] bg-[#0f0f1a] px-4 py-3 text-foreground placeholder-[#9090a8] transition-all focus:border-[#f5a623] focus:outline-none"
                    />
                  </div>
                </div>

                {currentBroker.brokerType === 'OANDA' && (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[#9090a8]">API Key</label>
                        <input
                          type="password"
                          value={currentBroker.apiKey}
                          onChange={(e) => setCurrentBroker({ ...currentBroker, apiKey: e.target.value })}
                          placeholder="Your OANDA API key"
                          className="w-full rounded-xl border border-[#2a2a4a] bg-[#0f0f1a] px-4 py-3 text-foreground placeholder-[#9090a8] transition-all focus:border-[#f5a623] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[#9090a8]">Account ID</label>
                        <input
                          type="text"
                          value={currentBroker.accountId}
                          onChange={(e) => setCurrentBroker({ ...currentBroker, accountId: e.target.value })}
                          placeholder="Your OANDA account ID"
                          className="w-full rounded-xl border border-[#2a2a4a] bg-[#0f0f1a] px-4 py-3 text-foreground placeholder-[#9090a8] transition-all focus:border-[#f5a623] focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-medium text-[#9090a8]">Environment</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="environment"
                            checked={currentBroker.environment === 'practice'}
                            onChange={() => setCurrentBroker({ ...currentBroker, environment: 'practice' })}
                            className="w-4 h-4 text-[#f5a623] focus:ring-[#f5a623]"
                          />
                          <span className="text-foreground">Practice</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="environment"
                            checked={currentBroker.environment === 'live'}
                            onChange={() => setCurrentBroker({ ...currentBroker, environment: 'live' })}
                            className="w-4 h-4 text-[#f5a623] focus:ring-[#f5a623]"
                          />
                          <span className="text-foreground">Live</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {currentBroker.brokerType === 'MT5_AGENT' && (
                  <div className="rounded-lg bg-[#1e1e3f] p-4 mb-4">
                    <p className="text-sm text-[#9090a8]">
                      Download the MT5 Agent from your dashboard and run it on your VPS. 
                      Enter the pairing code displayed in the agent interface below.
                    </p>
                  </div>
                )}

                {currentBroker.brokerType === 'METAAPI' && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#9090a8]">MetaApi Token</label>
                      <input
                        type="password"
                        value={currentBroker.apiKey}
                        onChange={(e) => setCurrentBroker({ ...currentBroker, apiKey: e.target.value })}
                        placeholder="Your MetaApi token"
                        className="w-full rounded-xl border border-[#2a2a4a] bg-[#0f0f1a] px-4 py-3 text-foreground placeholder-[#9090a8] transition-all focus:border-[#f5a623] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#9090a8]">Account ID</label>
                      <input
                        type="text"
                        value={currentBroker.accountId}
                        onChange={(e) => setCurrentBroker({ ...currentBroker, accountId: e.target.value })}
                        placeholder="Your MetaApi account ID"
                        className="w-full rounded-xl border border-[#2a2a4a] bg-[#0f0f1a] px-4 py-3 text-foreground placeholder-[#9090a8] transition-all focus:border-[#f5a623] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={addBroker}
                  className="rounded-xl border border-[#2a2a4a] bg-[#1e1e3f] px-4 py-2 text-sm font-medium text-foreground hover:bg-[#2a2a4a] transition-all"
                >
                  + Add Broker
                </button>
              </div>

              {/* Added brokers list */}
              {brokers.length > 0 && (
                <div className="rounded-xl border border-[#2a2a4a] bg-[#16162a] p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Connected Brokers</h2>
                  <div className="space-y-3">
                    {brokers.map((broker, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg bg-[#1e1e3f] p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#f5a623]/20 flex items-center justify-center">
                            <span className="text-[#f5a623] font-bold text-sm">{broker.brokerType.slice(0, 2)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{broker.name}</p>
                            <p className="text-sm text-[#9090a8]">{broker.brokerType} • {broker.environment}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeBroker(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={validateAndSaveBrokers}
                  disabled={loading || brokers.length === 0}
                  className="rounded-xl bg-gradient-to-r from-[#f5a623] to-[#ffd700] px-8 py-3 text-base font-semibold text-[#0f0f1a] transition-all hover:shadow-[0_0_30px_rgba(245,166,35,0.4)] disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Continue →'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Risk preferences */}
              <div className="rounded-xl border border-[#2a2a4a] bg-[#16162a] p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Risk Parameters</h2>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#9090a8]">
                      Risk per Trade: {preferences.riskPercent}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={preferences.riskPercent}
                      onChange={(e) => setPreferences({ ...preferences, riskPercent: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-[#2a2a4a] rounded-lg appearance-none cursor-pointer accent-[#f5a623]"
                    />
                    <div className="flex justify-between text-xs text-[#9090a8] mt-1">
                      <span>0.1%</span>
                      <span>10%</span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#9090a8]">Account Currency</label>
                    <select
                      value={preferences.accountCurrency}
                      onChange={(e) => setPreferences({ ...preferences, accountCurrency: e.target.value })}
                      className="w-full rounded-xl border border-[#2a2a4a] bg-[#0f0f1a] px-4 py-3 text-foreground transition-all focus:border-[#f5a623] focus:outline-none"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-[#9090a8]">Preferred Trading Pairs</label>
                  <div className="flex flex-wrap gap-2">
                    {instruments.map((pair) => (
                      <button
                        key={pair}
                        onClick={() => {
                          const newPairs = preferences.preferredPairs.includes(pair)
                            ? preferences.preferredPairs.filter(p => p !== pair)
                            : [...preferences.preferredPairs, pair];
                          setPreferences({ ...preferences, preferredPairs: newPairs });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          preferences.preferredPairs.includes(pair)
                            ? 'bg-[#f5a623] text-[#0f0f1a]'
                            : 'bg-[#1e1e3f] text-foreground hover:bg-[#2a2a4a]'
                        }`}
                      >
                        {pair.replace('_', '/')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="rounded-xl border border-[#2a2a4a] bg-[#16162a] p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Trading Disclaimer</h2>
                <div className="rounded-lg bg-[#1e1e3f] p-4 mb-4 max-h-48 overflow-y-auto">
                  <p className="text-sm text-[#9090a8] leading-relaxed">
                    Trading forex and CFDs involves significant risk and may result in the loss of your invested capital. 
                    You should not invest more than you can afford to lose and should ensure that you fully understand the risks involved. 
                    Past performance is not indicative of future results. The high leverage involved in forex trading can work against you 
                    as well as for you. Before deciding to trade, please consider your level of experience, investment objectives, 
                    and seek independent financial advice if necessary.
                  </p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.disclaimerAccepted}
                    onChange={(e) => setPreferences({ ...preferences, disclaimerAccepted: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-[#2a2a4a] bg-[#0f0f1a] text-[#f5a623] focus:ring-[#f5a623]"
                  />
                  <span className="text-sm text-[#9090a8]">
                    I have read and accept the trading disclaimer. I understand that trading involves significant risk.
                  </span>
                </label>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep('brokers')}
                  className="rounded-xl border border-[#2a2a4a] bg-[#1e1e3f] px-6 py-3 text-base font-medium text-foreground hover:bg-[#2a2a4a] transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={savePreferences}
                  disabled={loading || !preferences.disclaimerAccepted}
                  className="rounded-xl bg-gradient-to-r from-[#f5a623] to-[#ffd700] px-8 py-3 text-base font-semibold text-[#0f0f1a] transition-all hover:shadow-[0_0_30px_rgba(245,166,35,0.4)] disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Start Trading →'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}