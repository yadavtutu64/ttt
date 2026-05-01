import CryptoJS from 'crypto-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const fullUrl = req.url || '';
  const url = fullUrl.split('?')[0]; // Remove query params for matching
  
  console.log('Request URL:', url);
  
  // Handle courses
  if (url === '/api/courses' || url === '/api/courses/') {
    return handleCourses(req, res);
  }

  // Handle batches
  if (url === '/api/batches' || url === '/api/batches/') {
    return handleBatches(req, res);
  }
  
  // Handle subjects/123
  const subjectsMatch = url.match(/^\/api\/subjects\/(\d+)/);
  if (subjectsMatch) {
    const id = subjectsMatch[1];
    return handleGenericProxy(req, res, 'subjects', id);
  }
  
  // Handle lessons/123
  const lessonsMatch = url.match(/^\/api\/lessons\/(\d+)/);
  if (lessonsMatch) {
    const id = lessonsMatch[1];
    return handleGenericProxy(req, res, 'lessons', id);
  }

  // Handle classroom/123
  const classroomMatch = url.match(/^\/api\/classroom\/(\d+)/);
  if (classroomMatch) {
    const id = classroomMatch[1];
    return handleGenericProxy(req, res, 'classroom', id);
  }

  // Handle today/123
  const todayMatch = url.match(/^\/api\/today\/(\d+)/);
  if (todayMatch) {
    const id = todayMatch[1];
    return handleGenericProxy(req, res, 'todayclasses', id);
  }

  // Handle updates/123
  const updatesMatch = url.match(/^\/api\/updates\/(\d+)/);
  if (updatesMatch) {
    const id = updatesMatch[1];
    return handleGenericProxy(req, res, 'updates', id);
  }

  // Handle batches/123 (for specific batch details/header)
  const batchDetailMatch = url.match(/^\/api\/batches\/(\d+)/);
  if (batchDetailMatch) {
    const id = batchDetailMatch[1];
    return handleBatchHeader(req, res, id);
  }
  
  // Handle proxy POST
  if (req.method === 'POST' && url === '/api/proxy') {
    return handleProxy(req, res);
  }
  
  res.status(404).json({ error: 'Not found', url });
}

async function handleGenericProxy(req, res, action, id) {
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
      body: JSON.stringify({ action, id: parseInt(id) })
    });
    
    const encryptedData = await response.json();
    if (!encryptedData.success || !encryptedData.payload) throw new Error('Invalid response');
    
    const bytes = CryptoJS.AES.decrypt(encryptedData.payload, 'MySuperSecretKey2025');
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    let result = decryptedData;
    if (action === 'subjects' && decryptedData.subjects) result = decryptedData.subjects;
    if (action === 'lessons' && decryptedData.lessons) result = decryptedData.lessons;
    if (action === 'classroom' && decryptedData.classroom) result = decryptedData.classroom;
    if (action === 'todayclasses' && decryptedData.todayclasses) result = decryptedData.todayclasses;
    if (action === 'updates' && (decryptedData.updates || decryptedData.announcements)) {
        result = decryptedData.updates || decryptedData.announcements;
    }

    const dataArray = Array.isArray(result) ? result : Object.values(result);
    res.status(200).json(dataArray);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handleBatches(req, res) {
  try {
    const response = await fetch('https://spidykgs.vercel.app/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; V2052) AppleWebKit/537.36'
      },
      body: JSON.stringify({ action: 'courses', id: null })
    });

    const encrypted = await response.json();
    const bytes = CryptoJS.AES.decrypt(encrypted.payload, 'MySuperSecretKey2025');
    const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    const courses = decrypted.courses || decrypted;
    const coursesArray = Array.isArray(courses) ? courses : Object.values(courses);

    res.status(200).json(coursesArray);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function handleBatchHeader(req, res, id) {
    try {
        const response = await fetch('https://spidykgs.vercel.app/api/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 11; V2052) AppleWebKit/537.36'
            },
            body: JSON.stringify({ action: 'courses', id: null })
        });

        const encrypted = await response.json();
        const bytes = CryptoJS.AES.decrypt(encrypted.payload, 'MySuperSecretKey2025');
        const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        const courses = decrypted.courses || decrypted;
        const coursesArray = Array.isArray(courses) ? courses : Object.values(courses);

        const batch = coursesArray.find(c => String(c.id) === String(id));
        if (batch) {
            res.status(200).json(batch);
        } else {
            res.status(404).json({ error: 'Batch not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function handleCourses(req, res) {
  try {
    const response = await fetch('https://spidykgs.vercel.app/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; V2052) AppleWebKit/537.36'
      },
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

async function handleProxy(req, res) {
  try {
    const { action, id } = req.body;
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
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
