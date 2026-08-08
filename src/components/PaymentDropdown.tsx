'use client';

import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { getAccountEmailForVerify, parseVerifyResponse } from '../lib/paymentApi';

interface PaymentDropdownProps {
  packageName: string;
  price: string;
  priceInGHS: number;
  priceInUSD: number;
  onPaymentSuccess: (reference: string) => void;
  onPaymentClose: () => void;
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

export default function PaymentDropdown({
  packageName,
  price,
  priceInGHS,
  priceInUSD,
  onPaymentSuccess,
  onPaymentClose
}: PaymentDropdownProps) {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const router = useRouter();


  const publicKey = "pk_live_86fde08e9c8e0c05ac59a162c13a370897a0828b";

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



  const onClose = () => {
    onPaymentClose();
    setShowLocationModal(false);
  };

  const handleBuyNow = () => {
    setShowLocationModal(true);
  };

  const handleLocationSelect = (country: 'ghana' | 'other') => {
    const getEmail = localStorage.getItem('email') || 'test@example.com';
    setShowLocationModal(false);
    
    // Initialize Paystack payment
    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: getEmail,
      amount: country === 'ghana' ? Math.round(priceInGHS * 100) : Math.round(priceInUSD * 100),
      currency: country === 'ghana' ? 'GHS' : 'USD',
      channels: country === 'ghana' 
        ? ['card', 'mobile_money', 'bank_transfer'] 
        : ['card'],
      metadata: {
        package: packageName,
        customer_name: 'Test User',
        custom_fields: []
      },
      callback: (response: PaystackResponse) => {
        const verifyEmail = getAccountEmailForVerify() || getEmail;

        fetch(`https://a1-tips-backend-main.onrender.com/payment/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reference: response.reference,
            email: verifyEmail,
            booking_id: packageName
          })
        })
        .then(parseVerifyResponse)
        .then(() => {
          onPaymentSuccess(response.reference);
          window.location.href = '/dashboard';
        })
        .catch(error => {
          console.error('Error verifying payment:', error);
          const message = error instanceof Error ? error.message : 'Payment verification failed.';
          alert(`${message} Please contact support if you were charged. Ref: ${response.reference}`);
          setShowLocationModal(false);
        });
      },
      onClose: () => {
        onClose();
      }
    });
    
    handler.openIframe();
  };

  return (
    <div className="relative">
      {/* Buy Now Button */}
      <button
        onClick={handleBuyNow}
        className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-bold text-lg transition-colors"
      >
        Buy Now {price}
      </button>

      {/* Location Selection Modal */}
      {showLocationModal && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <div className="bg-gray-200 border-2 border-green-500 rounded-lg p-6 relative">
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

            
            <div className="space-y-3">
              <button
                onClick={() => handleLocationSelect('ghana')}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-bold text-lg transition-colors"
              >
                IN GHANA
              </button>
               {/* <button
                onClick={() => handleLocationSelect('other')}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-bold text-lg transition-colors"
              >
                NOT IN GHANA
              </button>  Location Buttons */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
