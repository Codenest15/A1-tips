const API_BASE = 'https://a1-tips-backend-main.onrender.com';

type VerifyPaymentResult = {
  status?: string;
  message?: string;
  detail?: string;
};

export function getPaymentUserEmail(): string {
  const storedEmail = localStorage.getItem('email')?.trim();
  if (storedEmail) {
    return storedEmail;
  }

  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData) as { email?: string };
      const userEmail = parsed.email?.trim();
      if (userEmail) {
        return userEmail;
      }
    }
  } catch {
    // Ignore invalid user JSON in localStorage.
  }

  return '';
}

export async function verifyAndRecordPurchase(
  reference: string,
  email: string,
  bookingId: string
): Promise<VerifyPaymentResult> {
  const response = await fetch(`${API_BASE}/payment/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reference,
      email: email.trim(),
      booking_id: bookingId,
    }),
  });

  let data: VerifyPaymentResult = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const message =
      data.detail ||
      data.message ||
      `Server error while saving purchase (${response.status})`;
    throw new Error(message);
  }

  if (data.status !== 'success') {
    throw new Error(data.message || 'Payment could not be saved to your account');
  }

  return data;
}
