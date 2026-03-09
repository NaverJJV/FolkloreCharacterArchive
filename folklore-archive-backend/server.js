const express = require('express');
const {Pool} = require('pg');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Initialize the Express application
const app = express();

// Enable CORS for incoming requests
app.use(cors({
    origin: 'http://localhost:5173' // If using a custom URL, change here
}));

// Middleware to parse incoming JSON data
app.use(express.json());
app.use((req, res, next) => {
    if (['POST', 'PUT'].includes(req.method) && !req.is('application/json')) {
        return res.status(415).json({ message: 'Content-Type must be application/json' });
    }
    next();
});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { message: 'Too many requests, please try again later.' }
});

app.use('/api/', limiter);

// Set up the PostgreSQL connection pool using individual env variables
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test the database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
    } else {
        console.log('Successfully connected to FolkloreCharacterArchiveDB');
    }
    if (client) release();
});

// A basic route to test that the server is running
app.get('/', (req, res) => {
    res.send('Folklore and Character Archive API is running!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Enforce varchar character limit
function validateCharacterInput({ name, alias, core_traits, origin_name }) {
    if (!name || name.trim().length === 0) return 'Name is required';
    if (name.length > 255) return 'Name must be under 255 characters';
    if (alias && alias.length > 255) return 'Alias must be under 255 characters';
    if (origin_name && origin_name.length > 255) return 'Origin name must be under 255 characters';
    if (core_traits && core_traits.length > 1000) return 'Core traits must be under 1000 characters';
    return null;
}

// GET all characters
app.get('/api/characters', async (req, res) => {
    try {
        // The SQL query to run
        const allCharacters = await pool.query('SELECT * FROM characters');

        // Send the resulting rows back as JSON
        res.json(allCharacters.rows);
    } catch (err) {
        // If something goes wrong, log the error and send a 500 status code
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET characters with their origin details
app.get('/api/characters-detailed', async (req, res) => {
    try {
        const query = `
            SELECT 
                characters.id, 
                characters.name, 
                characters.alias, 
                characters.core_traits, 
                origins.name AS origin_name 
            FROM characters 
            LEFT JOIN origins ON characters.origin_id = origins.id;
        `;
        const detailedCharacters = await pool.query(query);
        res.json(detailedCharacters.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST a new character
app.post('/api/characters', async (req, res) => {
    try {
        const { name, alias, core_traits, origin_name } = req.body;

        const error = validateCharacterInput(req.body);
        if (error) return res.status(400).json({ message: error });

        if (!origin_name || origin_name.trim() === "") {
            return res.status(400).json({ message: "Origin name is required" });
        }

        const trimmedOrigin = origin_name.trim();

        // Use ILIKE or LOWER() for case-insensitive lookup
        let originResult = await pool.query(
            'SELECT id FROM origins WHERE LOWER(name) = LOWER($1)',
            [trimmedOrigin]
        );

        let originId;
        if (originResult.rows.length > 0) {
            originId = originResult.rows[0].id;
        } else {
            const newOrigin = await pool.query(
                'INSERT INTO origins (name) VALUES ($1) RETURNING id',
                [trimmedOrigin]
            );
            originId = newOrigin.rows[0].id;
        }

        const newCharacter = await pool.query(
            'INSERT INTO characters (name, alias, core_traits, origin_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, alias, core_traits, originId]
        );

        res.json(newCharacter.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE a character
app.delete('/api/characters/:id', async (req, res) => {
    try {
        // Grab the ID from the URL parameters
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

        // Execute the DELETE SQL query
        const deleteQuery = await pool.query(
            'DELETE FROM characters WHERE id = $1 RETURNING *',
            [id]
        );

        // Check if a character was actually found and deleted
        if (deleteQuery.rowCount === 0) {
            return res.status(404).json({message: "Character not found"});
        }

        // Send a success response
        res.json({message: "Character deleted successfully"});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT (update) an existing character
app.put('/api/characters/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });
        const { name, alias, core_traits, origin_name } = req.body;

        const error = validateCharacterInput(req.body);
        if (error) return res.status(400).json({ message: error });

        if (!origin_name || origin_name.trim() === "") {
            return res.status(400).json({ message: "Origin name is required" });
        }

        // Get or Create the origin by name
        let originResult = await pool.query('SELECT id FROM origins WHERE name = $1', [origin_name.trim()]);

        let originId;
        if (originResult.rows.length > 0) {
            originId = originResult.rows[0].id;
        } else {
            const newOrigin = await pool.query(
                'INSERT INTO origins (name) VALUES ($1) RETURNING id',
                [origin_name.trim()]
            );
            originId = newOrigin.rows[0].id;
        }

        // Update the character with the (potentially new) originId
        const updateQuery = await pool.query(
            'UPDATE characters SET name = $1, alias = $2, core_traits = $3, origin_id = $4 WHERE id = $5 RETURNING *',
            [name, alias, core_traits, originId, id]
        );

        if (updateQuery.rowCount === 0) {
            return res.status(404).json({ message: "Character not found" });
        }

        res.json(updateQuery.rows[0]);
    } catch (err) {
        console.error("EDIT ERROR:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET all origins
app.get('/api/origins', async (req, res) => {
    try {
        const allOrigins = await pool.query('SELECT * FROM origins ORDER BY name ASC');
        res.json(allOrigins.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// UPDATE an existing origin
app.put('/api/origins/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });
        const { name, historical_era, description } = req.body;

        const error = validateCharacterInput(req.body);
        if (error) return res.status(400).json({ message: error });

        const updateOrigin = await pool.query(
            'UPDATE origins SET name = $1, historical_era = $2, description = $3 WHERE id = $4 RETURNING *',
            [name, historical_era, description, id]
        );

        if (updateOrigin.rowCount === 0) {
            return res.status(404).json({ message: "Origin not found" });
        }

        res.json(updateOrigin.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE an origin
app.delete('/api/origins/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

        // Fetch up to 3 character names linked to this origin
        const characterCheck = await pool.query(
            'SELECT name FROM characters WHERE origin_id = $1 LIMIT 3',
            [id]
        );

        if (characterCheck.rows.length > 0) {
            const names = characterCheck.rows.map(c => c.name).join(', ');
            const count = characterCheck.rows.length;

            return res.status(400).json({
                message: `Cannot delete this origin. It is still assigned to ${names}${count === 3 ? ' and others' : ''}.`
            });
        }

        await pool.query('DELETE FROM origins WHERE id = $1', [id]);
        res.json({ message: "Origin deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});