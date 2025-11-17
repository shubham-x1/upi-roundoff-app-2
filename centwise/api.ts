// src/api.ts
const API_BASE = 'http://10.0.2.2:3002'; // Android emulator. Use 'http://localhost:3002' for iOS simulator or 'http://<YOUR_LAN_IP>:3002' for a real device.

async function fetchJson(url: string, options?: RequestInit) {
  const resp = await fetch(url, options);
  const json = await resp.json();
  if (!resp.ok) throw new Error(json.error || 'API error');
  return json;
}

export const backend = {
  getTransactions: (userId: string) =>
    fetchJson(`${API_BASE}/api/transactions?userId=${encodeURIComponent(userId)}`),

  makePayment: (userId: string, upiId: string, amount: number) =>
    fetchJson(`${API_BASE}/api/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, upiId, amount }),
    }),

  getUser: (userId: string) =>
    fetchJson(`${API_BASE}/api/user/${encodeURIComponent(userId)}`),

  withdrawSavings: (userId: string) =>
    fetchJson(`${API_BASE}/api/withdraw-savings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }),

  createUser: (uid: string, displayName: string, email?: string, initialBalance?: number) =>
    fetchJson(`${API_BASE}/api/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, displayName, email, initialBalance }),
    }),
};
