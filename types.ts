
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  AGENT = 'agent'
}

export enum ClientSegment {
  VIP = 'VIP',
  RETURNING = 'RETURNING',
  HIGH_VALUE = 'HIGH_VALUE',
  HIGH_RISK = 'HIGH_RISK',
  NEW = 'NEW'
}

export interface User {
  username: string;
  password?: string;
  role: string;
  name: string;
  commissionvalue: number;
  commissiontype: string;
}

export interface Client {
  id?: string;
  client: string;
  phone: string;
  city: string;
  address: string;
  items: string;
  qty: number;
  price: number;
  statuses: string;
  note: string;
  date: string;
}

export interface Product {
  productid: string;
  productname: string;
  sku: string;
  price: number;
  description: string;
}

export interface Campaign {
  campaignid: string;
  name: string;
  date: string;
  audience: string;
  template: string;
  mediaurl?: string;
  sent: number;
  failed: number;
  opened: number;
  replied: number;
  status: string;
  sender?: string; // New: Tracks which WhatsApp account sent the campaign
}

export interface KeyRecord {
  key: string;
  value: string;
}
