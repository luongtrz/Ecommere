export interface ShippingProvider {
  getName(): string;
  calculateFee(origin: Address, destination: Address, weight: number): Promise<ShippingFee>;
  createShipment(orderId: string, details: ShipmentDetails): Promise<ShipmentResult>;
  trackShipment(trackingNumber: string): Promise<TrackingInfo>;
}

export interface Address {
  province: string;
  district: string;
  ward: string;
  line1: string;
  line2?: string;
}

export interface ShippingFee {
  fee: number;
  estimatedDays: number;
  currency: string;
}

export interface ShipmentDetails {
  sender: Address & { name: string; phone: string };
  recipient: Address & { name: string; phone: string };
  weight: number;
  dimensions?: { length: number; width: number; height: number };
  cod?: number;
}

export interface ShipmentResult {
  success: boolean;
  trackingNumber: string;
  estimatedDelivery: Date;
  message?: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  status: string;
  events: TrackingEvent[];
}

export interface TrackingEvent {
  timestamp: Date;
  location: string;
  status: string;
  description: string;
}
