'use client';

import { useState, useEffect } from 'react';
import { FaChartLine, FaTrophy, FaUsers, FaDollarSign, FaCalendarAlt, FaFire, FaCopy, FaCheck } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { fetchVipForToday } from '../../lib/gamesApi';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedPackages, setExpandedPackages] = useState<number[]>([]);
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);
  const [isSubtitleVisible, setIsSubtitleVisible] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [purchasedGames, setPurchasedGames] = useState<any[]>([]);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      if (!isAuthenticated) {
        setPurchasedGames([]);
        setIsLoadingPurchases(false);
        return;
      }

      setIsLoadingPurchases(true);

      try {
        const userEmail = user?.email || localStorage.getItem('email') || '';
        if (!userEmail) {
          setPurchasedGames([]);
          return;
        }

        const encodedEmail = encodeURIComponent(userEmail);
        const purchasesResponse = await fetch(
          `https://a1-tips-backend-main.onrender.com/auth/user-purchases/${encodedEmail}`
        );
        if (!purchasesResponse.ok) {
          throw new Error('Failed to fetch purchases');
        }

        const purchases = await purchasesResponse.json();
        const purchasedCategories = (['VIP1', 'VIP2', 'VIP3'] as const).filter((category) => {
          const key = category.toLowerCase() as 'vip1' | 'vip2' | 'vip3';
          return purchases[key] === true;
        });

        if (purchasedCategories.length === 0) {
          setPurchasedGames([]);
          return;
        }

        const vipPackages = await fetchVipForToday();
        const transformed = vipPackages
          .filter((pkg: any) => purchasedCategories.includes(pkg.category))
          .map((pkg: any) => {
            const allCompleted = pkg.games.every((g: any) => {
              const status = g.match_status?.toLowerCase();
              return status === 'won' || status === 'lost';
            });

            return {
              id: pkg.id,
              package: pkg.category,
              games: pkg.games.map((g: any) => ({
                match: `${g.home_team} vs ${g.away_team}`,
                prediction: g.prediction,
                odds: String(g.odds),
                bookingCode: pkg.booking_code,
                status: g.match_status,
              })),
              purchaseDate: pkg.deadline ? pkg.deadline.slice(0, 10) : '',
              price: pkg.price && pkg.price.trim() !== '' ? pkg.price : 'N/A',
              status: allCompleted ? 'Completed' : 'Active',
            };
          });

        setPurchasedGames(transformed);
      } catch (err) {
        console.error('Error fetching purchases:', err);
        setPurchasedGames([]);
      } finally {
        setIsLoadingPurchases(false);
      }
    };

    fetchPurchases();
  }, [isAuthenticated, user?.email]);


  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Animate welcome message on component mount
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const timer1 = setTimeout(() => setIsWelcomeVisible(true), 300);
      const timer2 = setTimeout(() => setIsSubtitleVisible(true), 600);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isAuthenticated, isLoading]);

  // Redirect to settings page when settings tab is selected
  useEffect(() => {
    if (activeTab === 'settings') {
      router.push('/settings');
    }
  }, [activeTab, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const normalizeStatus = (status?: string) => status?.toLowerCase() ?? 'pending';

  const togglePackage = (packageId: number) => {
    setExpandedPackages(prev => 
      prev.includes(packageId) 
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    );
  };

  // Security function: Check if any game in a purchase is pending
  const hasPendingGames = (games: any[]) => {
    return games.some(game => game.status === 'Pending' || game.status === 'pending' || !game.status);
  };

  // Security function: Check if all games are completed (won/lost)
  const allGamesCompleted = (games: any[]) => {
    return games.every(game => game.status === 'Won' || game.status === 'Lost' || game.status === 'won' || game.status === 'lost');
  };

  const copyToClipboard = async (text: string, codeType: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopiedCode(codeType);
        setTimeout(() => setCopiedCode(null), 2000); // Reset after 2 seconds
        return;
      }
      
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopiedCode(codeType);
        setTimeout(() => setCopiedCode(null), 2000);
      } else {
        alert('Failed to copy code. Please select and copy manually: ' + text);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('Failed to copy code. Please select and copy manually: ' + text);
    }
  };

  const stats = [
    {
      title: 'Total Purchases',
      value: '12',
      change: '+3 this month',
      changeType: 'positive',
      icon: FaDollarSign,
    },
    {
      title: 'Games Purchased',
      value: '47',
      change: '+8 this month',
      changeType: 'positive',
      icon: FaTrophy,
    },
    {
      title: 'Active Tips',
      value: '24',
      change: '+3',
      changeType: 'positive',
      icon: FaFire,
    },
    {
      title: 'Total Tips',
      value: '1,247',
      change: '+45',
      changeType: 'positive',
      icon: FaChartLine,
    },
  ];
  const getUsername = () => {
    return localStorage.getItem('username') || 'User';
  };
  const userName = getUsername();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-500 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 
            className={`text-3xl font-bold text-black transition-all duration-700 ease-out ${
              isWelcomeVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}
          >
            Welcome back, <span className="text-green-800">{userName}</span>!
          </h1>
          <p 
            className={`mt-2 text-black text-opacity-80 transition-all duration-700 ease-out delay-300 ${
              isSubtitleVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}
          >
            Here's your betting overview and performance summary
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              // { id: 'history', name: 'History' },
              // { id: 'settings', name: 'Settings' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Stats Grid */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                      <stat.icon className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.title}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stat.value}
                        </div>
                        <div
                          className={`ml-2 flex items-baseline text-sm font-semibold ${
                            stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {stat.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div> */}

        {/* Main Content */}
        {activeTab === 'overview' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Your Purchased Games
              </h3>
              {isLoadingPurchases ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                  <span className="ml-3 text-gray-600">Loading your purchases...</span>
                </div>
              ) : purchasedGames.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <p className="font-medium text-gray-900 mb-1">No purchased games yet</p>
                  <p className="text-sm">Buy a VIP package on the Predictions or VIP page and it will appear here.</p>
                </div>
              ) : (
              <div className="space-y-4">
                {purchasedGames.map((purchase) => (
                  <div key={purchase.id} className="border border-gray-200 rounded-lg">
                    {/* Package Header - Clickable */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => togglePackage(purchase.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <h4 className="text-lg font-semibold text-gray-900 mr-3">{purchase.package}</h4>
                          <span className="text-sm text-gray-500">({purchase.games.length} games)</span>
                        </div>
                        <div className="flex items-center">
                          <div className="text-right mr-3">
                            <p className="text-lg font-bold text-green-600">{purchase.price}</p>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                purchase.status === 'Active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {purchase.status}
                            </span>
                          </div>
                          <span className="text-gray-400 text-lg">
                            {expandedPackages.includes(purchase.id) ? '−' : '+'}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Purchased: {purchase.purchaseDate}</p>
                    </div>

                    {/* Games Details - Expandable */}
                    {expandedPackages.includes(purchase.id) && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <p className="text-sm font-medium text-gray-700 mb-3">Full Details:</p>
                        <div className="space-y-4">
                          {purchase.games.map((game, index) => (
                            <div key={index} className="p-3">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="text-sm font-semibold text-gray-900">{game.match}</h5>
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                    normalizeStatus(game.status) === 'won'
                                      ? 'bg-green-500 text-white'
                                      : normalizeStatus(game.status) === 'lost'
                                      ? 'bg-red-500 text-white'
                                      : 'bg-yellow-500 text-white'
                                  }`}
                                >
                                  {normalizeStatus(game.status) === 'won' ? '✓' : normalizeStatus(game.status) === 'lost' ? '✗' : '?'}
                                </span>
                              </div>
                              {/* Only show full details if all games are completed */}
                              { true ? (
                                <div className="flex gap-4 text-xs">
                                  <div>
                                    <span className="font-medium text-gray-700">Prediction:</span> {game.prediction}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ))}
                          
                          {/* Booking Codes Section - Only show if all games are completed */}
                          {purchase.games.length > 0 && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <h6 className="text-sm font-semibold text-blue-900 mb-2">Booking Codes:</h6>
                              <div className="space-y-1">
                                <div className="flex items-center">
                                  <span className="text-xs font-medium text-blue-700 w-16">Sporty:</span>
                                  <span className="text-xs font-mono text-blue-900 bg-blue-100 px-2 py-1 rounded">{purchase.games[0].bookingCode || purchase.share_code || 'N/A'}</span>
                                  <button 
                                    onClick={() => copyToClipboard(purchase.games[0].bookingCode || purchase.share_code || '', 'sporty')}
                                    className="ml-2 flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    {copiedCode === 'sporty' ? (
                                      <>
                                        <FaCheck className="w-3 h-3 mr-1 text-green-600" />
                                        <span className="text-green-600">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <FaCopy className="w-3 h-3 mr-1" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                {/* If you want to show other codes, add similar blocks here using purchase.share_code or other fields from API */}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              )}
            </div>
          </div>
        )}

        {/* History Tab Content */}
        {activeTab === 'history' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                Purchase History
              </h3>
              <div className="space-y-6">
                {purchasedGames.map((purchase) => (
                  <div key={purchase.id} className="border border-gray-200 rounded-lg">
                    {/* Package Header - Clickable */}
                    <div 
                      className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => togglePackage(purchase.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <h4 className="text-xl font-bold text-gray-900 mr-3">{purchase.package}</h4>
                          <span className="text-sm text-gray-500">({purchase.games.length} games)</span>
                        </div>
                        <div className="flex items-center">
                          <div className="text-right mr-4">
                            <p className="text-lg font-bold text-green-600">{purchase.price}</p>
                            <span
                              className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                                purchase.status === 'Active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {purchase.status}
                            </span>
                          </div>
                          <span className="text-gray-400 text-xl">
                            {expandedPackages.includes(purchase.id) ? '−' : '+'}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Purchased: {purchase.purchaseDate}</p>
                    </div>

                    {/* Games Details - Expandable */}
                    {expandedPackages.includes(purchase.id) && (
                      <div className="border-t border-gray-200 p-6 bg-gray-50">
                        <h5 className="text-lg font-semibold text-gray-800 mb-4">
                          Games Purchased ({purchase.games.length}) - Full Details:
                        </h5>
                        <div className="space-y-6">
                          {purchase.games.map((game, index) => (
                            <div key={index} className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <h6 className="text-base font-semibold text-gray-900">{game.match}</h6>
                                <span
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                                    game.status === 'Won'
                                      ? 'bg-green-500 text-white'
                                      : game.status === 'Lost'
                                      ? 'bg-red-500 text-white'
                                      : 'bg-yellow-500 text-white'
                                  }`}
                                >
                                  {game.status === 'Won' ? '✓' : game.status === 'Lost' ? '✗' : '?'}
                                </span>
                              </div>
                              {/* Only show full details if all games are completed */}
                              {allGamesCompleted(purchase.games) ? (
                                <div className="flex gap-6 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-700">Prediction:</span> {game.prediction}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ))}
                          
                          {/* Booking Codes Section - Only show if all games are completed */}
                          {allGamesCompleted(purchase.games) && (
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <h6 className="text-base font-semibold text-blue-900 mb-3">Booking Codes:</h6>
                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <span className="text-sm font-medium text-blue-700 w-20">Sporty:</span>
                                  <span className="text-sm font-mono text-blue-900 bg-blue-100 px-3 py-1 rounded">BCTDGJ</span>
                                  <button 
                                    onClick={() => copyToClipboard('BCTDGJ', 'sporty')}
                                    className="ml-3 flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    {copiedCode === 'sporty' ? (
                                      <>
                                        <FaCheck className="w-3 h-3 mr-1 text-green-600" />
                                        <span className="text-green-600">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <FaCopy className="w-3 h-3 mr-1" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
