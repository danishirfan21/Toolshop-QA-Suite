import { test, expect } from '../../fixtures';

// TEMPORARY probe, never merged. Fails on purpose so the observations appear in the CI log.
test('PROBE-API observations', async ({ customerApi, request }) => {
  const obs: Record<string, unknown> = {};
  const j = async (r: { status(): number; text(): Promise<string> }) => ({ s: r.status(), t: (await r.text()).slice(0, 160) });
  const lk = await (await request.get('/postcode-lookup?country=NL&postcode=1122AB')).json();
  const mk = async () => {
    const id = await customerApi.createCart();
    await customerApi.addToCart(id, await customerApi.firstProductId(), 1);
    return id;
  };
  const body = (cartId: string, m: string, d: object) => ({ billing_street: 'Test street 98', billing_city: lk.city, billing_state: lk.state, billing_country: 'NL', billing_postal_code: '1122AB', payment_method: m, payment_details: d, cart_id: cartId });

  const cid = await mk();
  obs.invoice = (await customerApi.call('post', '/invoices', body(cid, 'cash-on-delivery', {}))).status();
  const after = await customerApi.call('get', `/carts/${cid}`);
  obs.cartAfterInvoice = { s: after.status(), items: (await after.json().catch(() => ({}))).cart_items?.length };
  obs.giftValid = await j(await customerApi.call('post', '/invoices', body(await mk(), 'gift-card', { gift_card_number: '1234567890123456', validation_code: '1A2B' })));
  obs.giftShort = await j(await customerApi.call('post', '/invoices', body(await mk(), 'gift-card', { gift_card_number: '123456789012345', validation_code: '1A2B' })));
  obs.ccEmpty = await j(await customerApi.call('post', '/invoices', body(await mk(), 'credit-card', {})));
  const c2 = await customerApi.createCart();
  const h = { Accept: 'application/json' };
  obs.qty0Json = await j(await request.post(`/carts/${c2}`, { data: { product_id: await customerApi.firstProductId(), quantity: 0 }, headers: h }));
  obs.unknownJson = await j(await request.post(`/carts/${c2}`, { data: { product_id: 'zzz', quantity: 1 }, headers: h }));
  obs.qty0NoHeader = await j(await request.post(`/carts/${c2}`, { data: { product_id: await customerApi.firstProductId(), quantity: 0 } }));
  obs.qtyFrac = await j(await request.post(`/carts/${c2}`, { data: { product_id: await customerApi.firstProductId(), quantity: 2.5 }, headers: h }));
  expect(JSON.stringify(obs, null, 1)).toBe('PROBE');
});
