export async function openCheckout(_options?: { product?: string }): Promise<void> {
  window.open('/pro', '_blank');
}

export async function startCheckout(_product?: unknown): Promise<void> {
  window.open('/pro', '_blank');
}

export default openCheckout;
