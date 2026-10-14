import type { QueryKey } from '@tanstack/react-query';

const CART_TOOLS = new Set([
  'cart_add_item',
  'cart_update_item',
  'cart_remove_item',
  'cart_clear',
]);

/**
 * Checks whether the tool is a cart mutation tool handled by the local cart store.
 */
export function isCartTool(toolName: string): boolean {
  return CART_TOOLS.has(toolName);
}

/**
 * Maps chatbot tools to TanStack Query keys that need invalidation.
 * Exact query keys match existing hooks in src/features/ (prefix matching).
 */
export function keysForTool(toolName: string): QueryKey[] {
  switch (toolName) {
    case 'checkout':
      return [['orders'], ['order-detail'], ['cart']];
    case 'cancel_my_order':
      return [['orders'], ['order-detail']];
    case 'update_my_profile':
      return [['user']];
    case 'create_address':
    case 'update_address':
    case 'delete_address':
      return [['addresses']];
    case 'create_review':
    case 'update_review':
    case 'delete_review':
      return [['product-detail'], ['products']];
    case 'get_referral_info':
      return [['referral-info']];
    default:
      return [];
  }
}
