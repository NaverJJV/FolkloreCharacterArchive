const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const seedDatabase = async () => {
    try {
        console.log('Connecting to database...');

        // 1. Drop existing tables to start fresh
        console.log('Dropping existing tables...');
        await pool.query(`
            DROP TABLE IF EXISTS character_stories CASCADE;
            DROP TABLE IF EXISTS stories CASCADE;
            DROP TABLE IF EXISTS characters CASCADE;
            DROP TABLE IF EXISTS origins CASCADE;
        `);

        // 2. Create the tables
        console.log('Creating tables...');
        await pool.query(`
            CREATE TABLE origins (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                historical_era VARCHAR(255),
                description TEXT
            );

            CREATE TABLE characters (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                alias VARCHAR(255),
                core_traits TEXT,
                origin_id INTEGER REFERENCES origins(id) ON DELETE SET NULL
            );

            CREATE TABLE stories (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                synopsis TEXT,
                publication_date DATE
            );

            CREATE TABLE character_stories (
                character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
                story_id INTEGER REFERENCES stories(id) ON DELETE CASCADE,
                role VARCHAR(100),
                PRIMARY KEY (character_id, story_id)
            );
        `);

        // 3. Insert the test data
        console.log('Inserting sample data...');
        await pool.query(`
            INSERT INTO origins (name, historical_era, description) VALUES
            ('Post-Civil War America', 'Late 19th Century', 'The era of reconstruction and railway expansion.'),
            ('American Frontier', 'Late 19th Century', 'The period of expansion and lawlessness in the western US.'),
            ('6th Century Britain', 'Early Middle Ages', 'A time of myth, legend, and native Britons against Saxon invaders.');

            INSERT INTO characters (name, alias, core_traits, origin_id) VALUES
            ('John Henry', 'The Steel-Driving Man', 'Immense strength, determination, unyielding spirit', 1),
            ('Jesse James', 'The Bandit King', 'Rebellious, cunning, infamous outlaw', 2),
            ('Arthur Pendragon', 'King Arthur', 'Chivalrous, burdened by destiny, noble leader', 3);
        `);

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        // Close the database connection
        pool.end();
    }
};

seedDatabase();