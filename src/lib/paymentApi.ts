/** Email for /payment/verify only — reads fresh from login storage. */
export function getAccountEmailForVerify(): string {
  const storedEmail = localStorage.getItem('email')?.trim();
  if (storedEmail) {
    return storedEmail;
  }

  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData) as { email?: string };
      return parsed.email?.trim() || '';
    }
  } catch {
    // ignore invalid JSON
  }

  return '';
}

export async function parseVerifyResponse(response: Response) {
  let data: { status?: string; message?: string; detail?: string } = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.detail || data.message || `Verification failed: ${response.status}`
    );
  }

  if (data.status !== 'success') {
    throw new Error(data.message || 'Payment was verified but not saved');
  }

  return data;
}
