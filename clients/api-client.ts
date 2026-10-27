import { request, type APIRequestContext, type APIResponse } from '@playwright/test';
import { env, type Role } from '../utils/env';

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface NewProduct {
  name: string;
  description: string;
  price: number;
  category_id: string;
  brand_id: string;
  product_image_id: string;
  is_location_offer: boolean;
  is_rental: boolean;
  co2_rating?: string;
}

export interface Product extends NewProduct {
  id: string;
}

const EXPIRY_MARGIN_MS = 15_000;

/**
 * Thin typed client for test data setup and cleanup.
 * Tokens live 300 seconds (see docs/app-recon.md), so it logs in again when the cached token is about to expire.
 */
export class ApiClient {
  private context?: APIRequestContext;
  private token?: string;
  private expiresAt = 0;

  constructor(private readonly role: Role) {}

  private async ctx(): Promise<APIRequestContext> {
    this.context ??= await request.newContext({ baseURL: env.apiUrl });
    return this.context;
  }

  private async bearer(): Promise<string> {
    if (this.token && Date.now() < this.expiresAt - EXPIRY_MARGIN_MS) return this.token;
    const creds = env[this.role];
    const res = await (await this.ctx()).post('/users/login', { data: { email: creds.email, password: creds.password } });
    if (!res.ok()) throw new Error(`API login failed for ${this.role}: ${res.status()}`);
    const body = (await res.json()) as LoginResponse;
    this.token = body.access_token;
    this.expiresAt = Date.now() + body.expires_in * 1000;
    return this.token;
  }

  /** Authenticated request. Returns the raw response so specs can assert on status and body. */
  async call(method: 'get' | 'post' | 'put' | 'patch' | 'delete', path: string, data?: unknown): Promise<APIResponse> {
    const ctx = await this.ctx();
    return ctx[method](path, { data, headers: { Authorization: `Bearer ${await this.bearer()}` } });
  }

  private send(method: 'get' | 'post' | 'put' | 'delete', path: string, data?: unknown): Promise<APIResponse> {
    return this.call(method, path, data);
  }

  async createCart(): Promise<string> {
    const res = await this.send('post', '/carts');
    if (res.status() !== 201) throw new Error(`createCart failed: ${res.status()}`);
    return ((await res.json()) as { id: string }).id;
  }

  async addToCart(cartId: string, productId: string, quantity = 1): Promise<void> {
    const res = await this.send('post', `/carts/${cartId}`, { product_id: productId, quantity });
    if (!res.ok()) throw new Error(`addToCart failed: ${res.status()}`);
  }

  async firstProductId(): Promise<string> {
    const res = await this.send('get', '/products');
    const body = (await res.json()) as { data: Array<{ id: string }> };
    return body.data[0].id;
  }

  async firstProductName(): Promise<string> {
    const res = await this.send('get', '/products');
    const body = (await res.json()) as { data: Array<{ name: string }> };
    return body.data[0].name;
  }

  /** Admin only. */
  async createProduct(product: NewProduct): Promise<Product> {
    const res = await this.send('post', '/products', product);
    if (res.status() !== 201) throw new Error(`createProduct failed: ${res.status()}`);
    return (await res.json()) as Product;
  }

  /** Admin only. Tolerates an already deleted product. */
  async deleteProduct(id: string): Promise<void> {
    const res = await this.send('delete', `/products/${id}`);
    if (res.status() !== 204 && res.status() !== 404) throw new Error(`deleteProduct failed: ${res.status()}`);
  }

  async dispose(): Promise<void> {
    await this.context?.dispose();
    this.context = undefined;
  }
}
