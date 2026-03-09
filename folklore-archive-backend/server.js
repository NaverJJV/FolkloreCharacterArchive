const express = require('express');
const {Pool} = require('pg');
const cors = require('cors');
require('dotenv').config();

// Initialize the Express application
const app = express();

// Enable CORS for incoming requests
app.use(cors());
app.use(express.json());

// Middleware to parse incoming JSON data
app.use(express.json());

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

        // Backend Validation
        if (!origin_name || origin_name.trim() === "") {
            return res.status(400).json({ message: "Origin name is required" });
        }

        // Check if origin exists
        let originResult = await pool.query('SELECT id FROM origins WHERE name = $1', [origin_name.trim()]);

        let originId;
        if (originResult.rows.length > 0) {
            originId = originResult.rows[0].id;
        } else {
            // Create it if it doesn't
            const newOrigin = await pool.query(
                'INSERT INTO origins (name) VALUES ($1) RETURNING id',
                [origin_name.trim()]
            );
            originId = newOrigin.rows[0].id;
        }

        // Create the character
        const newCharacter = await pool.query(
            'INSERT INTO characters (name, alias, core_traits, origin_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, alias, core_traits, originId]
        );

        res.json(newCharacter.rows[0]);
    } catch (err) {
        console.error("DATABASE ERROR:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// DELETE a character
app.delete('/api/characters/:id', async (req, res) => {
    try {
        // Grab the ID from the URL parameters
        const {id} = req.params;

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
        const { id } = req.params;
        const { name, alias, core_traits, origin_name } = req.body;

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