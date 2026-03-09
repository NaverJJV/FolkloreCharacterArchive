const express = require('express');
const { Pool } = require('pg');
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
            SELECT characters.id, characters.name, characters.alias, origins.name AS origin_name 
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
        // 1. Extract the data from the incoming request body
        const { name, alias, core_traits, origin_id } = req.body;

        // 2. Write the SQL query using parameterized inputs for security
        // The "RETURNING *" clause tells PostgreSQL to send back the row it just created
        const newCharacter = await pool.query(
            'INSERT INTO characters (name, alias, core_traits, origin_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, alias, core_traits, origin_id]
        );

        // 3. Send the newly created character back to the client as proof of success
        res.json(newCharacter.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});