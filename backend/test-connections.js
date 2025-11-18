import express from 'express';
import cors from 'cors';
import db from './src/config/db.js';
import * as Users from './src/models/users.model.js';
import bcrypt from 'bcrypt';

const app = express();
app.use(cors());
app.use(express.json());

// Test database connection
app.get('/test/db', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW() as current_time');
        res.json({ 
            success: true, 
            message: 'Database connected', 
            time: result.rows[0].current_time 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Database connection failed', 
            error: error.message 
        });
    }
});

// Test user creation
app.post('/test/signup', async (req, res) => {
    try {
        const { full_name, email, password } = req.body;
        
        if (!full_name || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const user = await Users.createUser({ 
            full_name, 
            email, 
            password_hash, 
            role: 'user' 
        });

        res.json({ 
            success: true, 
            message: 'User created successfully', 
            user: { 
                id: user.id, 
                full_name: user.full_name, 
                email: user.email, 
                role: user.role 
            } 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'User creation failed', 
            error: error.message 
        });
    }
});

// Test basic endpoint
app.get('/test/ping', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running', 
        timestamp: new Date().toISOString() 
    });
});

const PORT = 4001;
app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
    console.log('Test endpoints:');
    console.log(`- GET  http://localhost:${PORT}/test/ping`);
    console.log(`- GET  http://localhost:${PORT}/test/db`);
    console.log(`- POST http://localhost:${PORT}/test/signup`);
});