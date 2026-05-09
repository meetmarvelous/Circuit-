const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res  = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const body = await res.json() as Record<string, unknown>;
  if (!res.ok) {
    const err = Object.assign(
      new Error((body['message'] ?? body['error'] ?? 'Backend error') as string),
      body
    );
    throw err;
  }
  return body as T;
}

export function createWallet(userId: string) {
  return request<{ publicKey: string; created: boolean }>('/api/wallet/create', {
    method: 'POST',
    body:   JSON.stringify({ userId }),
  });
}

export function getWallet(userId: string) {
  return request<{ publicKey: string }>(`/api/wallet/${encodeURIComponent(userId)}`);
}

export function confirmOrder(userId: string, dropId: string, amountSol: number) {
  return request<{ signature: string; escrowPDA: string; buyer: string; amountSol: number }>(
    '/api/orders/confirm',
    {
      method: 'POST',
      body:   JSON.stringify({ userId, dropId, amountSol }),
    }
  );
}

export function registerOrder(userId: string, dropId: string) {
  return request<{ signature: string }>('/api/orders/register', {
    method: 'POST',
    body:   JSON.stringify({ userId, dropId }),
  });
}

export function deliverOrder(userId: string, dropId: string) {
  return request<{ signature: string; fundsReleased: number; designer: string }>(
    '/api/orders/delivery',
    {
      method: 'POST',
      body:   JSON.stringify({ userId, dropId }),
    }
  );
}
