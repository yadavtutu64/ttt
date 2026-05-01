// api/[...path].js
import CryptoJS from 'crypto-js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;
  const requestedPath = path?.join('/') || '';

  if (requestedPath === 'proxy' || req.url.includes('/api/proxy')) {
    return handleProxy(req, res);
  }

  return res.status(404).json({ error: 'Not found' });
}

async function handleProxy(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, id } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    console.log(`📡 Fetching ${action}${id ? ` with id: ${id}` : ''}`);

    // Fetch from original API
    const response = await fetch('https://spidykgs.vercel.app/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; V2052) AppleWebKit/537.36',
        'Origin': 'https://spidykgs.vercel.app',
        'Referer': 'https://spidykgs.vercel.app/',
        'X-Requested-With': 'idm.internet.download.manager'
      },
      body: JSON.stringify({ action, id: id || null })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const encryptedData = await response.json();
    
    // Decrypt the payload
    let decryptedData = null;
    
    if (encryptedData.success && encryptedData.payload) {
      try {
        // AES Decryption
        const bytes = CryptoJS.AES.decrypt(encryptedData.payload, 'MySuperSecretKey2025');
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        decryptedData = JSON.parse(decryptedString);
        
        console.log(`✅ Decrypted ${action} successfully`);
        
        // Normalize data format
        if (action === 'courses') {
          const courses = decryptedData.courses || decryptedData;
          decryptedData = Array.isArray(courses) ? courses : Object.values(courses);
        }
        
      } catch (decryptError) {
        console.error('Decryption failed:', decryptError);
        return res.status(500).json({
          success: false,
          error: 'Failed to decrypt data',
          raw: encryptedData
        });
      }
    } else {
      return res.status(500).json({
        success: false,
        error: 'Invalid response from API',
        raw: encryptedData
      });
    }

    // Return clean, decrypted data
    return res.status(200).json({
      success: true,
      action: action,
      data: decryptedData,
      metadata: {
        timestamp: new Date().toISOString(),
        totalItems: Array.isArray(decryptedData) ? decryptedData.length : 
                   (decryptedData.courses ? decryptedData.courses.length : 
                   Object.keys(decryptedData).length)
      }
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}