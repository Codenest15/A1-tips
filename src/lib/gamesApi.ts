const API_BASE = 'https://a1-tips-backend-main.onrender.com';

type BookingRow = {
  booking: {
    id: number;
    category: string;
    price: string;
    share_code: string;
    share_url?: string;
    deadline?: string;
    updated?: boolean;
    created_at: string;
    sold_out?: boolean;
  };
  games: Array<Record<string, unknown>>;
};

function recentCutoffDate(): Date {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 1);
  cutoff.setHours(0, 0, 0, 0);
  return cutoff;
}

function mapBookingRow(row: BookingRow) {
  return {
    category: row.booking.category,
    id: row.booking.id,
    price: row.booking.price,
    booking_code: row.booking.share_code,
    updated: row.booking.updated ?? false,
    deadline: row.booking.deadline ?? null,
    share_url: row.booking.share_url ?? '',
    games: row.games,
  };
}

async function fetchAllBookings(): Promise<BookingRow[]> {
  const response = await fetch(`${API_BASE}/games/all-bookings`);
  if (!response.ok) {
    throw new Error('Failed to fetch bookings');
  }
  return response.json();
}

export async function fetchVipForToday() {
  const response = await fetch(`${API_BASE}/games/vip-for-today`);
  if (!response.ok) {
    throw new Error('Failed to fetch VIP packages');
  }

  const data = await response.json();
  if (Array.isArray(data) && data.length > 0) {
    return data;
  }

  const cutoff = recentCutoffDate();
  const allBookings = await fetchAllBookings();
  return allBookings
    .filter((row) => {
      const category = row.booking.category?.toUpperCase() ?? '';
      if (!category.includes('VIP')) return false;
      return new Date(row.booking.created_at) >= cutoff;
    })
    .map(mapBookingRow);
}
