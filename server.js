// backend/server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const reflectionsRoutes = require('./routes/reflections');
const groupsRoutes = require('./routes/groups');
const messagesRoutes = require('./routes/messages');
const recordingsRoutes = require('./routes/recordings');
const adminRoutes = require('./routes/admin');

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
const PORT = 3001;

// MongoDB kapcsolat
connectDB();

app.use(cors());
app.use(express.json());

// Static files - uploads folder
app.use('/uploads', express.static('uploads'));

// Auth route-ok
app.use('/api/auth', authRoutes);

// Reflections route-ok
app.use('/api/reflections', reflectionsRoutes);

// Groups route-ok
app.use('/api/groups', groupsRoutes);

// Messages route-ok
app.use('/api/messages', messagesRoutes);

// Recordings route-ok
app.use('/api/recordings', recordingsRoutes);

// Admin route-ok
app.use('/api/admin', adminRoutes);

// Segédfüggvény a dátum formázásához (YYYY-MM-DD)
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// API endpoint az igeszakaszok lekéréséhez
app.get('/api/igeszakaszok', async (req, res) => {
  try {
    // Ha van 'd' paraméter, azt használjuk, különben a mai napot
    const datum = req.query.d || formatDate(new Date());
    const url = `https://reformatus.hu/isten-szolt?d=${datum}`;
    
    console.log(`Lekérdezés: ${url}`);
    
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    
    // Dátum és névnap kinyerése
    const dateText = $('.article__date').text().trim();
    const nameDay = $('.article__nameday').text().trim();
    
    // Újszövetségi igeszakasz
    const ujszovetsegi = {
      cim: $('.block__new_title').contents().first().text().trim(),
      hely: $('.block__new_paragraph').text().trim(),
      szoveg: $('.block__new_text .rich-text').text().trim(),
      magyarazat: $('.block__new_explanation .rich-text').text().trim()
    };
    
    // Ószövetségi igeszakasz
    const oszovetsegi = {
      cim: $('.block__old_title').contents().first().text().trim(),
      hely: $('.block__old_paragraph').text().trim(),
      szoveg: $('.block__old_text .rich-text').text().trim(),
      magyarazat: $('.block__old_explanation .rich-text').text().trim()
    };
    
    res.json({
      datum: dateText,
      nevnap: nameDay,
      ujszovetsegi,
      oszovetsegi,
      success: true
    });
    
  } catch (error) {
    console.error('Hiba történt:', error.message);
    res.status(500).json({ 
      error: 'Hiba történt az adatok lekérésekor',
      message: error.message,
      success: false
    });
  }
});

// Socket.io kapcsolat
const connectedUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('Felhasználó csatlakozott:', socket.id);

  // Felhasználó regisztrációja
  socket.on('register', (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`Felhasználó ${userId} regisztrálva socket ${socket.id}-val`);
  });

  // Csoporthoz csatlakozás
  socket.on('join-group', (groupId) => {
    socket.join(groupId);
    console.log(`Socket ${socket.id} csatlakozott a ${groupId} csoporthoz`);
  });

  // Csoport elhagyása
  socket.on('leave-group', (groupId) => {
    socket.leave(groupId);
    console.log(`Socket ${socket.id} elhagyta a ${groupId} csoportot`);
  });

  // Új üzenet
  socket.on('new-message', (data) => {
    console.log('Új üzenet:', data);
    io.to(data.groupId).emit('message-received', data.message);
  });

  // Gépelés jelzés
  socket.on('typing', (data) => {
    socket.to(data.groupId).emit('user-typing', {
      groupId: data.groupId,
      userId: data.userId,
      username: data.username
    });
  });

  // Gépelés leállítása
  socket.on('stop-typing', (data) => {
    socket.to(data.groupId).emit('user-stopped-typing', {
      groupId: data.groupId,
      userId: data.userId
    });
  });

  // Üzenet szerkesztése
  socket.on('edit-message', (data) => {
    io.to(data.groupId).emit('message-edited', data.message);
  });

  // Üzenet törlése
  socket.on('delete-message', (data) => {
    io.to(data.groupId).emit('message-deleted', data.messageId);
  });

  // Olvasási visszaigazolás
  socket.on('message-read', (data) => {
    io.to(data.groupId).emit('message-read-update', data);
  });

  // Leválás
  socket.on('disconnect', () => {
    // Eltávolítjuk a connectedUsers-ből
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`Felhasználó ${userId} leválasztva`);
        break;
      }
    }
    console.log('Felhasználó leválasztva:', socket.id);
  });
});

// Export io for use in routes if needed
app.set('io', io);

server.listen(PORT, () => {
  console.log(`Backend szerver fut a http://localhost:${PORT} címen`);
  console.log(`API elérhető: http://localhost:${PORT}/api/igeszakaszok`);
  console.log('Socket.io szerver fut');
});
