import { createClient, type Client } from '@libsql/client';
import { seed } from './seed';
import { migrate } from './migrate';

let _client: Client | null = null;
let _seeded = false;

export function getClient(): Client {
  if (!_client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (url) {
      _client = createClient({
        url,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
    } else {
      _client = createClient({ url: 'file:data/dashboard.db' });
    }
  }
  return _client;
}

export async function getDb(): Promise<Client> {
  const client = getClient();
  if (!_seeded) {
    await seed(client);
    await migrate(client);
    _seeded = true;
  }
  return client;
}
