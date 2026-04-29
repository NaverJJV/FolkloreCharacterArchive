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
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10000,
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
function validateCharacterInput({ name, alias, description, story_synopsis, appearance, personality, origin_name }) {
    if (!name || name.trim().length === 0) return 'Name is required';
    if (name.length > 255) return 'Name must be under 255 characters';
    if (alias && alias.length > 255) return 'Alias must be under 255 characters';
    if (origin_name && origin_name.length > 255) return 'Origin name must be under 255 characters';
    if (description && description.length > 1000) return 'Description must be under 1000 characters';
    if (story_synopsis && story_synopsis.length > 2000) return 'Story synopsis must be under 2000 characters';
    if (appearance && appearance.length > 1000) return 'Appearance must be under 1000 characters';
    if (personality && personality.length > 1000) return 'Personality must be under 1000 characters';
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
                characters.description,
                characters.updated_at, 
                origins.name AS origin_name 
            FROM characters 
            LEFT JOIN origins ON characters.origin_id = origins.id
            ORDER BY characters.name ASC;
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
        const { name, alias, description, story_synopsis, appearance, personality, image_url, origin_name } = req.body;

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
            'INSERT INTO characters (name, alias, description, story_synopsis, appearance, personality, image_url, origin_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [name, alias, description, story_synopsis, appearance, personality, image_url, originId]
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
        const { name, alias, description, story_synopsis, appearance, personality, image_url, origin_name } = req.body;

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
            'UPDATE characters SET name = $1, alias = $2, description = $3, story_synopsis = $4, appearance = $5, personality = $6, image_url = $7, origin_id = $8 WHERE id = $9 RETURNING *',
            [name, alias, description, story_synopsis, appearance, personality, image_url, originId, id]
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

// POST a new origin
app.post('/api/origins', async (req, res) => {
    try {
        const { name, historical_era, description } = req.body;
        const error = validateCharacterInput(req.body);
        if (error) return res.status(400).json({ message: error });

        if (!name || name.trim() === "") {
            return res.status(400).json({ message: "Origin name is required" });
        }

        const newOrigin = await pool.query(
            'INSERT INTO origins (name, historical_era, description) VALUES ($1, $2, $3) RETURNING *',
            [name.trim(), historical_era, description]
        );

        res.json(newOrigin.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET all stories
app.get('/api/stories', async (req, res) => {
    try {
        const allStories = await pool.query('SELECT * FROM stories ORDER BY publication_date DESC NULLS LAST, title ASC');
        res.json(allStories.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET the 2 most recently added stories for the dashboard
app.get('/api/stories/recent', async (req, res) => {
    try {
        const recentStories = await pool.query(
            'SELECT * FROM stories ORDER BY created_at DESC LIMIT 2'
        );
        res.json(recentStories.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET a single story by ID
app.get('/api/stories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const story = await pool.query('SELECT * FROM stories WHERE id = $1', [id]);

        if (story.rows.length === 0) {
            return res.status(404).json({ message: "Story not found" });
        }
        res.json(story.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET a single character by ID
app.get('/api/characters/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT c.*, o.name AS origin_name 
            FROM characters c 
            LEFT JOIN origins o ON c.origin_id = o.id 
            WHERE c.id = $1
        `;
        const character = await pool.query(query, [id]);

        if (character.rows.length === 0) {
            return res.status(404).json({ message: "Character not found" });
        }
        res.json(character.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// GET all stories a specific character appears in
app.get('/api/characters/:id/stories', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT s.id, s.title, s.publication_date, cs.role, s.updated_at 
            FROM stories s 
            JOIN character_stories cs ON s.id = cs.story_id 
            WHERE cs.character_id = $1 
            ORDER BY s.title ASC
        `;
        const stories = await pool.query(query, [id]);
        res.json(stories.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// GET characters linked to a specific story
app.get('/api/stories/:id/characters', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                c.id, 
                c.name, 
                c.alias, 
                c.updated_at, 
                cs.role, 
                o.name AS origin_name
            FROM characters c
            JOIN character_stories cs ON c.id = cs.character_id
            LEFT JOIN origins o ON c.origin_id = o.id
            WHERE cs.story_id = $1
            ORDER BY c.name ASC;
        `;
        const characters = await pool.query(query, [id]);
        res.json(characters.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// POST a new story
app.post('/api/stories', async (req, res) => {
    try {
        const { title, synopsis, content, publication_date } = req.body;

        if (!title || title.trim() === "") {
            return res.status(400).json({ message: "Story title is required" });
        }

        const pubDate = publication_date ? publication_date : null;

        const newStory = await pool.query(
            'INSERT INTO stories (title, synopsis, content, publication_date) VALUES ($1, $2, $3, $4) RETURNING *',
            [title.trim(), synopsis, content, pubDate]
        );

        res.json(newStory.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// UPDATE an existing story
app.put('/api/stories/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

        const { title, synopsis, content, publication_date } = req.body;
        if (!title || title.trim() === "") return res.status(400).json({ message: "Title is required" });

        const pubDate = publication_date ? publication_date : null;

        const updateStory = await pool.query(
            'UPDATE stories SET title = $1, synopsis = $2, content = $3, publication_date = $4 WHERE id = $5 RETURNING *',
            [title.trim(), synopsis, content, pubDate, id]
        );

        if (updateStory.rowCount === 0) return res.status(404).json({ message: "Story not found" });
        res.json(updateStory.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE a story
app.delete('/api/stories/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

        // Check if any characters are linked to this story before deleting
        const characterCheck = await pool.query(
            'SELECT characters.name FROM character_stories JOIN characters ON character_stories.character_id = characters.id WHERE story_id = $1 LIMIT 3',
            [id]
        );

        if (characterCheck.rows.length > 0) {
            const names = characterCheck.rows.map(c => c.name).join(', ');
            return res.status(400).json({
                message: `Cannot delete this story. It is still linked to ${names}.`
            });
        }

        await pool.query('DELETE FROM stories WHERE id = $1', [id]);
        res.json({ message: "Story deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST: Link a character to a story
app.post('/api/character_stories', async (req, res) => {
    try {
        const { character_id, story_id, role } = req.body;

        const newLink = await pool.query(
            'INSERT INTO character_stories (character_id, story_id, role) VALUES ($1, $2, $3) RETURNING *',
            [character_id, story_id, role]
        );
        res.json(newLink.rows[0]);
    } catch (err) {
        // 23505 is the PostgreSQL error code for a unique constraint violation
        if (err.code === '23505') {
            return res.status(400).json({ message: "Character is already attached to this story." });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT: Update a character's role in a specific story
app.put('/api/character_stories', async (req, res) => {
    try {
        const { character_id, story_id, role } = req.body;

        if (role && role.length > 100) {
            return res.status(400).json({ message: "Role must be under 100 characters." });
        }

        const updateLink = await pool.query(
            'UPDATE character_stories SET role = $1 WHERE character_id = $2 AND story_id = $3 RETURNING *',
            [role, character_id, story_id]
        );
        res.json(updateLink.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE: Detach a character from a story
app.delete('/api/stories/:storyId/characters/:characterId', async (req, res) => {
    try {
        const { storyId, characterId } = req.params;
        await pool.query(
            'DELETE FROM character_stories WHERE story_id = $1 AND character_id = $2',
            [storyId, characterId]
        );
        res.json({ message: "Character removed from story." });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- TAG SYSTEM ROUTES ---

// GET all available tags (for a dropdown/autocomplete)
app.get('/api/tags', async (req, res) => {
    try {
        const tags = await pool.query('SELECT * FROM tags ORDER BY name ASC');
        res.json(tags.rows);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Helper function to find or create a tag
async function findOrCreateTag(tagName) {
    const trimmedName = tagName.trim();
    let tagRes = await pool.query('SELECT id FROM tags WHERE LOWER(name) = LOWER($1)', [trimmedName]);
    if (tagRes.rows.length === 0) {
        tagRes = await pool.query('INSERT INTO tags (name) VALUES ($1) RETURNING id', [trimmedName]);
    }
    return tagRes.rows[0].id;
}

// GET tags for a specific character
app.get('/api/characters/:id/tags', async (req, res) => {
    try {
        const { id } = req.params;
        const tags = await pool.query(`
            SELECT t.id, t.name FROM tags t
            JOIN character_tags ct ON t.id = ct.tag_id
            WHERE ct.character_id = $1 ORDER BY t.name ASC
        `, [id]);
        res.json(tags.rows);
    } catch (err) { res.status(500).send('Server Error'); }
});

// POST link a tag to a character
app.post('/api/characters/:id/tags', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: "Tag name is required" });

        const tagId = await findOrCreateTag(name);
        await pool.query(
            'INSERT INTO character_tags (character_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, tagId]
        );
        res.json({ message: "Tag added" });
    } catch (err) { res.status(500).send('Server Error'); }
});

// DELETE link between character and tag
app.delete('/api/characters/:charId/tags/:tagId', async (req, res) => {
    try {
        await pool.query('DELETE FROM character_tags WHERE character_id = $1 AND tag_id = $2', [req.params.charId, req.params.tagId]);
        res.json({ message: "Tag removed" });
    } catch (err) { res.status(500).send('Server Error'); }
});

// GET tags for a specific story
app.get('/api/stories/:id/tags', async (req, res) => {
    try {
        const { id } = req.params;
        const tags = await pool.query(`
            SELECT t.id, t.name FROM tags t
            JOIN story_tags st ON t.id = st.tag_id
            WHERE st.story_id = $1 ORDER BY t.name ASC
        `, [id]);
        res.json(tags.rows);
    } catch (err) { res.status(500).send('Server Error'); }
});

// POST link a tag to a story
app.post('/api/stories/:id/tags', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: "Tag name is required" });

        const tagId = await findOrCreateTag(name);
        await pool.query(
            'INSERT INTO story_tags (story_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, tagId]
        );
        res.json({ message: "Tag added" });
    } catch (err) { res.status(500).send('Server Error'); }
});

// DELETE link between story and tag
app.delete('/api/stories/:storyId/tags/:tagId', async (req, res) => {
    try {
        await pool.query('DELETE FROM story_tags WHERE story_id = $1 AND tag_id = $2', [req.params.storyId, req.params.tagId]);
        res.json({ message: "Tag removed" });
    } catch (err) { res.status(500).send('Server Error'); }
});