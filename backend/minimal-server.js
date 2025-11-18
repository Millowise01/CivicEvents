const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Server working', time: new Date().toISOString() });
});

// Auth endpoint
app.post('/api/auth/signup', (req, res) => {
    const { full_name, email, password } = req.body;
    
    if (!full_name || !email || !password) {
        return res.status(400).json({ message: 'Missing fields' });
    }
    
    res.json({ 
        message: 'User created successfully',
        data: { full_name, email, role: 'user' }
    });
});

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Keep server alive
setInterval(() => {
    console.log('Server alive at', new Date().toISOString());
}, 30000);

process.on('SIGINT', () => {
    console.log('Shutting down...');
    server.close();
    process.exit(0);
});