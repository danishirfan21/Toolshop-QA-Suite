import dotenv from 'dotenv';

dotenv.config({ quiet: true });

function read(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : fallback;
}

export const env = {
  baseUrl: read('BASE_URL', 'https://practicesoftwaretesting.com'),
  apiUrl: read('API_URL', 'https://api.practicesoftwaretesting.com'),
  customer: {
    email: read('CUSTOMER_EMAIL', 'customer@practicesoftwaretesting.com'),
    password: read('CUSTOMER_PASSWORD', 'welcome01'),
  },
  admin: {
    email: read('ADMIN_EMAIL', 'admin@practicesoftwaretesting.com'),
    password: read('ADMIN_PASSWORD', 'welcome01'),
  },
  isCI: Boolean(process.env.CI),
} as const;

export type Role = 'customer' | 'admin';

export const authFile = (role: Role): string => `.auth/${role}.json`;
