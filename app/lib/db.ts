import { createClient } from '@supabase/supabase-js';

// ── Supabase Configuration ───────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

if (typeof window !== 'undefined') {
  if (!supabaseUrl) console.warn('⚠️ Supabase: NEXT_PUBLIC_SUPABASE_URL is missing.');
  if (!supabaseAnonKey) console.warn('⚠️ Supabase: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing.');
  if (supabaseAnonKey && !supabaseAnonKey.startsWith('ey')) {
    console.warn('⚠️ Supabase: The Anon Key looks invalid (expected a JWT starting with "ey").');
  }
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ── Database Schema (SQL) ────────────────────────────────────────────
/*
  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    wallet_address TEXT UNIQUE NOT NULL,
    private_key TEXT NOT NULL, -- Encrypted in production
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    drop_id TEXT NOT NULL,
    tx_signature TEXT UNIQUE NOT NULL,
    escrow_pda TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, delivered, cancelled
    amount_sol DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
*/

// ── Admin Authentication ────────────────────────────────────────────

export async function loginAdmin(identifier: string, passwordHash: string) {
  if (supabase) {
    // Check by email or username
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .or(`email.eq.${identifier},username.eq.${identifier}`)
      .eq('password_hash', passwordHash)
      .maybeSingle();
    
    if (error) {
      console.error('Admin Auth Error:', error.message);
      return null;
    }
    return data;
  }

  // Fallback: Local simulation for dev
  if (identifier === 'zipp' || identifier === 'marvel' || identifier.includes('@')) {
    return { username: identifier, email: identifier };
  }
  return null;
}

// ── Helper Functions (Simulation Fallback) ───────────────────────────

export async function saveUserMapping(email: string, walletAddress: string, privateKey: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .upsert({ email, wallet_address: walletAddress, private_key: privateKey }, { onConflict: 'email' })
      .select();
    
    if (error) {
      console.error('Supabase Mapping Error:', JSON.stringify(error, null, 2));
    }
    return data;
  }

  // Fallback: Local Storage
  const mappings = JSON.parse(localStorage.getItem('circuit_users') || '{}');
  mappings[email] = { walletAddress, privateKey };
  localStorage.setItem('circuit_users', JSON.stringify(mappings));
  return { email, walletAddress };
}

export async function getUserMapping(email: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (!error) return data;
  }

  // Fallback: Local Storage
  if (typeof window !== 'undefined') {
    const mappings = JSON.parse(localStorage.getItem('circuit_users') || '{}');
    return mappings[email] || null;
  }
  return null;
}

// ── Order Management ────────────────────────────────────────────────

export async function saveOrder(orderData: {
  email: string;
  drop_id: string;
  tx_signature: string;
  escrow_pda: string;
  amount_sol: number;
  size?: string;
  quantity?: number;
}) {
  if (supabase) {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData]);
    
    if (error) {
      console.error('Supabase Order Error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    }
    return data;
  }

  // Fallback: Local Storage
  if (typeof window !== 'undefined') {
    const orders = JSON.parse(localStorage.getItem('circuit_orders') || '[]');
    const newOrder = { ...orderData, status: 'pending', created_at: new Date().toISOString() };
    orders.push(newOrder);
    localStorage.setItem('circuit_orders', JSON.stringify(orders));
    return newOrder;
  }
}

export async function updateOrderStatus(txSignature: string, status: 'delivered' | 'cancelled') {
  if (supabase) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('tx_signature', txSignature);
    
    if (error) console.error('Supabase Update Error:', error);
    return data;
  }

  // Fallback: Local Storage
  if (typeof window !== 'undefined') {
    const orders = JSON.parse(localStorage.getItem('circuit_orders') || '[]');
    const updatedOrders = orders.map((o: any) => 
      o.tx_signature === txSignature ? { ...o, status } : o
    );
    localStorage.setItem('circuit_orders', JSON.stringify(updatedOrders));
  }
}

export async function updateOrderDelivery(email: string, location: string, address: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from('orders')
      .update({ delivery_location: location, delivery_address: address })
      .eq('email', email)
      .eq('status', 'pending');
    
    if (error) console.error('Supabase Update Delivery Error:', error);
    return data;
  }

  // Fallback: Local Storage
  if (typeof window !== 'undefined') {
    const orders = JSON.parse(localStorage.getItem('circuit_orders') || '[]');
    const updatedOrders = orders.map((o: any) => 
      o.email === email && o.status === 'pending' ? { ...o, delivery_location: location, delivery_address: address } : o
    );
    localStorage.setItem('circuit_orders', JSON.stringify(updatedOrders));
  }
}

export async function getUserOrders(email: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });
    
    if (!error) return data;
  }

  // Fallback: Local Storage
  if (typeof window !== 'undefined') {
    const orders = JSON.parse(localStorage.getItem('circuit_orders') || '[]');
    return orders.filter((o: any) => o.email === email);
  }
  return [];
}
