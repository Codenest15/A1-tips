'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUsers, FaChartLine,FaHome, FaTrophy, FaDollarSign, FaCog, FaBell, FaCrown, FaSignOutAlt, FaTimes, FaGamepad, FaTachometerAlt, FaBars } from 'react-icons/fa';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState([]);
  const [vipPlans, setVipPlans] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch VIP plans from API
  useEffect(() => {
    const fetchVipPlans = async () => {
      try {
        const response = await fetch('https://a1-tips-backend-main.onrender.com/games/vip-list');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch VIP plans: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Transform API response to match expected state shape
        const transformedPlans = data.map(plan => ({
          id: plan.id,
          name: plan.name,
          status: plan.available ? 'Available' : 'Sold Out',
          canToggle: true
        }));
        
        setVipPlans(transformedPlans);
        
        // Store VIP plan statuses in localStorage for user pages to access
        const vipPlanStatuses = transformedPlans.reduce((acc, plan) => {
          acc[plan.name] = plan.status === 'Available';
          return acc;
        }, {});
        
        localStorage.setItem('vipPlanStatuses', JSON.stringify(vipPlanStatuses));
        
      } catch (error) {
        console.error('Error fetching VIP plans:', error);
        alert('Failed to load VIP plans. Please refresh the page to try again.');
        
        // Fallback to empty array with default localStorage
        setVipPlans([]);
        localStorage.setItem('vipPlanStatuses', JSON.stringify({}));
      }
    };

    if (isAuthenticated) {
      fetchVipPlans();
    }
  }, [isAuthenticated]);

  const [smsRecipients, setSmsRecipients] = useState('all');
  const [smsMessage, setSmsMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Free');
  const [bookingCodes, setBookingCodes] = useState({
    Slips: '',
    Free: '',
    VIP1: '',
    VIP2: '',
    VIP3: ''
  });
  const [loadedGames, setLoadedGames] = useState({
    Slips: [],
    Free: [],
    VIP1: [],
    VIP2: [],
    VIP3: []
  });
  const [loadedBookings, setLoadedBookings] = useState({
    Slips: [],
    Free: [],
    VIP1: [],
    VIP2: [],
    VIP3: []
  });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [sportyCode, setSportyCode] = useState('');
  const [gamePrice, setGamePrice] = useState('');
  // Price management states - separate prices for each category
  const [categoryPrices, setCategoryPrices] = useState({
    Free: '',
    VIP1: '',
    VIP2: '',
    VIP3: ''
  });
  const [gameResult, setGameResult] = useState('');
  const [editingGame, setEditingGame] = useState(null);
  const [selectedSlips, setSelectedSlips] = useState([]);
  const [expandedSlips, setExpandedSlips] = useState([]);
  const [archivedSlips, setArchivedSlips] = useState<string[]>([]);
  
  // Admin management states
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    email: '',
    password: '',
    role: 'limited'
  });
  const [admins, setAdmins] = useState([
    { id: 1, username: 'admin', email: 'admin@a1tips.com', role: 'full', status: 'active', createdDate: '2024-01-01' },
    { id: 2, username: 'moderator1', email: 'mod1@a1tips.com', role: 'limited', status: 'active', createdDate: '2024-01-15' }
  ]);
  
  // Users management states
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  const router = useRouter();

  // Check admin authentication
  useEffect(() => {
    const checkAuth = () => {
      const adminLoggedIn = localStorage.getItem('adminLoggedIn');
      if (adminLoggedIn === 'true') {
        setIsAuthenticated(true);
      } else {
        router.push('/login');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      const statsConfig = [
        {
          title: 'Total Users',
          endpoint: 'https://a1-tips-backend-main.onrender.com/auth/total-users',
          icon: FaUsers,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        },
        {
          title: 'Active Games',
          endpoint: 'https://a1-tips-backend-main.onrender.com/games/number-of-vip-bookings-today',
          icon: FaGamepad,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        },
        {
          title: 'VIP Subscriptions',
          endpoint: 'https://a1-tips-backend-main.onrender.com/payment/number-of-purchases',
          icon: FaCrown,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100'
        }
      ];

      const fetchedStats = await Promise.all(
        statsConfig.map(async (stat) => {
          try {
            const response = await fetch(stat.endpoint);
            if (response.ok) {
              const value = await response.json();
              return {
                ...stat,
                value: value.toString()
              };
            } else {
              console.error(`Failed to fetch ${stat.title}:`, response.statusText);
              return {
                ...stat,
                value: '0'
              };
            }
          } catch (error) {
            console.error(`Error fetching ${stat.title}:`, error);
            return {
              ...stat,
              value: '0'
            };
          }
        })
      );

      setStats(fetchedStats);
    };

    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAuthenticated) return;
      
      setIsLoadingUsers(true);
      try {
        const response = await fetch('https://a1-tips-backend-main.onrender.com/auth/all-users');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.statusText}`);
        }
        
        const userData = await response.json();
        
        setUsers(userData);
        
      } catch (error) {
        console.error('Error fetching users:', error);
        alert('Failed to fetch users. Please try again.');
        
        // Keep users as empty array on error
        setUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [isAuthenticated]);

  // Fetch existing slips from backend
  useEffect(() => {
    const fetchExistingSlips = async () => {
      if (!isAuthenticated) return;
      
      try {
        const response = await fetch('https://a1-tips-backend-main.onrender.com/games/all-bookings');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch existing slips: ${response.statusText}`);
        }
        
        const bookingsData = await response.json();
        
        // Transform API response to match current UI format
        const transformedSlips = bookingsData.flatMap((booking) =>
          booking.games.map((game, gameIndex) => ({
            id: `${booking.booking.id}-${game.id ?? gameIndex}-${game.home_team}-${game.away_team}`,
            originalId: game.id ?? gameIndex,
            match: `${game.home_team} vs ${game.away_team}`,
            type: game.prediction,
            odds: game.odds,
            originalCategory: booking.booking.category,
            categoryPrice: booking.booking.price,
            uploadDate: booking.booking.deadline,
            sportyCode: booking.booking.share_code,
            match_status: game.match_status || 'Pending',
            booking_id: booking.booking.id // Store booking ID for backend updates
          }))
        );
        
        // Update Slips with fetched data
        setLoadedGames(prev => ({
          ...prev,
          Slips: transformedSlips
        }));
        
      } catch (error) {
        console.error('Error fetching existing slips:', error);
        // Don't show alert for this as it's background loading
      }
    };

    fetchExistingSlips();
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUser');
    router.push('/login');
  };

  const toggleVipPlanStatus = async (planId: number) => {
    try {
      // Find the current plan to determine the new status
      const currentPlan = vipPlans.find(plan => plan.id === planId);
      if (!currentPlan) {
        console.error('Plan not found:', planId);
        alert('Plan not found. Please refresh the page.');
        return;
      }

      const newStatus = currentPlan.status === 'Available' ? 'Sold Out' : 'Available';
      const endpoint = newStatus === 'Sold Out' 
        ? `https://a1-tips-backend-main.onrender.com/games/mark-sold-out/${planId}`
        : `https://a1-tips-backend-main.onrender.com/games/update-availability/${planId}`;


      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }

      const responseData = await response.json();

      // Update local state only after successful API response
      setVipPlans(prev => {
        const updatedPlans = prev.map(plan => 
          plan.id === planId 
            ? { ...plan, status: newStatus }
            : plan
        );
        
        // Save VIP plan statuses to localStorage for user pages to access
        const vipPlanStatuses = updatedPlans.reduce((acc, plan) => {
          acc[plan.name] = plan.status === 'Available';
          return acc;
        }, {} as Record<string, boolean>);
        
        localStorage.setItem('vipPlanStatuses', JSON.stringify(vipPlanStatuses));
        
        return updatedPlans;
      });

    } catch (error) {
      console.error('Error updating VIP plan status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const loadGames = async () => {
    const currentBookingCode =
      bookingCodes[selectedCategory] ||
      loadedGames[selectedCategory]?.[0]?.sportyCode ||
      '';
    if (!currentBookingCode.trim()) return;
    
    try {
      const response = await fetch(`https://a1-tips-backend-main.onrender.com/games/load-booking/${currentBookingCode}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load booking: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform the API response games to match the expected format
      const formattedGames = data.games.map((game, index) => ({
        id: `${selectedCategory}_${Date.now()}_${index}`, // Unique ID with category, timestamp, and index
        match: `${game.home} vs ${game.away}`,
        type: game.prediction,
        odds: game.odd
      }));
      
      // Load games only to the selected category
      setLoadedGames(prev => ({
        ...prev,
        [selectedCategory]: formattedGames
      }));
      
      // Track the booking code as one entry
      setLoadedBookings(prev => ({
        ...prev,
        [selectedCategory]: [...prev[selectedCategory], { code: currentBookingCode, games: formattedGames }]
      }));
      
      // Clear the booking code for this category only
      setBookingCodes(prev => ({
        ...prev,
        [selectedCategory]: ''
      }));
      
    } catch (error) {
      console.error('Error loading games:', error);
      alert(`Failed to load games for booking code ${currentBookingCode}. Please check the code and try again.`);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const removeGame = (category: string, gameId: number) => {
    setLoadedGames(prev => ({
      ...prev,
      [category]: prev[category].filter((game: any) => game.id !== gameId)
    }));
  };

  const clearAllGames = () => {
    setLoadedGames({
      Slips: [],
      Free: [],
      VIP1: [],
      VIP2: [],
      VIP3: []
    });
    setLoadedBookings({
      Slips: [],
      Free: [],
      VIP1: [],
      VIP2: [],
      VIP3: []
    });
  };

  const handleAddBooking = () => {
    setSelectedGame({ category: selectedCategory, games: loadedGames[selectedCategory] });
    // Pre-populate with existing codes if they exist
    setSportyCode(loadedGames[selectedCategory]?.[0]?.sportyCode || '');
    setShowBookingModal(true);
  };

  const handleAttachBooking = () => {
    if (sportyCode.trim()) {
      // Save booking codes to the games in the category
      const updatedGames = loadedGames[selectedCategory].map(game => ({
        ...game,
        sportyCode: sportyCode.trim()
      }));
      
      setLoadedGames(prev => ({
        ...prev,
        [selectedCategory]: updatedGames
      }));
      
    } else {
      // Show validation message if fields are empty
      alert('Please fill in SportyBet code before attaching.');
      return;
    }
    
    // Always close the modal after processing (success or validation)
      setShowBookingModal(false);
      setSelectedGame(null);
      setSportyCode('');
  };

  const handleCancelBooking = () => {
    setShowBookingModal(false);
    setSelectedGame(null);
    setSportyCode('');
  };

  const handleSetPrice = () => {
    setSelectedGame({ category: selectedCategory, games: loadedGames[selectedCategory] });
    // Pre-populate with existing price if it exists
    setGamePrice(categoryPrices[selectedCategory] || '');
    setShowPriceModal(true);
  };

  const handleSavePrice = () => {
    if (gamePrice.trim()) {
      // Save price to the specific category only
      setCategoryPrices(prev => ({
        ...prev,
        [selectedCategory]: gamePrice.trim()
      }));
      
      
      setShowPriceModal(false);
      setSelectedGame(null);
      setGamePrice('');
    } else {
    }
  };

  const handleCancelPrice = () => {
    setShowPriceModal(false);
    setSelectedGame(null);
    setGamePrice('');
  };

  const handleUpload = async () => {
    try {
      const categoryPrice = categoryPrices[selectedCategory] || '';
      const currentBooking = loadedBookings[selectedCategory]?.[loadedBookings[selectedCategory].length - 1];
      
      if (!currentBooking) {
        alert('No booking data found for this category. Please load games first.');
        return;
      }

      // Transform games to match API format
      const transformedGames = loadedGames[selectedCategory].map(game => {
        // Extract home and away teams from the match string
        const [home, away] = game.match.split(' vs ');
        
        return {
          home: home,
          away: away,
          prediction: game.type,
          odd: game.odds,
          sport: "Football", // Default to Football
          tournament: "Unknown", // Default tournament
          match_status: "pending"
        };
      });

      const requestBody = {
        deadline: currentBooking.deadline || new Date().toISOString(),
        shareCode: loadedGames[selectedCategory]?.[0]?.sportyCode || sportyCode || '',
        shareURL: currentBooking.shareURL || '',
        category: selectedCategory,
        price: categoryPrice,
        games: transformedGames
      };

      const response = await fetch('https://a1-tips-backend-main.onrender.com/games/upload-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to upload booking: ${response.statusText}`);
      }

      const responseData = await response.json();

      // Clear current category games and bookings on success
      setLoadedGames(prev => ({
        ...prev,
        [selectedCategory]: []
      }));
      
      setLoadedBookings(prev => ({
        ...prev,
        [selectedCategory]: []
      }));

      alert(`Games successfully uploaded to ${selectedCategory} category!`);
      
    } catch (error) {
      console.error('Error uploading games:', error);
      alert(`Failed to upload games: ${error.message}. Please try again.`);
    }
  };

  const isSameGame = (game, target) =>
    game.booking_id === target.booking_id &&
    String(game.id) === String(target.id);

  const handleEditGame = (game, slipId = null) => {
    setEditingGame(game);
    setGameResult(game.match_status || 'Pending');       
    setShowEditModal(true);
  };

  const handleSaveResult = async (result) => {
    if (result && editingGame) {
      
      // Update only the selected game in Slips
      setLoadedGames(prev => {
        const updatedSlips = prev.Slips.map(game => {
          if (isSameGame(game, editingGame)) {
            return { ...game, match_status: result };
          }
          return game;
        });
        
        return {
        ...prev,
          Slips: updatedSlips
        };
      });
      
      // Send update to backend
      try {
        const bookingId = editingGame.booking_id;
        if (!bookingId) {
          throw new Error('No booking ID found for this game');
        }

        // Get all games for this booking only
        const bookingGames = loadedGames.Slips.filter(
          game => game.booking_id === bookingId
        );
        
        // Send each game's status; only the edited game gets the new result
        const gamesPayload = bookingGames.map(game => ({
          id: game.originalId ?? game.id,
          status: isSameGame(game, editingGame) ? result : game.match_status
        }));

        const payload = {
          games: gamesPayload
        };


        const response = await fetch(`https://a1-tips-backend-main.onrender.com/games/update-games-status/${bookingId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Failed to update game status: ${response.statusText}`);
        }

        const responseData = await response.json();

        // Only close modal and reset state on successful API call
      setShowEditModal(false);
      setEditingGame(null);
      setGameResult('');
        
      } catch (error) {
        console.error('Error updating game status on backend:', error);
        alert('Failed to save game result to backend. Please try again.');
        // Don't close modal on error - user can retry
      }
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingGame(null);
    setGameResult('');
  };

  const handleSlipSelection = (slipId) => {
    setSelectedSlips(prev => 
      prev.includes(slipId) 
        ? prev.filter(id => id !== slipId)
        : [...prev, slipId]
    );
  };

  const handleSelectAllSlips = () => {
    const allSlipIds = groupGamesIntoSlips().map(slip => slip.id);
    setSelectedSlips(allSlipIds);
  };

  const handleClearSlipSelection = () => {
    setSelectedSlips([]);
  };

  const handleToggleSlipExpansion = (slipId) => {
    setExpandedSlips(prev => 
      prev.includes(slipId) 
        ? prev.filter(id => id !== slipId)
        : [...prev, slipId]
    );
  };

  const handleDeleteSelectedSlips = async () => {
    if (selectedSlips.length === 0) return;

    try {
      // Get selected slips and collect unique booking IDs
      const slips = groupGamesIntoSlips();
      const selectedSlipSet = new Set(selectedSlips);
      const selectedSlipsData = slips.filter((slip) => selectedSlipSet.has(slip.id));
      
      // Collect unique booking IDs from selected slips' games
      const bookingIdsToDelete = new Set();
      selectedSlipsData.forEach((slip) => {
        slip.games.forEach((game) => {
          if (game.booking_id) {
            bookingIdsToDelete.add(game.booking_id);
          }
        });
      });


      // Delete each booking from backend
      const deletePromises = Array.from(bookingIdsToDelete).map(async (bookingId) => {
        const response = await fetch(`https://a1-tips-backend-main.onrender.com/games/delete-booking/${bookingId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to delete booking ${bookingId}: ${response.statusText}`);
        }

        return response.json();
      });

      // Wait for all deletions to complete
      await Promise.all(deletePromises);

      // If all API calls succeed, update local state
      const datesToDelete = new Set(selectedSlipsData.map((slip) => slip.uploadDate));
      
      setLoadedGames((prev) => ({
        ...prev,
        Slips: prev.Slips.filter((game) => !datesToDelete.has(game.uploadDate)),
      }));
      
      setSelectedSlips([]);
      
      alert(`Successfully deleted ${selectedSlips.length} slip(s) from backend and local state.`);
      
    } catch (error) {
      console.error('Error deleting slips:', error);
      alert(`Failed to delete slips: ${error.message}. Please try again.`);
      // Don't update local state if API calls fail
    }
  };

  const handleSendSMS = async () => {
    if (!smsMessage.trim()) {
      alert('Please enter a message before sending SMS');
      return;
    }

    try {
      // Encode the message for URL query parameter
      const encodedMessage = encodeURIComponent(smsMessage.trim());
      const endpoint = `https://a1-tips-backend-main.onrender.com/sms/send_bulk?message=${encodedMessage}`;


      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      // Check if the API response indicates success
      if (responseData.status === 'success') {
        alert(`${responseData.message} to ${smsRecipients === 'all' ? 'all users' : 'custom numbers'}!`);
        // Clear the message after successful sending
        setSmsMessage('');
      } else {
        // Handle API error response
        const errorMessage = responseData.message || 'Failed to send SMS';
        alert(`Error: ${errorMessage}`);
        console.error('SMS API error:', responseData);
      }

    } catch (error) {
      console.error('Error sending SMS:', error);
      alert('Failed to send SMS. Please check your connection and try again.');
    }
  };

  const handleAddAdmin = () => {
    if (!newAdmin.username.trim() || !newAdmin.email.trim() || !newAdmin.password.trim()) {
      alert('Please fill in all fields');
      return;
    }

    // Check if username or email already exists
    const existingAdmin = admins.find(admin => 
      admin.username === newAdmin.username || admin.email === newAdmin.email
    );

    if (existingAdmin) {
      alert('Username or email already exists');
      return;
    }

    // Add new admin
    const adminToAdd = {
      id: admins.length + 1,
      username: newAdmin.username,
      email: newAdmin.email,
      role: newAdmin.role,
      status: 'active',
      createdDate: new Date().toISOString().split('T')[0]
    };

    setAdmins(prev => [...prev, adminToAdd]);
    
    // Save to localStorage (in real app, this would be API call)
    localStorage.setItem('admins', JSON.stringify([...admins, adminToAdd]));
    
    alert(`Admin ${newAdmin.username} added successfully with ${newAdmin.role} access!`);
    
    // Reset form and close modal
    setNewAdmin({ username: '', email: '', password: '', role: 'limited' });
    setShowAddAdminModal(false);
  };

  const handleToggleAdminStatus = (adminId: number) => {
    setAdmins(prev => prev.map(admin => 
      admin.id === adminId 
        ? { ...admin, status: admin.status === 'active' ? 'inactive' : 'active' }
        : admin
    ));
  };

  const handleChangeAdminRole = (adminId: number, newRole: string) => {
    setAdmins(prev => prev.map(admin => 
      admin.id === adminId 
        ? { ...admin, role: newRole }
        : admin
    ));
  };

  const groupGamesIntoSlips = () => {
    // Group games by upload date to create slip batches
    const slipGroups: {[key: string]: any[]} = {};
    loadedGames.Slips.forEach(game => {
      const slipKey = game.uploadDate || 'default';
      if (!slipGroups[slipKey]) {
        slipGroups[slipKey] = [];
      }
      slipGroups[slipKey].push(game);
    });
    
    const allSlips = Object.entries(slipGroups).map(([date, games], index) => ({
      id: `slip_${index + 1}`,
      slipNumber: index + 1,
      games: games,
      uploadDate: date,
      originalCategory: (games as any[])[0]?.originalCategory || 'Free',
      totalOdds: (games as any[]).reduce((total: number, game: any) => total * (game.odds || 1), 1).toFixed(2),
      sportyCode: (games as any[])[0]?.sportyCode || 'N/A',
    }));

    // Filter out archived slips
    return allSlips.filter(slip => !archivedSlips.includes(slip.id));
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const recentActivity = [
    { action: 'New user registered: john_doe', time: '2 minutes ago' },
    { action: 'VIP package sold: Daily Plan', time: '5 minutes ago' },
    { action: 'Game result updated: Team A vs Team B', time: '10 minutes ago' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-blue-900">
        <div className="max-w-7xl mx-auto py-4 md:py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-white">A1Tips Admin</h1>
              <p className="mt-1 md:mt-2 text-sm md:text-base text-blue-100">Control Panel</p>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Mobile: open sidebar */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden bg-blue-800 hover:bg-blue-700 text-white px-3 py-2 rounded-md transition-colors flex items-center"
                aria-label="Open menu"
              >
                <FaBars className="w-5 h-5" />
              </button>
              <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-2 md:px-4 py-1 md:py-2 rounded-md transition-colors flex items-center text-xs md:text-sm"
              >
                <FaSignOutAlt className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </button>
              <button 
                onClick={() => router.push('/')}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 md:px-4 py-1 md:py-2 rounded-md transition-colors flex items-center text-xs md:text-sm"
              >
                <FaHome className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Home</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <div className="hidden md:block w-64 bg-white shadow-lg min-h-screen relative">
          <nav className="mt-8">
            <div className="px-4 space-y-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FaTachometerAlt className="w-5 h-5 mr-3" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('games')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'games'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FaGamepad className="w-5 h-5 mr-3" />
                Games
              </button>
              <button
                onClick={() => setActiveTab('gamesControl')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'gamesControl'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FaGamepad className="w-5 h-5 mr-3" />
                Games Control
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'users'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FaUsers className="w-5 h-5 mr-3" />
                Users
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FaBell className="w-5 h-5 mr-3" />
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('sms')}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'sms'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                SMS
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FaCog className="w-5 h-5 mr-3" />
                Settings
              </button>
            </div>
          </nav>
          
          {/* Issue Notification */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-red-600 text-white px-3 py-2 rounded-md flex items-center justify-between text-sm">
              <span>N 1 Issue X</span>
              <button className="text-white hover:text-red-200">
                <FaTimes className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - Mobile Drawer */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setIsSidebarOpen(false)}></div>
            <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-4 border-b">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <nav className="mt-4">
                <div className="px-4 space-y-2">
                  <button
                    onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FaTachometerAlt className="w-5 h-5 mr-3" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => { setActiveTab('games'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'games' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FaGamepad className="w-5 h-5 mr-3" />
                    Games
                  </button>
                  <button
                    onClick={() => { setActiveTab('gamesControl'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'gamesControl' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FaGamepad className="w-5 h-5 mr-3" />
                    Games Control
                  </button>
                  <button
                    onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FaUsers className="w-5 h-5 mr-3" />
                    Users
                  </button>
                  <button
                    onClick={() => { setActiveTab('notifications'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'notifications' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FaBell className="w-5 h-5 mr-3" />
                    Notifications
                  </button>
                  <button
                    onClick={() => { setActiveTab('sms'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'sms' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    SMS
                  </button>
                  <button
                    onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FaCog className="w-5 h-5 mr-3" />
                    Settings
                  </button>
                </div>
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8">
          {/* Dashboard Overview */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">Dashboard Overview</h2>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm border p-3 md:p-4">
                    <div className="flex items-center">
                      <div className={`p-1.5 md:p-2 rounded-full ${stat.bgColor}`}>
                        <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
                      </div>
                      <div className="ml-2 md:ml-3">
                        <div className={`text-sm md:text-lg lg:text-xl font-bold ${stat.color}`}>
                          {stat.value}
                        </div>
                        <div className="text-xs text-gray-600">
                          {stat.title}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-4 md:px-6 py-3 md:py-4 border-b">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <div className="divide-y">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                      <span className="text-xs md:text-sm text-gray-700">{activity.action}</span>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Games Tab */}
          {activeTab === 'games' && (
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">Games Management</h2>
              
              {/* Filter Games by Category */}
              <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Filter Games by Category</h3>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  <button 
                    onClick={() => {
                      setSelectedCategory('Slips');
                    }}
                    className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                      selectedCategory === 'Slips' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-800 text-white hover:bg-gray-900'
                    }`}
                  >
                    Slips ({groupGamesIntoSlips().length})
                  </button>
                  <button 
                    onClick={() => setSelectedCategory('Free')}
                    className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                      selectedCategory === 'Free' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-800 text-white hover:bg-gray-900'
                    }`}
                  >
                    Free ({loadedBookings.Free.length})
                  </button>
                  <button 
                    onClick={() => setSelectedCategory('VIP1')}
                    className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                      selectedCategory === 'VIP1' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-800 text-white hover:bg-gray-900'
                    }`}
                  >
                    VIP1 ({loadedBookings.VIP1.length})
                  </button>
                  <button 
                    onClick={() => setSelectedCategory('VIP2')}
                    className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                      selectedCategory === 'VIP2' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-800 text-white hover:bg-gray-900'
                    }`}
                  >
                    VIP2 ({loadedBookings.VIP2.length})
                  </button>
                  <button 
                    onClick={() => setSelectedCategory('VIP3')}
                    className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                      selectedCategory === 'VIP3' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-800 text-white hover:bg-gray-900'
                    }`}
                  >
                    VIP3 ({loadedBookings.VIP3.length})
                  </button>
                </div>
              </div>

              {/* Load Games Section - Only show if no games loaded for this category and not Slips */}
              {loadedGames[selectedCategory].length === 0 && selectedCategory !== 'Slips' && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Load Games - {selectedCategory}</h3>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={bookingCodes[selectedCategory] || loadedGames[selectedCategory]?.[0]?.sportyCode || ''}
                      onChange={(e) => setBookingCodes(prev => ({
                        ...prev,
                        [selectedCategory]: e.target.value
                      }))}
                      placeholder={`Enter SportyBet booking code for ${selectedCategory}...`}
                      className="flex-1 px-4 py-2 border-2 border-green-500 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <button 
                      onClick={loadGames}
                      disabled={!bookingCodes[selectedCategory]?.trim() && !loadedGames[selectedCategory]?.[0]?.sportyCode}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                    >
                      Load
                    </button>
                  </div>
                </div>
              )}

              {/* Show Saved Booking Codes and Prices */}
              {selectedCategory !== 'Slips' && loadedGames[selectedCategory] && loadedGames[selectedCategory].length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Saved Information for {selectedCategory}</h4>
                  
                  {/* Saved Booking Codes */}
                  {loadedGames[selectedCategory][0]?.sportyCode && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="text-sm text-blue-800 font-medium mb-1">Saved Booking Codes:</div>
                      <div className="text-sm text-blue-700">
                        <div>SportyBet: {loadedGames[selectedCategory][0].sportyCode}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Saved Price */}
                  {categoryPrices[selectedCategory] && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="text-sm text-green-800 font-medium mb-1">Saved Price:</div>
                      <div className="text-sm text-green-700">
                        ${categoryPrices[selectedCategory]}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Empty Slips Message */}
              {selectedCategory === 'Slips' && loadedGames.Slips.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="text-center py-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Uploaded Slips</h3>
                    <p className="text-gray-600">Uploaded games from Free, VIP1, VIP2, and VIP3 categories will appear here.</p>
                  </div>
                </div>
              )}

              {/* Loaded Games Display */}
              {loadedGames[selectedCategory].length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  {selectedCategory === 'Slips' ? (
                    // Slips Display - Card Layout
                    <>
                      {/* Header */}
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">
                          Uploaded Slips ({groupGamesIntoSlips().length})
                        </h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSelectAllSlips}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium"
                          >
                            Select All
                          </button>
                          <button
                            onClick={handleClearSlipSelection}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm font-medium"
                          >
                            Clear Selection
                          </button>
                          <button
                            onClick={handleDeleteSelectedSlips}
                            disabled={selectedSlips.length === 0}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                          >
                            Delete Selected ({selectedSlips.length})
                          </button>
                        </div>
                      </div>

                      {/* Slip Cards */}
                      <div className="space-y-4">
                        {groupGamesIntoSlips().map((slip) => (
                          <div key={slip.id} className="bg-white border border-gray-200 rounded-lg p-4">
                            {/* Slip Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={selectedSlips.includes(slip.id)}
                                  onChange={() => handleSlipSelection(slip.id)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <h4 className="text-lg font-bold text-gray-900">
                                  Slip({slip.slipNumber}) - {slip.originalCategory} Predictions
                                </h4>
                                <button
                                  onClick={() => handleToggleSlipExpansion(slip.id)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <svg className={`w-4 h-4 transform transition-transform ${expandedSlips.includes(slip.id) ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Slip Summary */}
                            <div className="mb-4 text-sm text-gray-600">
                              <p>{slip.games.length} games • Total Odds: {slip.totalOdds} • {new Date(slip.uploadDate).toLocaleDateString()}, {new Date(slip.uploadDate).toLocaleTimeString()}</p>
                              <p>SportyBet: {slip.sportyCode}</p>
                            </div>

                            {/* Individual Games */}
                            {expandedSlips.includes(slip.id) && (
                              <div className="space-y-2">
                                {slip.games.map((game) => (
                                  <div key={`${game.id}-${game.match_status}`} className={`bg-white rounded border p-2 ${
                                    showEditModal && editingGame && editingGame.id === game.id 
                                      ? 'border-blue-500 bg-blue-50' 
                                      : 'border-gray-200'
                                  }`}>
                                    {/* Game Header */}
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex-1">
                                        <div className="flex items-center">
                                          <div className="text-sm font-medium text-gray-900">{game.match}</div>
                                          {/* Result Status Icon */}
                                          <div className="ml-1">
                                            {game.match_status === 'Won' && (
                                              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center ml-2">
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                              </div>
                                            )}
                                            {game.match_status === 'Lost' && (
                                              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center ml-2">
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                              </div>
                                            )}
                                            {(game.match_status === 'Pending' || game.match_status === 'pending') && (
                                              <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center ml-2">
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                                </svg>
                                              </div>
                                            )}
                                            {(!game.match_status || game.match_status === '') && (
                                              <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center ml-2">
                                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                                </svg>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          <div>{game.type === '1X2' ? 'Home' : game.type}</div>
                                          <div>{new Date(game.uploadDate).toLocaleDateString()}</div>
                                          <div>1X2</div>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-900">{game.odds}</span>
                                        <button
                                          onClick={() => handleEditGame(game, slip.id)}
                                          className={`px-2 py-1 rounded text-xs text-white ${
                                            showEditModal && editingGame && editingGame.id === game.id
                                              ? 'bg-green-600 hover:bg-green-700'
                                              : 'bg-blue-600 hover:bg-blue-700'
                                          }`}
                                        >
                                          {showEditModal && editingGame && editingGame.id === game.id ? 'Editing...' : 'Edit'}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Edit Result Section - Shows when editing this game */}
                                    {showEditModal && editingGame && editingGame.id === game.id && (
                                      <div className="border-t border-gray-200 pt-2 mt-2">
                                        <div className="flex items-center justify-between">
                                          <div className="text-xs font-medium text-gray-700">
                                            Update Result for: {game.match}
                                          </div>
                                          
                                          {/* Result Action Buttons */}
                                          <div className="flex gap-1">
                                            {/* Won Button */}
                                            <button
                                              onClick={() => handleSaveResult('Won')}
                                              className="flex items-center justify-center px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-bold h-6"
                                            >
                                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                              </svg>
                                              <span className="text-xs font-bold">Won</span>
                                            </button>

                                            {/* Lost Button */}
                                            <button
                                              onClick={() => handleSaveResult('Lost')}
                                              className="flex items-center justify-center px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-bold h-6"
                                            >
                                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                              </svg>
                                              <span className="text-xs font-bold">Lost</span>
                                            </button>

                                            {/* Pending Button */}
                                            <button
                                              onClick={() => handleSaveResult('Pending')}
                                              className="flex items-center justify-center px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-bold h-6"
                                            >
                                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                              </svg>
                                              <span className="text-xs font-bold">Pending</span>
                                            </button>

                                            {/* Cancel Button */}
                                            <button
                                              onClick={handleCancelEdit}
                                              className="flex items-center justify-center px-2 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded text-xs font-bold h-6"
                                            >
                                              <span className="text-xs font-bold">Cancel</span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    // Other Categories Display
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Loaded Games from SportyBet</h3>
                        <button
                          onClick={() => setLoadedGames(prev => ({ ...prev, [selectedCategory]: [] }))}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Clear All
                        </button>
                      </div>
                      
                      <div className="mb-4">
                        <span className="text-sm text-gray-600">Booking Code: {loadedBookings[selectedCategory].length > 0 ? loadedBookings[selectedCategory][loadedBookings[selectedCategory].length - 1].code : 'hjkk'}</span>
                      </div>
                      
                      <div className="space-y-0">
                        {loadedGames[selectedCategory].map((game: any, index: number) => (
                          <div key={game.id} className="py-3 border-b border-gray-200 last:border-b-0">
                            <div className="flex items-start">
                              <button 
                                onClick={() => removeGame(selectedCategory, game.id)}
                                className="text-gray-600 hover:text-red-600 mr-3 mt-1"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <div className="flex-1">
                                <div className="text-gray-400 text-sm mb-1">Home</div>
                                <div className="text-gray-900 font-semibold mb-1">{game.match}</div>
                                <div className="text-gray-500 text-sm">{game.type}</div>
                              </div>
                              <div className="text-right mt-1">
                                <span className="text-gray-900">{game.odds}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {/* Only show buttons section for non-Slips categories */}
                  {selectedCategory !== 'Slips' && (
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-600">
                      {loadedGames[selectedCategory].length} selections loaded
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        Total Odds: {loadedGames[selectedCategory].reduce((total: number, game: any) => total * game.odds, 1).toFixed(2)}
                      </span>
                      <div className="flex space-x-3 mt-2 relative">
                        <button 
                          onClick={handleAddBooking}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Add Booking
                        </button>
                        
                        <button 
                          onClick={handleSetPrice}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Set Price
                        </button>
                        
                        <button 
                          onClick={handleUpload}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Upload
                        </button>
                        
                        {/* Attach Booking Modal - Positioned above the button */}
                        {showBookingModal && selectedGame?.category === selectedCategory && (
                          <div className="absolute bottom-full right-0 mb-2 z-50">
                            <div className="bg-white rounded-lg p-4 w-80 shadow-lg border border-gray-200">
                              {/* Header */}
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-base font-bold text-gray-900">Attach Booking</h3>
                                <button
                                  onClick={handleCancelBooking}
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <FaTimes className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Form */}
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    SportyBet Code
                                  </label>
                                  <input
                                    type="text"
                                    value={sportyCode}
                                    onChange={(e) => setSportyCode(e.target.value)}
                                    placeholder="e.g. abcd"
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                                
                              </div>

                              {/* Buttons */}
                              <div className="flex justify-end space-x-2 mt-4">
                                <button
                                  onClick={handleCancelBooking}
                                  className="px-3 py-1.5 text-xs text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-md font-medium transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleAttachBooking}
                                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
                                >
                                  Attach
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Set Price Modal - Positioned above the button */}
                        {showPriceModal && (
                          <div className="absolute bottom-full right-0 mb-2 z-50">
                            <div className="bg-white rounded-lg p-4 w-80 shadow-lg border border-gray-200">
                              {/* Header */}
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-base font-bold text-gray-900">Set Price</h3>
                                <button
                                  onClick={handleCancelPrice}
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <FaTimes className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Form */}
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Game Price
                                  </label>
                                  <input
                                    type="text"
                                    value={gamePrice}
                                    onChange={(e) => setGamePrice(e.target.value)}
                                    placeholder="e.g. GHS 20"
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                                  />
                                </div>
                              </div>

                              {/* Buttons */}
                              <div className="flex justify-end space-x-2 mt-4">
                                <button
                                  onClick={handleCancelPrice}
                                  className="px-3 py-1.5 text-xs text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-md font-medium transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleSavePrice}
                                  className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors"
                                >
                                  Save Price
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'gamesControl' && (
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">VIP Games Control</h2>
              
              {/* VIP Plan Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {vipPlans.map((plan) => (
                  <div key={plan.id} className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
                    <div className="text-center">
                      <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2 md:mb-3">{plan.name}</h3>
                      
                      {/* Status Badge */}
                      <div className="mb-2 md:mb-3">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium text-white ${
                            plan.status === 'Available'
                              ? 'bg-green-600'
                              : 'bg-orange-600'
                          }`}
                        >
                          {plan.status}
                        </span>
                      </div>
                      
                      {/* Toggle Button */}
                      <button
                        onClick={() => toggleVipPlanStatus(plan.id)}
                        className={`w-full py-2 px-3 rounded-lg text-xs md:text-sm font-medium text-white transition-colors ${
                          plan.status === 'Available'
                            ? 'bg-orange-600 hover:bg-orange-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {plan.status === 'Available' ? 'Sold Out' : 'Available'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">User Management</h2>
              
              {/* User Table - Mobile Responsive */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          USER
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          EMAIL
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          PHONE
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          STATUS
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ACTIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoadingUsers ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                              Loading users...
                            </div>
                          </td>
                        </tr>
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                                    <span className="text-sm font-medium text-white">
                                      {getInitials(user.username)}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.username}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    @{user.username}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {user.phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button className="text-blue-600 hover:text-blue-900 p-1" title="Edit user">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </button>
                                <button className="text-red-600 hover:text-red-900 p-1" title="Delete user">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden">
                  {isLoadingUsers ? (
                    <div className="p-6 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                        Loading users...
                      </div>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No users found
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <div key={user.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                                  <span className="text-sm font-medium text-white">
                                    {getInitials(user.username)}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.username}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {user.email}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {user.phone}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.status}
                              </span>
                              <div className="flex items-center space-x-2">
                                <button className="text-blue-600 hover:text-blue-900 p-1" title="Edit user">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </button>
                                <button className="text-red-600 hover:text-red-900 p-1" title="Delete user">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Notifications</h2>
              <p className="text-gray-600">Notifications interface will go here.</p>
            </div>
          )}

          {activeTab === 'sms' && (
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">SMS Broadcasting</h2>
              
              {/* Send SMS Card */}
              <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-6">Send SMS</h3>
                
                {/* Recipients Section */}
                <div className="mb-4 md:mb-6">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">
                    Recipients
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="recipients"
                        value="all"
                        checked={smsRecipients === 'all'}
                        onChange={(e) => setSmsRecipients(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3 text-xs md:text-sm text-gray-700">
                        All Users (1,234 recipients)
                      </span>
                    </label>
                    {/* <label className="flex items-center">
                      <input
                        type="radio"
                        name="recipients"
                        value="custom"
                        checked={smsRecipients === 'custom'}
                        onChange={(e) => setSmsRecipients(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        Custom Numbers
                      </span>
                    </label> */}
                  </div>
                </div>

                {/* Message Section */}
                <div className="mb-4 md:mb-6">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">
                    Message
                  </label>
                  <textarea
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y text-sm md:text-base"
                  />
                </div>

                {/* Send SMS Button */}
                <button 
                  onClick={handleSendSMS}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Send SMS
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4 md:space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg md:text-2xl font-bold text-gray-900">Settings & Admin Management</h2>
                <button 
                  onClick={() => setShowAddAdminModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 md:px-4 py-1 md:py-2 rounded-md transition-colors flex items-center text-xs md:text-sm"
                >
                  <svg className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span className="hidden sm:inline">Add New Admin</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
              
              {/* Current Admins Table */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-blue-50">
                  <h3 className="text-base md:text-lg font-semibold text-blue-900">Current Admins</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                          ADMIN
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                          ROLE
                        </th>
                        <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                          LAST ACTIVE
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                          STATUS
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-blue-25 divide-y divide-gray-200">
                      {admins.map((admin) => (
                        <tr key={admin.id}>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10">
                                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-blue-600 flex items-center justify-center">
                                  <span className="text-xs md:text-sm font-medium text-white">
                                    {getInitials(admin.username)}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-3 md:ml-4">
                                <div className="text-xs md:text-sm font-medium text-gray-900">
                                  {admin.username}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {admin.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                            <select
                              value={admin.role}
                              onChange={(e) => handleChangeAdminRole(admin.id, e.target.value)}
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                                admin.role === 'full' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              <option value="limited">Limited</option>
                              <option value="full">Full Access</option>
                            </select>
                          </td>
                          <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {admin.createdDate}
                          </td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleAdminStatus(admin.id)}
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                                admin.status === 'active' 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                              }`}
                            >
                              {admin.status}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Add New Admin Modal */}
              {showAddAdminModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Add New Admin</h3>
                      <button
                        onClick={() => setShowAddAdminModal(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <FaTimes className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Username
                        </label>
                        <input
                          type="text"
                          value={newAdmin.username}
                          onChange={(e) => setNewAdmin(prev => ({ ...prev, username: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter username"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={newAdmin.email}
                          onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter email"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          value={newAdmin.password}
                          onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter password"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Role
                        </label>
                        <select
                          value={newAdmin.role}
                          onChange={(e) => setNewAdmin(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="limited">Limited Access</option>
                          <option value="full">Full Access</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Limited: Can manage games and users. Full: Can manage everything including other admins.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={() => setShowAddAdminModal(false)}
                        className="px-4 py-2 text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddAdmin}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                      >
                        Add Admin
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
