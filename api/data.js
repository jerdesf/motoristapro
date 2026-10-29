import { Redis } from '@upstash/redis';

function getRedis() {
  try {
    return Redis.fromEnv();
  } catch (e) {
    const url =
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.KV_REST_API_URL;
    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN ||
      process.env.KV_REST_API_TOKEN;

    if (url && token) {
      try {
        return new Redis({ url, token });
      } catch (err) {
        console.error('Error initializing Upstash Redis manually:', err);
      }
    }
  }
  return null;
}

export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const redis = getRedis();

  // Endpoint de verificação de status da conexão
  if (req.method === 'GET' && req.url && req.url.includes('check=1')) {
    return res.status(200).json({
      connected: Boolean(redis),
      hasEnv: Boolean(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL),
    });
  }

  if (req.method === 'GET') {
    if (redis) {
      try {
        const cloudData = await redis.get('motoristapro_data');
        if (cloudData && (cloudData.entries || cloudData.settings)) {
          return res.status(200).json({
            source: 'cloud',
            data: cloudData,
          });
        }
      } catch (err) {
        console.error('Upstash Redis error on GET:', err);
      }
    }

    return res.status(200).json({
      source: 'none',
      data: null,
    });
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      let savedToCloud = false;

      if (redis && body) {
        try {
          await redis.set('motoristapro_data', body);
          savedToCloud = true;
        } catch (redisErr) {
          console.error('Upstash Redis error on POST:', redisErr);
        }
      }

      return res.status(200).json({ success: true, savedToCloud });
    } catch (err) {
      console.error('Error in POST:', err);
      return res.status(500).json({ error: 'Failed to save data' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
