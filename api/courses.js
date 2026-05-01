// api/courses.js
import CryptoJS from 'crypto-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await fetch('https://spidykgs.vercel.app/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'courses', id: null })
    });

    const encrypted = await response.json();
    const bytes = CryptoJS.AES.decrypt(encrypted.payload, 'MySuperSecretKey2025');
    const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    const courses = decrypted.courses || decrypted;
    const coursesArray = Array.isArray(courses) ? courses : Object.values(courses);

    res.status(200).json({
      success: true,
      count: coursesArray.length,
      courses: coursesArray
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
