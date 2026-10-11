import { Injectable } from '@nestjs/common';
import {
  ShippingProvider,
  Address,
  ShippingFee,
  ShipmentDetails,
  ShipmentResult,
  TrackingInfo,
} from './interfaces/shipping-provider.interface';
import {
  calculateShippingFee,
  getEstimatedDeliveryDays,
  ShippingMethod,
} from './shipping-fee';

@Injectable()
export class ShippingService implements ShippingProvider {
  getName(): string {
    return 'Mock Shipping Service';
  }

  async calculateFee(
    origin: Address,
    destination: Address,
    method: ShippingMethod = ShippingMethod.STANDARD,
  ): Promise<ShippingFee> {
    const fee = calculateShippingFee(destination.province, method);
    const estimatedDays = getEstimatedDeliveryDays(destination.province);

    return {
      fee,
      estimatedDays,
      currency: 'VND',
    };
  }

  async createShipment(orderId: string, details: ShipmentDetails): Promise<ShipmentResult> {
    // Mock shipment creation
    const trackingNumber = `THAI${Date.now().toString().slice(-8)}`;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

    return {
      success: true,
      trackingNumber,
      estimatedDelivery,
      message: `Mock shipment created for order ${orderId}. In production, this would integrate with Thailand Post, Kerry, Flash Express, etc.`,
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    // Mock tracking info
    return {
      trackingNumber,
      status: 'In Transit',
      events: [
        {
          timestamp: new Date(Date.now() - 86400000 * 2),
          location: 'Bangkok Sorting Center',
          status: 'Picked Up',
          description: 'Package picked up from sender',
        },
        {
          timestamp: new Date(Date.now() - 86400000),
          location: 'Regional Hub',
          status: 'In Transit',
          description: 'Package in transit to destination',
        },
        {
          timestamp: new Date(),
          location: 'Local Distribution Center',
          status: 'Out for Delivery',
          description: 'Package is out for delivery',
        },
      ],
    };
  }
}
