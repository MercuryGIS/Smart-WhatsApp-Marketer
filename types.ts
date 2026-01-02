
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
  audience: string;      // New: Targeted group
  template: string;      // New: Strategy used
  mediaurl?: string;     // New: Attached media
  sent: number;
  opened: number;
  replied: number;
  status: string;
}

export interface KeyRecord {
  key: string;
  value: string;
}
