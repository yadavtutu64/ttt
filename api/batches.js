import CryptoJS from 'crypto-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch('https://spidykgs.vercel.app/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; V2052) AppleWebKit/537.36',
      },
      body: JSON.stringify({ action: 'courses', id: null })
    });

    const encrypted = await response.json();

    if (!encrypted.success || !encrypted.payload) {
      throw new Error('API response failed');
    }

    const bytes = CryptoJS.AES.decrypt(encrypted.payload, 'MySuperSecretKey2025');
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    const decryptedData = JSON.parse(decryptedString);

    const courses = decryptedData.courses || decryptedData;
    const coursesArray = Array.isArray(courses) ? courses : Object.values(courses);

    // batches.html expects a direct array
    res.status(200).json(coursesArray);

  } catch (error) {
    console.error('Batches API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
