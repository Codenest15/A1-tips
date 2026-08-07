'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import DepositComponent from '../../components/NewPayment';

// Game type used for VIP packages
type Game = {
  id?: number;
  home_team: string;
  away_team: string;
  tournament?: string;
  sport?: string;
  odds?: number;
  prediction?: string;
  match_status?: string;
  match_day?: string;
  booking_id?: number;
};

export default function VIP() {
  const [selectedDate, setSelectedDate] = useState('today');
  const [dateFilter] = useState('');
  const [vipAvailability, setVipAvailability] = useState({
    'VIP 1': false,
    'VIP 2': false,
    'VIP 3': false
  });
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [vipPackages, setVipPackages] = useState<{
    category: string;
    id: number;
    price: string;
    booking_code: string;
    updated: boolean;
    games: {home_team: string, away_team: string, prediction: string, odds: number, match_status: string}[];
  }[]>([]);
  const [isLoadingVipPackages, setIsLoadingVipPackages] = useState(true);
  const [vipHistoryPackages, setVipHistoryPackages] = useState<{
    category: string;
    id: number;
    price: string;
    booking_code: string;
    updated: boolean;
    games: {home_team: string, away_team: string, prediction: string, odds: number, match_status: string}[];
  }[]>([]);
  const [isLoadingVipHistory, setIsLoadingVipHistory] = useState(false);

  // Security function: Check if a specific game is pending
  const isGamePending = (game: Game) => {
    return game.match_status === 'Pending' || game.match_status === 'pending' || !game.match_status || game.match_status === '?';
  };

  // Security function: Check if a specific game is completed (won/lost)
  const isGameCompleted = (game: Game) => {
    return game.match_status === 'Won' || game.match_status === 'Lost' || game.match_status === 'won' || game.match_status === 'lost';
  };

  // Security function: Check if ALL games are pending (normal state)
  const allGamesPending = (games: Game[]) => {
    return games.every(game => isGamePending(game));
  };

  // Security function: Check if ANY game is completed (individual security)
  const anyGameCompleted = (games: Game[]) => {
    return games.some(game => isGameCompleted(game));
  };
  
    // Redirect to login if not authenticated
    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/login');
      }
    }, [isAuthenticated, isLoading, router]);
  
    // Fetch VIP availability from API
    useEffect(() => {
      const fetchVipAvailability = async () => {
        try {
          const response = await fetch('https://api.a1-tips.com/games/vip-list');
          
          if (!response.ok) {
            throw new Error(`Failed to fetch VIP availability: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          // Transform API response to match expected state shape
          const transformedAvailability = {
            'VIP 1': false,
            'VIP 2': false,
            'VIP 3': false
          };
          
          data.forEach((vip: {id: number, name: string, amount: number, available: boolean}) => {
            // Transform name format: VIP1 -> "VIP 1", VIP2 -> "VIP 2", etc.
            const formattedName = vip.name.replace(/VIP(\d+)/, 'VIP $1');
            if (formattedName === 'VIP 1' || formattedName === 'VIP 2' || formattedName === 'VIP 3') {
              transformedAvailability[formattedName as keyof typeof transformedAvailability] = vip.available;
            }
          });
          
          setVipAvailability(transformedAvailability);
          
        } catch (error) {
          console.error('Error fetching VIP availability:', error);
          // Keep default state (all false) on error
        }
      };
  
      fetchVipAvailability();
      
      // Also check localStorage for any admin updates (fallback/secondary source)
      const checkLocalStorage = () => {
        const storedStatuses = localStorage.getItem('vipPlanStatuses');
        if (storedStatuses) {
          try {
            const parsedStatuses = JSON.parse(storedStatuses);
            // Only use localStorage if API data is not available
            setVipAvailability(prevState => {
              // Merge with API data, prioritizing API data over localStorage
              return { ...parsedStatuses, ...prevState };
            });
          } catch (error) {
            console.error('Error parsing VIP statuses from localStorage:', error);
          }
        }
      };
  
      // Listen for storage changes (when admin updates VIP status)
      const handleStorageChange = () => {
        checkLocalStorage();
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      return () => window.removeEventListener('storage', handleStorageChange);
    }, []);
  
    // Fetch VIP packages for today
    useEffect(() => {
      const fetchVipPackages = async () => {
        setIsLoadingVipPackages(true);
        try {
          const response = await fetch('https://api.a1-tips.com/games/vip-for-today');
          
          if (!response.ok) {
            throw new Error(`Failed to fetch VIP packages: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          setVipPackages(data);
          
        } catch (error) {
          console.error('Error fetching VIP packages:', error);
          // Keep empty array on error
          setVipPackages([]);
        } finally {
          setIsLoadingVipPackages(false);
        }
      };
  
      fetchVipPackages();
    }, []);

  // Fetch VIP history for selected non-today date or custom date
  useEffect(() => {
    const fetchVipHistory = async () => {
      const isCustom = Boolean(dateFilter);
      if (!isCustom && selectedDate !== 'yesterday' && selectedDate !== 'tomorrow') {
        setVipHistoryPackages([]);
        return;
      }
      setIsLoadingVipHistory(true);
      try {
        let apiDate = new Date().toISOString().split('T')[0];
        if (selectedDate === 'yesterday') {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          apiDate = d.toISOString().split('T')[0];
        } else if (selectedDate === 'tomorrow') {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          apiDate = d.toISOString().split('T')[0];
        } else if (isCustom) {
          apiDate = dateFilter;
        }

        const endpoint = `https://api.a1-tips.com/games/vip-history?date=${apiDate}`;
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('VIP history not available yet');
        const data = await res.json();
        setVipHistoryPackages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn('VIP history fetch skipped/failed (backend to provide):', err);
        setVipHistoryPackages([]);
      } finally {
        setIsLoadingVipHistory(false);
      }
    };

    fetchVipHistory();
  }, [selectedDate, dateFilter]);
  
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
  
    // const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //   setDateFilter(e.target.value);
    // };
  
    // const handlePaymentSuccess = (reference: string) => {
    //   // Here you would typically update the user's purchased packages
    //   // For now, we'll just show an alert
    //   alert(`Payment successful! Reference: ${reference}`);
    // };
    
  
    
  
    // const handlePaymentClose = () => {
    // };
  
    // Helper function to get VIP package data by category
    const getVipPackageByCategory = (category: string) => {
      return vipPackages.find(pkg => pkg.category === category);
    };
  

  // Redirect to login if not authenticated
  // useEffect(() => {
  //   if (!isLoading && !isAuthenticated) {
  //     router.push('/login');
  //   }
  // }, [isAuthenticated, isLoading, router]);

  // Check VIP availability from localStorage
  // useEffect(() => {
  //   const checkVipAvailability = () => {
  //     const storedStatuses = localStorage.getItem('vipPlanStatuses');
  //     if (storedStatuses) {
  //       try {
  //         const parsedStatuses = JSON.parse(storedStatuses);
  //         setVipAvailability(parsedStatuses);
  //       } catch (error) {
  //         console.error('Error parsing VIP statuses:', error);
  //       }
  //     }
  //   };

  //   checkVipAvailability();
    
  //   // Listen for storage changes (when admin updates VIP status)
  //   const handleStorageChange = () => checkVipAvailability();
  //   window.addEventListener('storage', handleStorageChange);
    
  //   return () => window.removeEventListener('storage', handleStorageChange);
  // }, []);

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

  // dateFilter setter used by date input when enabled
  // (kept as inline setter elsewhere if needed)

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };
  // cache package lookups to avoid repeated find() calls and guard against undefined
  const vip1 = getVipPackageByCategory('VIP1');
  const vip2 = getVipPackageByCategory('VIP2');
  const vip3 = getVipPackageByCategory('VIP3');

  console.log('VIP3 package:', vip3);


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">VIP Packages</h1>
          <p className="text-xl md:text-2xl text-gray-600">
            Premium betting tips and predictions from our experts
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">

        {/* Date Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleDateSelect('yesterday')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedDate === 'yesterday' 
                  ? 'bg-green-500 hover:bg-green-600 text-white font-semibold' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Yesterday
            </button>
            <button 
              onClick={() => handleDateSelect('today')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedDate === 'today' 
                  ? 'bg-green-500 hover:bg-green-600 text-white font-semibold' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Today
            </button>
            <button 
              onClick={() => handleDateSelect('tomorrow')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedDate === 'tomorrow' 
                  ? 'bg-green-500 hover:bg-green-600 text-white font-semibold' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Tomorrow
            </button>
          </div>
          
          {/* <div className="flex items-center gap-2">
            <input
              type="date"
              id="dateFilter" 
              value={dateFilter}
              onChange={handleDateChange}
              placeholder="Select date"
              className="px-4 py-2 border-2 border-green-500 text-green-500 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
            />
          </div> */}
        </div>

        {/* Match Prediction Cards */}
                {selectedDate === "today" && !dateFilter && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Today’s Featured Matches
                      </h2>
                      <p className="text-gray-600">
                        Premium predictions with high confidence ratings
                      </p>
                    </div>
        
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                        {/* VIP Package 1 */}
                                        <div className={`bg-white border rounded-lg shadow-lg p-6 transition-shadow ${
                                          vipAvailability['VIP 1'] 
                                            ? 'border-gray-200 hover:shadow-xl' 
                                            : 'border-red-200 bg-red-50'
                                        }`}>
                                          <div className="text-center">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-4">VIP 1</h3>
                                            <div className="mb-4 text-left">
                                              {isLoadingVipPackages ? (
                                                <div className="flex items-center justify-center py-4">
                                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                                                  <span className="ml-2 text-gray-600">Loading matches...</span>
                                                </div>
                                              ) : vip1 ? (
                                                vip1.updated ? (
                                                  <div className="space-y-4">
                                                    {vip1.games.map((game, index) => (
                                                      <div
                                                        key={index}
                                                        className={`${index < vip1.games.length - 1 ? 'border-b border-gray-100 pb-3' : ''}`}
                                                      >
                                                        <h4 className="text-gray-900 font-semibold mb-2">
                                                          {game.home_team} vs {game.away_team}
                                                        </h4>
                                                        {/* Show details based on overall package status */}
                                                        {allGamesPending(vip1.games) ? (
                                                          // Normal state: ALL games pending - show only match names
                                                          null
                                                        ) : anyGameCompleted(vip1.games) ? (
                                                          // Individual security: SOME games completed - show details only for completed games
                                                          isGameCompleted(game) ? (
                                                            <>
                                                              <div className="text-sm text-gray-600 mb-2">Prediction: {game.prediction}</div>
                                                              <div className="flex items-center gap-2">
                                                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                                  Option: {game.prediction}
                                                                </span>
                                                                <span className="ml-auto">
                                                                  {game.match_status?.toLowerCase() === 'won' ? (
                                                                    <div className="inline-flex items-center justify-center w-6 h-6 bg-green-500 rounded-full">
                                                                      <span className="text-white font-bold text-sm">✓</span>
                                                                    </div>
                                                                  ) : game.match_status?.toLowerCase() === 'lost' ? (
                                                                    <div className="inline-flex items-center justify-center w-6 h-6 bg-red-500 rounded-full">
                                                                      <span className="text-white font-bold text-sm">✗</span>
                                                                    </div>
                                                                  ) : (
                                                                    <div className="inline-flex items-center justify-center w-6 h-6 bg-yellow-500 rounded-full">
                                                                      <span className="text-white font-bold text-sm">?</span>
                                                                    </div>
                                                                  )}
                                                                </span>
                                                              </div>
                                                            </>
                                                          ) : (
                                                            <div className="ml-auto">
                                                              {game.match_status?.toLowerCase() === 'won' ? (
                                                                <div className="inline-flex items-center justify-center w-6 h-6 bg-green-500 rounded-full">
                                                                  <span className="text-white font-bold text-sm">✓</span>
                                                                </div>
                                                              ) : game.match_status?.toLowerCase() === 'lost' ? (
                                                                <div className="inline-flex items-center justify-center w-6 h-6 bg-red-500 rounded-full">
                                                                  <span className="text-white font-bold text-sm">✗</span>
                                                                </div>
                                                              ) : (
                                                                <div className="inline-flex items-center justify-center w-6 h-6 bg-yellow-500 rounded-full">
                                                                  <span className="text-white font-bold text-sm">?</span>
                                                                </div>
                                                              )}
                                                            </div>
                                                          )
                                                        ) : (
                                                          // Default: Show all details
                                                          <>
                                                            <div className="text-sm text-gray-600 mb-2">Prediction: {game.prediction}</div>
                                                            <div className="flex items-center gap-2">
                                                              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                                Option: {game.prediction}
                                                              </span>
                                                              <span className="ml-auto">
                                                                {game.match_status?.toLowerCase() === 'won' ? (
                                                                  <div className="inline-flex items-center justify-center w-6 h-6 bg-green-500 rounded-full">
                                                                    <span className="text-white font-bold text-sm">✓</span>
                                                                  </div>
                                                                ) : game.match_status?.toLowerCase() === 'lost' ? (
                                                                  <div className="inline-flex items-center justify-center w-6 h-6 bg-red-500 rounded-full">
                                                                    <span className="text-white font-bold text-sm">✗</span>
                                                                  </div>
                                                                ) : (
                                                                  <div className="inline-flex items-center justify-center w-6 h-6 bg-yellow-500 rounded-full">
                                                                    <span className="text-white font-bold text-sm">?</span>
                                                                  </div>
                                                                )}
                                                              </span>
                                                            </div>
                                                          </>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                ) : (
                                                  <ul className="space-y-2">
                                                    {vip1.games.map((game, index) => (
                                                      <li key={index} className="text-gray-900 font-semibold">
                                                        {game.home_team} vs {game.away_team}
                                                      </li>
                                                    ))}
                                                  </ul>
                                                )
                                              ) : (
                                                <div className="text-gray-600 text-center py-4">
                                                  No matches available
                                                </div>
                                              )}
                                            </div>
                                            {vipAvailability['VIP 1'] ? (
                                              vip1 ? (
                                                anyGameCompleted(vip1.games) ? (
                                                  <div className="bg-blue-500 text-white py-3 px-4 rounded-lg font-bold text-lg">RESULTS UPLOADED</div>
                                                ) : (
                                                    <DepositComponent gameType="VIP1" vipamount={Number(vip1.price ?? 0)} />
                                                )
                                              ) : (
                                                <div className="bg-gray-500 text-white py-3 px-4 rounded-lg font-bold text-lg">NOT AVAILABLE</div>
                                              )
                                            ) : (
                                              <div className="bg-red-500 text-white py-3 px-4 rounded-lg font-bold text-lg">SOLD OUT</div>
                                            )}
                                          </div>
                                        </div>
        
                
                            
                                        {/* VIP Package 2 */}
                                        <div className={`bg-white border rounded-lg shadow-lg p-6 transition-shadow ${
                                          vipAvailability['VIP 2'] 
                                            ? 'border-gray-200 hover:shadow-xl' 
                                            : 'border-red-200 bg-red-50'
                                        }`}>
                                          <div className="text-center">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-4">VIP 2</h3>
                                            <div className="mb-4 text-left">
                                              {isLoadingVipPackages ? (
                                                <div className="flex items-center justify-center py-4">
                                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                                                  <span className="ml-2 text-gray-600">Loading matches...</span>
                                                </div>
                                              ) : vip2 ? (
                                                vip2.updated ? (
                                                  <div className="space-y-4">
                                                    {vip2.games.map((game, index) => (
                                                      <div key={index} className={`${index < vip2.games.length - 1 ? 'border-b border-gray-100 pb-3' : ''}`}>
                                                        <h4 className="text-gray-900 font-semibold mb-2">
                                                          {game.home_team} vs {game.away_team}
                                                        </h4>
                                                        {/* Show details based on overall package status */}
                                                        {allGamesPending(vip2.games) ? (
                                                          // Normal state: ALL games pending - show only match names
                                                          null
                                                        ) : anyGameCompleted(vip2.games) ? (
                                                          // Individual security: SOME games completed - show details only for completed games
                                                          isGameCompleted(game) ? (
                                                            <>
                                                              <div className="text-sm text-gray-600 mb-2">Prediction: {game.prediction}</div>
                                                              {/* <div className="text-sm text-gray-600 mb-2">Odds: {game.odds}</div> */}
                                                              <div className="flex items-center gap-2">
                                                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                                  Option: {game.prediction}
                                                                </span>
                                                                {/* <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                                  Odds: {game.odds}
                                                                </span> */}
                                                                <span className="ml-auto">
                                                                  {game.match_status?.toLowerCase() === 'won' ? (
                                                                    <div className="inline-flex items-center justify-center w-6 h-6 bg-green-500 rounded-full">
                                                                      <span className="text-white font-bold text-sm">✓</span>
                                                                    </div>
                                                                  ) : game.match_status?.toLowerCase() === 'lost' ? (
                                                                    <div className="inline-flex items-center justify-center w-6 h-6 bg-red-500 rounded-full">
                                                                      <span className="text-white font-bold text-sm">✗</span>
                                                                    </div>
                                                                  ) : (
                                                                    <div className="inline-flex items-center justify-center w-6 h-6 bg-yellow-500 rounded-full">
                                                                      <span className="text-white font-bold text-sm">?</span>
                                                                    </div>
                                                                  )}
                                                                </span>
                                                              </div>
                                                            </>
                                                          ) : (
                                                            <div className="ml-auto">
                                                              {game.match_status?.toLowerCase() === 'won' ? (
                                                                <div className="inline-flex items-center justify-center w-6 h-6 bg-green-500 rounded-full">
                                                                  <span className="text-white font-bold text-sm">✓</span>
                                                                </div>
                                                              ) : game.match_status?.toLowerCase() === 'lost' ? (
                                                                <div className="inline-flex items-center justify-center w-6 h-6 bg-red-500 rounded-full">
                                                                  <span className="text-white font-bold text-sm">✗</span>
                                                                </div>
                                                              ) : (
                                                                <div className="inline-flex items-center justify-center w-6 h-6 bg-yellow-500 rounded-full">
                                                                  <span className="text-white font-bold text-sm">?</span>
                                                                </div>
                                                              )}
                                                            </div>
                                                          )
                                                        ) : (
                                                          // Default: Show all details
                                                          <>
                                                            <div className="text-sm text-gray-600 mb-2">Prediction: {game.prediction}</div>
                                                            {/* <div className="text-sm text-gray-600 mb-2">Odds: {game.odds}</div> */}
                                                            <div className="flex items-center gap-2">
                                                              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                                Option: {game.prediction}
                                                              </span>
                                                              {/* <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                                Odds: {game.odds}
                                                              </span> */}
                                                              <span className="ml-auto">
                                                                {game.match_status?.toLowerCase() === 'won' ? (
                                                                  <div className="inline-flex items-center justify-center w-6 h-6 bg-green-500 rounded-full">
                                                                    <span className="text-white font-bold text-sm">✓</span>
                                                                  </div>
                                                                ) : game.match_status?.toLowerCase() === 'lost' ? (
                                                                  <div className="inline-flex items-center justify-center w-6 h-6 bg-red-500 rounded-full">
                                                                    <span className="text-white font-bold text-sm">✗</span>
                                                                  </div>
                                                                ) : (
                                                                  <div className="inline-flex items-center justify-center w-6 h-6 bg-yellow-500 rounded-full">
                                                                    <span className="text-white font-bold text-sm">?</span>
                                                                  </div>
                                                                )}
                                                              </span>
                                                            </div>
                                                          </>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                ) : (
                                                  <ul className="space-y-2">
                                                    {vip2.games.map((game, index) => (
                                                      <li key={index} className="text-gray-900 font-semibold">{game.home_team} vs {game.away_team}</li>
                                                    ))}
                                                  </ul>
                                                )
                                              ) : (
                                                <div className="text-gray-600 text-center py-4">No matches available</div>
                                              )}
                                            </div>
                                            {vipAvailability['VIP 2'] ? (
                                              getVipPackageByCategory('VIP2') ? (
                                                anyGameCompleted(getVipPackageByCategory('VIP2')!.games) ? (
                                                  <div className="bg-blue-500 text-white py-3 px-4 rounded-lg font-bold text-lg">
                                                    RESULTS UPLOADED
                                                  </div>
                                                ) : (
                                                    <DepositComponent gameType="VIP2" vipamount={Number(vip2?.price ?? 0)} />
                                                )
                                              ) : (
                                                <div className="bg-gray-500 text-white py-3 px-4 rounded-lg font-bold text-lg">
                                                  NOT AVAILABLE
                                                </div>
                                              )
                                            ) : (
                                              <div className="bg-red-500 text-white py-3 px-4 rounded-lg font-bold text-lg">
                                                SOLD OUT
                                              </div>
                                            )}
                                          </div>
                                        </div>
                            
                                        {/* VIP Package 3 */}
                                        <div className={`bg-white border rounded-lg shadow-lg p-6 transition-shadow ${
                                          vipAvailability['VIP 3'] 
                                            ? 'border-gray-200 hover:shadow-xl' 
                                            : 'border-red-200 bg-red-50'
                                        }`}>
                                          <div className="text-center">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-6">VIP 3</h3>
                                            <div className="mb-6 text-left space-y-4">
                                              {isLoadingVipPackages ? (
                                                <div className="flex items-center justify-center py-4">
                                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                                                  <span className="ml-2 text-gray-600">Loading matches...</span>
                                                </div>
                                              ) : vip3 ? (
                                                vip3.updated ? (
                                                  vip3.games.map((game, index) => (
                                                    <div key={index} className={`${index < vip3.games.length - 1 ? 'border-b border-gray-100 pb-3' : ''}`}>
                                                      <h4 className="text-gray-900 font-semibold mb-2">{game.home_team} vs {game.away_team}</h4>
                                                      {allGamesPending(vip3.games) ? null : anyGameCompleted(vip3.games) ? (
                                                        isGameCompleted(game) ? (
                                                          <>
                                                            <div className="text-sm text-gray-600 mb-2">Prediction: {game.prediction}</div>
                                                            <div className="flex items-center gap-2">
                                                              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Option: {game.prediction}</span>
                                                              <span className="ml-auto">
                                                                {game.match_status === 'won' || game.match_status === 'Won' || game.match_status === 'WON' ? (
                                                                  <div className="inline-flex items-center justify-center w-6 h-6 bg-green-500 rounded-full"><span className="text-white font-bold text-sm">✓</span></div>
                                                                ) : game.match_status === 'lost' || game.match_status === 'Lost' || game.match_status === 'LOST' ? (
                                                                  <div className="inline-flex items-center justify-center w-6 h-6 bg-red-500 rounded-full"><span className="text-white font-bold text-sm">✗</span></div>
                                                                ) : (
                                                                  <div className="inline-flex items-center justify-center w-6 h-6 bg-yellow-500 rounded-full"><span className="text-white font-bold text-sm">?</span></div>
                                                                )}
                                                              </span>
                                                            </div>
                                                          </>
                                                        ) : (
                                                          <div className="ml-auto">
                                                            {game.match_status === 'won' || game.match_status === 'Won' || game.match_status === 'WON' ? (
                                                              <div className="inline-flex items-center justify-center w-6 h-6 bg-green-500 rounded-full"><span className="text-white font-bold text-sm">✓</span></div>
                                                            ) : game.match_status === 'lost' || game.match_status === 'Lost' || game.match_status === 'LOST' ? (
                                                              <div className="inline-flex items-center justify-center w-6 h-6 bg-red-500 rounded-full"><span className="text-white font-bold text-sm">✗</span></div>
                                                            ) : (
                                                              <div className="inline-flex items-center justify-center w-6 h-6 bg-yellow-500 rounded-full"><span className="text-white font-bold text-sm">?</span></div>
                                                            )}
                                                          </div>
                                                        )
                                                      ) : (
                                                        <>
                                                          <div className="text-sm text-gray-600 mb-2">Prediction: {game.prediction}</div>
                                                          <div className="flex items-center gap-2">
                                                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Option: {game.prediction}</span>
                                                            <span className="ml-auto">
                                                              {game.match_status === 'won' || game.match_status === 'Won' || game.match_status === 'WON' ? (
                                                                <div className="inline-flex items-center justify-center w-6 h-6 bg-green-500 rounded-full"><span className="text-white font-bold text-sm">✓</span></div>
                                                              ) : game.match_status === 'lost' || game.match_status === 'Lost' || game.match_status === 'LOST' ? (
                                                                <div className="inline-flex items-center justify-center w-6 h-6 bg-red-500 rounded-full"><span className="text-white font-bold text-sm">✗</span></div>
                                                              ) : (
                                                                <div className="inline-flex items-center justify-center w-6 h-6 bg-yellow-500 rounded-full"><span className="text-white font-bold text-sm">?</span></div>
                                                              )}
                                                            </span>
                                                          </div>
                                                        </>
                                                      )}
                                                    </div>
                                                  ))
                                                ) : (
                                                  <ul className="space-y-2">
                                                    {vip3.games.map((game, index) => (
                                                      <li key={index} className="text-gray-900 font-semibold">{game.home_team} vs {game.away_team}</li>
                                                    ))}
                                                  </ul>
                                                )
                                              ) : (
                                                <div className="text-gray-600 text-center py-4">No matches available</div>
                                              )}
                                            </div>
                                            {/* Show payment button if available and no results yet, otherwise show status */}
                                            {vipAvailability['VIP 3'] ? (
                                              getVipPackageByCategory('VIP3') ? (
                                                anyGameCompleted(getVipPackageByCategory('VIP3')!.games) ? (
                                                  <div className="bg-blue-500 text-white py-3 px-4 rounded-lg font-bold text-lg mt-4">
                                                    RESULTS UPLOADED
                                                  </div>
                                                ) : (
                                                    <DepositComponent gameType="VIP3" vipamount={Number(vip3?.price ?? 0)} />
                                                )
                                              ) : (
                                                <div className="bg-gray-500 text-white py-3 px-4 rounded-lg font-bold text-lg">
                                                  NOT AVAILABLE
                                                </div>
                                              )
                                            ) : (
                                              <div className="bg-red-500 text-white py-3 px-4 rounded-lg font-bold text-lg">
                                                SOLD OUT
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                  </div>
                )}
        
                {/* VIP History (for Yesterday/Custom dates) */}
                {(selectedDate === 'yesterday' || selectedDate === 'tomorrow' || dateFilter) && (
                  <div className="bg-white shadow rounded-lg p-6 mt-6">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">VIP History</h2>
                      <p className="text-gray-600">Past VIP games for the selected date</p>
                    </div>
        
                    {isLoadingVipHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                        <span className="ml-2 text-gray-600">Loading VIP history...</span>
                      </div>
                    ) : vipHistoryPackages.length === 0 ? (
                      <div className="text-center text-gray-600 py-6">
                        VIP history not available yet for this date.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        {(['VIP1','VIP2','VIP3'] as const).map((vipKey) => (
                          <div key={vipKey} className="bg-white border rounded-lg shadow-lg p-6">
                            <div className="text-center">
                              <h3 className="text-2xl font-bold text-gray-900 mb-4">{vipKey.replace('VIP', 'VIP ')}</h3>
                              <div className="mb-4 text-left">
                                {(() => {
                                  const pkg = vipHistoryPackages.find(p => p.category === vipKey);
                                  if (!pkg) return <div className="text-gray-600 text-center py-4">No matches available</div>;
                                  return (
                                    <div className="space-y-4">
                                      {pkg.games.map((game, index) => (
                                        <div key={index} className={`${index < pkg.games.length - 1 ? 'border-b border-gray-100 pb-3' : ''}`}>
                                          <h4 className="text-gray-900 font-semibold mb-2">{game.home_team} vs {game.away_team}</h4>
                                          <div className="text-sm text-gray-600 mb-2">Prediction: {game.prediction}</div>
                                          {/* <div className="text-sm text-gray-600 mb-2">Odds: {game.odds}</div> */}
                                          <div className="flex items-center gap-2">
                                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Option: {game.prediction}</span>
                                            {/* <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Odds: {game.odds}</span> */}
                                            <span className="ml-auto">
                                              {game.match_status?.toLowerCase() === 'won' ? (
                                                <div className="inline-flex items-center justify-center w-6 h-6 bg-green-500 rounded-full"><span className="text-white font-bold text-sm">✓</span></div>
                                              ) : game.match_status?.toLowerCase() === 'lost' ? (
                                                <div className="inline-flex items-center justify-center w-6 h-6 bg-red-500 rounded-full"><span className="text-white font-bold text-sm">✗</span></div>
                                              ) : (
                                                <div className="inline-flex items-center justify-center w-6 h-6 bg-yellow-500 rounded-full"><span className="text-white font-bold text-sm">?</span></div>
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

      </div>
    </div>
  );
}