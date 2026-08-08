'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { getAccountEmailForVerify, parseVerifyResponse } from '../lib/paymentApi';

interface DepositComponentProps {
  gameType: string;
  vipamount?: number;
}

interface PaystackResponse {
  reference: string;
  message: string;
  status: string;
  trans: string;
  transaction: string;
  trxref: string;
}

interface PaystackConfig {
  key: string;
  email: string;
  amount: number;
  currency: string;
  channels: string[];
  metadata: {
    package: string;
    customer_name: string;
    custom_fields: Record<string, unknown>[];
  };
  callback: (response: PaystackResponse) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: PaystackConfig) => {
        openIframe: () => void;
      };
    };
  }
}

function DepositComponent({ gameType, vipamount}: DepositComponentProps) {
  const email = localStorage.getItem('email') || 'test@example.com';
  const router = useRouter();
  const [countryCode, setCountryCode] = useState<string | undefined>();
  const [userEmail] = useState<string>(email);
  const [purchaseGameType] = useState<string>(gameType);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [showAccruePayment, setShowAccruePayment] = useState<boolean>(false);
  const [showCashrampPayment, setShowCashrampPayment] = useState<boolean>(false);
  const [displayAmount, setDisplayAmount] = useState<number | undefined>(vipamount);
  const [displayCurrency, setDisplayCurrency] = useState<string>('USD');

  const publicKey = "pk_live_86fde08e9c8e0c05ac59a162c13a370897a0828b";

  const handleBuyNow = () => {
    setShowLocationModal(true);
  };

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleLocationSelect = (location: string) => {
    setShowLocationModal(false);
    if (location === 'ghana') {
      // Initialize Paystack payment
      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: userEmail,
        amount: Math.round(vipamount * 100),
        currency: 'GHS',
        channels: ['card', 'mobile_money', 'bank_transfer'],
        metadata: {
          package: gameType,
          customer_name: 'Test User',
          custom_fields: []
        },
        callback: (response: PaystackResponse) => {
          const verifyEmail = getAccountEmailForVerify() || userEmail;

          fetch(`https://a1-tips-backend-main.onrender.com/payment/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              reference: response.reference,
              email: verifyEmail,
              booking_id: gameType
            })
          })
          .then(parseVerifyResponse)
          .then(() => {
            window.location.href = '/dashboard';
          })
          .catch(error => {
            console.error('Error verifying payment:', error);
            const message = error instanceof Error ? error.message : 'Payment verification failed.';
            alert(`${message} Please contact support if you were charged. Ref: ${response.reference}`);
          });
        },
        onClose: () => {
          setShowLocationModal(false);
        }
      });
      
      handler.openIframe();
    } else {
      // For non-Ghana users, go directly to Cashramp
      setCountryCode('');
      setShowCashrampPayment(true);
    }
  };


  const getCurrencyInfo = (countryCode: string) => {
    const currencyMap: { [key: string]: { symbol: string; code: string; rate: number } } = {
      'NG': { symbol: '₦', code: 'NGN', rate: 135.85 }, // 1 GHS = 135.85 NGN
      'US': { symbol: '$', code: 'USD', rate: 0.093 }, // 1 GHS = 0.093 USD
      'UK': { symbol: '£', code: 'GBP', rate: 0.051 }, // 1 GHS = 0.051 GBP
      'CA': { symbol: 'C$', code: 'CAD', rate: 0.089 }, // 1 GHS = 0.089 CAD
      'GH': { symbol: '₵', code: 'GHS', rate: 1.0 }, // 1 GHS = 1.0 GHS
      'KE': { symbol: 'KSh', code: 'KES', rate: 8.5 }, // 1 GHS = 8.5 KES
      'ZA': { symbol: 'R', code: 'ZAR', rate: 1.2 }, // 1 GHS = 1.2 ZAR
      'EG': { symbol: 'E£', code: 'EGP', rate: 2.0 }, // 1 GHS = 2.0 EGP
      'MA': { symbol: 'MAD', code: 'MAD', rate: 0.65 }, // 1 GHS = 0.65 MAD
      'TZ': { symbol: 'TSh', code: 'TZS', rate: 160.0 }, // 1 GHS = 160.0 TZS
    };
    return currencyMap[countryCode] || { symbol: '$', code: 'USD', rate: 0.065 };
  };

  const handleCountryCodeChange = (newCountryCode: string) => {
    // User chooses country; conversion is handled in useEffect so it updates when vipamount changes too
    setCountryCode(newCountryCode);
  };

  // Recalculate converted amount and currency symbol whenever country or vipamount changes
  useEffect(() => {
    if (!countryCode || countryCode.length !== 2) {
      // No valid country selected -> reset display amount to undefined and keep USD symbol for default
      setDisplayAmount(undefined);
      setDisplayCurrency('USD');
      return;
    }

    const currencyInfo = getCurrencyInfo(countryCode);
    setDisplayCurrency(currencyInfo.symbol);

    // vipamount is in GHS. Convert using rate from map. Keep two decimals.
    if (typeof vipamount === 'number') {
      const converted = Number((vipamount * currencyInfo.rate).toFixed(2));
      setDisplayAmount(converted);
    } else {
      setDisplayAmount(undefined);
    }
  }, [countryCode, vipamount]);

  // NOTE: Customer details should come from your application's user session

  const initiateDeposit = async () => {
    setLoading(true);
    setError(null);

    const depositData = {
      vipamount: vipamount,
      countryCode: countryCode,
      email: userEmail,
      gameType: purchaseGameType,
      firstName: 'Test',
      lastName: 'Win'
    };

    try {
      // 1. Call the FastAPI endpoint
      const response = await fetch('https://a1-tips-backend-main.onrender.com/payments/api/v1/create-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(depositData),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.detail || 'Failed to create deposit link.');
      }

      const data = await response.json();
      const { hostedLink } = data;

      // 2. Redirect the user to the Cashramp Hosted Ramp
      if (hostedLink) {
        // Use window.location.replace() to prevent the user from returning 
        // to this page with the back button after payment.
        window.location.replace(hostedLink);
      } else {
        throw new Error('No hosted link received from the server.');
      }

    } catch (err) {
      console.error('Deposit initiation failed:', err);
      setError(err.message);
    } finally {
      // If the redirect is successful, this line is not reached, 
      // but it's important for error cases.
      setLoading(false); 
    }
  };


  const initiateAccruePayment = async () => {
    setLoading(true);
    setError(null);

    const accrueData = {
      vipamount: vipamount,
      email: userEmail,
      gameType: purchaseGameType,
      currency: 'USD', // Default currency for Accrue
    };

    try {
      // Call Accrue API endpoint
      const response = await fetch('http://localhost:8000/api/v1/create-accrue-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accrueData),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.detail || 'Failed to create Accrue payment link.');
      }

      const data = await response.json();
      const { paymentUrl } = data;

      // Redirect to Accrue payment page
      if (paymentUrl) {
        window.location.replace(paymentUrl);
      } else {
        throw new Error('No payment URL received from Accrue.');
      }

    } catch (err) {
      console.error('Accrue payment initiation failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePayment = () => {
    setShowAccruePayment(false);
    setShowCashrampPayment(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClosePayment();
    }
  };
 
  return (
    <div className="relative">
      {/* Buy Now Button */}
      <button
        onClick={handleBuyNow}
        className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-bold text-lg transition-colors"
      >
        Buy Now GHS {vipamount} 
      </button>

      {/* Location Selection Modal */}
      {showLocationModal && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 sm:relative sm:top-auto sm:left-auto sm:right-auto sm:mt-0">
          <div className="bg-gray-200 border-2 border-green-500 rounded-lg p-4 sm:p-6 relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-green-600 font-bold text-lg">SELECT LOCATION</h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-black hover:text-gray-600 transition-colors"
                aria-label="Close location selection modal"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Location Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => handleLocationSelect('ghana')}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-bold text-lg transition-colors"
              >
                IN GHANA
              </button>
              {/*<button
                onClick={() => handleLocationSelect('other')}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-bold text-lg transition-colors"
              >
                NOT IN GHANA
              </button> Location Buttons */}
            </div>
          </div>
        </div>
      )}


      {/* Cashramp Payment Form - Other Countries */}
      {showCashrampPayment && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleOverlayClick}
        >
          <div className="bg-white rounded-lg p-4 w-full max-w-sm mx-4 relative">
            {/* Close Button */}
              <button
              onClick={handleClosePayment}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close payment form"
            >
              <FaTimes className="w-4 h-4" />
              </button>

            <h3 className="text-green-600 font-bold text-base mb-3">💳 Cashramp Payment</h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{userEmail}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">{countryCode && countryCode.length === 2 ? `${displayCurrency}${displayAmount || vipamount}` : `₵${vipamount} GHS`}</span>
              </div>

              {countryCode && countryCode.length === 2 && displayAmount && (
                <div className="bg-green-50 p-2 rounded text-xs text-green-800">💱 Converted: {vipamount} GHS = {displayCurrency}{displayAmount} {getCurrencyInfo(countryCode).code}
                </div>
              )}

              <div>
                <label htmlFor="countrySelect" className="block text-xs font-medium text-gray-700 mb-1">
                  Select Country:
                </label>
                <select
                  id="countrySelect"
                  aria-label="Select Country"
                  value={countryCode}
                  onChange={(e) => handleCountryCodeChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Choose your country</option>
                  <option value="NG">🇳🇬 Nigeria</option>
                  <option value="US">🇺🇸 United States</option>
                  <option value="UK">🇬🇧 United Kingdom</option>
                  <option value="CA">🇨🇦 Canada</option>
                  <option value="KE">🇰🇪 Kenya</option>
                  <option value="ZA">🇿🇦 South Africa</option>
                  <option value="EG">🇪🇬 Egypt</option>
                  <option value="MA">🇲🇦 Morocco</option>
                  <option value="TZ">🇹🇿 Tanzania</option>
                  <option value="GH">🇬🇭 Ghana</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Select your country from the dropdown</p>
              </div>

              <button
                onClick={initiateDeposit} 
                disabled={loading || !vipamount || !countryCode || countryCode.length !== 2}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium text-sm transition-colors"
              >
                {loading ? 'Processing...' : countryCode && countryCode.length === 2 ? `Pay ${displayCurrency}${displayAmount || vipamount}` : 'Enter Country Code'}
              </button>

              {error && <p className="text-red-500 text-xs">Error: {error}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Accrue Payment Form - Other Countries */}
      {showAccruePayment && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleOverlayClick}
        >
          <div className="bg-white rounded-lg p-4 w-full max-w-sm mx-4 relative">
            {/* Close Button */}
            <button
              onClick={handleClosePayment}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close payment form"
            >
              <FaTimes className="w-4 h-4" />
            </button>

            <h3 className="text-blue-600 font-bold text-base mb-3">💳 Accrue Payment</h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{userEmail}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">{displayCurrency}{vipamount}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Game:</span>
                <span className="font-medium">{purchaseGameType}</span>
              </div>

              <div className="bg-blue-50 p-2 rounded text-xs text-blue-800">
                💡 Supports credit cards, bank transfers, and digital wallets
              </div>

              <button 
                onClick={initiateAccruePayment} 
                disabled={loading || !vipamount}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium text-sm transition-colors">
                {loading ? 'Processing...' : 'Pay with Accrue'}
              </button>

              {error && <p className="text-red-500 text-xs">Error: {error}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepositComponent;
