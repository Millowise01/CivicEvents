import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

console.log('Starting server setup...');

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('Middleware configured');

// Serve frontend
app.use(express.static(path.join(process.cwd(), '../frontend')));

console.log('Static files configured');

// Test endpoint
app.get('/test', (req, res) => {
    console.log('Test endpoint hit');
    res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
});

// Simple auth endpoint for testing
app.post('/api/auth/signup', async (req, res) => {
    console.log('Signup endpoint hit with:', req.body);
    try {
        const { full_name, email, password } = req.body;
        
        if (!full_name || !email || !password) {
            return res.status(400).json({ 
                status: 400, 
                message: 'Missing required fields' 
            });
        }

        // Simple response for testing
        res.status(201).json({
            status: 201,
            message: 'User created successfully',
            data: { 
                id: 'test-id', 
                full_name, 
                email, 
                role: 'user' 
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ 
            status: 500, 
            message: error.message 
        });
    }
});

console.log('Routes configured');

// Start server
const server = app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ Frontend: http://localhost:${PORT}`);
    console.log(`✓ Test: http://localhost:${PORT}/test`);
    console.log('Server is ready and waiting for requests...');
});

// Keep server alive
const keepAlive = setInterval(() => {
    console.log('Server heartbeat:', new Date().toISOString());
}, 10000);

// Error handling
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    clearInterval(keepAlive);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    clearInterval(keepAlive);
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    clearInterval(keepAlive);
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

console.log('Error handlers configured');
console.log('Server setup complete!');