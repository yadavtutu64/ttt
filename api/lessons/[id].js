// api/lessons/[id].js
import CryptoJS from 'crypto-js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Vercel dynamic route se ID aise capture hoti hai
  const { id } = req.query;
  
  console.log('Lessons request for ID:', id);
  
  if (!id) {
    return res.status(400).json({ error: 'Subject ID required' });
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const response = await fetch('https://spidykgs.vercel.app/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; V2052) AppleWebKit/537.36',
        'Origin': 'https://spidykgs.vercel.app',
        'Referer': 'https://spidykgs.vercel.app/',
        'X-Requested-With': 'idm.internet.download.manager'
      },
      body: JSON.stringify({ 
        action: 'lessons', 
        id: parseInt(id) 
      })
    });
    
    const encryptedData = await response.json();
    
    if (!encryptedData.success || !encryptedData.payload) {
      throw new Error('Invalid response from API');
    }
    
    const bytes = CryptoJS.AES.decrypt(encryptedData.payload, 'MySuperSecretKey2025');
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    const decryptedData = JSON.parse(decryptedString);
    
    const lessons = Array.isArray(decryptedData) ? decryptedData : Object.values(decryptedData);
    
    res.status(200).json({
      success: true,
      subjectId: parseInt(id),
      count: lessons.length,
      lessons: lessons
    });
    
  } catch (error) {
    console.error('Lessons error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}