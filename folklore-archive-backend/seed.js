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

        console.log('Dropping existing tables...');
        await pool.query(`
            DROP TABLE IF EXISTS character_stories CASCADE;
            DROP TABLE IF EXISTS stories CASCADE;
            DROP TABLE IF EXISTS characters CASCADE;
            DROP TABLE IF EXISTS origins CASCADE;
            DROP TABLE IF EXISTS character_tags CASCADE;
            DROP TABLE IF EXISTS story_tags CASCADE;
            DROP TABLE IF EXISTS tags CASCADE;
        `);

        console.log('Creating tables and triggers...');

        await pool.query(`
            CREATE OR REPLACE FUNCTION update_modified_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        await pool.query(`
            CREATE TABLE origins
            (
                id             SERIAL PRIMARY KEY,
                name           VARCHAR(255) NOT NULL,
                historical_era VARCHAR(255),
                description    TEXT,
                created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TRIGGER update_origins_modtime
                BEFORE UPDATE
                ON origins
                FOR EACH ROW
                EXECUTE FUNCTION update_modified_column();

            CREATE TABLE characters
            (
                id             SERIAL PRIMARY KEY,
                name           VARCHAR(255) NOT NULL,
                alias          VARCHAR(255),
                description    TEXT,
                story_synopsis TEXT,
                appearance     TEXT,
                personality    TEXT,
                image_url      TEXT,
                origin_id      INTEGER REFERENCES origins (id) ON DELETE SET NULL,
                created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TRIGGER update_characters_modtime
                BEFORE UPDATE
                ON characters
                FOR EACH ROW
                EXECUTE FUNCTION update_modified_column();

            CREATE TABLE stories
            (
                id               SERIAL PRIMARY KEY,
                title            VARCHAR(255) NOT NULL,
                synopsis         TEXT,
                content          TEXT,
                publication_date VARCHAR(100),
                created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TRIGGER update_stories_modtime
                BEFORE UPDATE
                ON stories
                FOR EACH ROW
                EXECUTE FUNCTION update_modified_column();

            CREATE TABLE character_stories
            (
                character_id INTEGER REFERENCES characters (id) ON DELETE CASCADE,
                story_id     INTEGER REFERENCES stories (id) ON DELETE CASCADE,
                role         VARCHAR(100),
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (character_id, story_id)
            );

            CREATE TABLE tags
            (
                id   SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL
            );

            CREATE TABLE character_tags
            (
                character_id INTEGER REFERENCES characters (id) ON DELETE CASCADE,
                tag_id       INTEGER REFERENCES tags (id) ON DELETE CASCADE,
                PRIMARY KEY (character_id, tag_id)
            );

            CREATE TABLE story_tags
            (
                story_id INTEGER REFERENCES stories (id) ON DELETE CASCADE,
                tag_id   INTEGER REFERENCES tags (id) ON DELETE CASCADE,
                PRIMARY KEY (story_id, tag_id)
            );
        `);

        console.log('Inserting sample data...');

        // Insert Origins
        await pool.query(`
            INSERT INTO origins (name, historical_era, description) VALUES
            ('Arthurian Legend', '5th-6th Century', 'A blend of history and myth centered around King Arthur and the Knights of the Round Table, set largely in at the start of the Dark Ages.'),
            ('Ancient Mesopotamia', 'c. 2100 BC', 'The cradle of civilization, featuring gods, monsters, and the earliest recorded epics.'),
            ('Ancient Greece', 'Mythological Era', 'An age where heroes walked the earth and defied the Olympian gods.'),
            ('English Folklore', 'High Middle Ages', 'Tales of outlaws, crusadses, deep forests, and rebellion against corrupt nobility.'),
            ('American Frontier', 'Late 19th Century', 'The era of rapid industrialization and westward expansion.');
        `);

        // Insert Characters
        await pool.query(`
            INSERT INTO characters (name, alias, description, origin_id) VALUES
            ('Arthur Pendragon', 'King Arthur', 'Chivalrous, burdened by destiny, noble leader', 1),
            ('Galahad', 'The Knight of Purity', 'Flawless, devout, spiritually enlightened', 1),
            ('Percival', 'The Knight of The Dove', 'Naive but pure-hearted, determined seeker', 1),
            ('Bors', 'The Steadfast', 'Loyal, grounded, reliable survivor', 1),
            ('Gawain', 'Knight of the Sun', 'Courteous, flawed but honorable, fiercely loyal', 1),
            ('Lancelot du Lac', 'Knight of the Lake', 'Unmatched in combat, tragically conflicted by forbidden love', 1),
            ('Gilgamesh', 'King of Uruk', 'Arrogant, immensely powerful, driven by a fear of mortality', 2),
            ('Enkidu', 'The Wild Man', 'In tune with nature, fiercely loyal companion', 2),
            ('Heracles', 'Hercules', 'Unfathomable strength, tragic temper, resilient to suffering', 3),
            ('Robin Hood', 'Prince of Thieves', 'Cunning, masterful archer, champion of the poor', 4),
            ('John Henry', 'The Steel-Driving Man', 'Immense strength, determination, unyielding human spirit', 5),
            ('Mordred', 'Knight of Treachery', 'Cunning, ambitious, driven by resentment and desire for power', 1),
            ('Merlin', 'The Enigmatic Wizard', 'Wise, mysterious, powerful sorcerer and advisor to King Arthur', 1),
            ('Uther Pendragon', 'Father of Arthur', 'Ambitious, passionate, flawed king whose actions set the stage for Arthur''s destiny', 1),
            ('Sir Ector', 'Foster Father of Arthur', 'Noble, loyal, protective guardian who raises Arthur as his own son', 1),
            ('Queen Guinevere', 'The Queen of Camelot', 'Graceful, intelligent, but ultimately tragic figure whose love affair with Lancelot contributes to the downfall of Camelot', 1),
            ('Sir Kay', 'Arthur''s Foster Brother', 'Boastful, hot-tempered, but ultimately loyal knight who serves as Arthur''s squire before discovering his true identity', 1),
            ('Richard I', 'Richard the Lionheart', 'Valiant, charismatic, but often absent king whose reign is marked by crusades and conflict with his brother John', 4),
            ('Hera', 'Queen of the Gods', 'Jealous, vengeful, but also protective of her own children, often causing trouble for heroes like Heracles', 3);
        `);

        // Insert Stories
        await pool.query(`
            INSERT INTO stories (title, synopsis, content, publication_date)
            VALUES ('The Sword in the Stone',
                    'A young boy proves his divine right to rule Britain.',
                    'After King Uther''s death, Britain fell into chaos. The wizard Merlin placed the Sword of Selection, "Caliburn" in an anvil atop a stone, proclaiming that only the true king could draw it. For years, the strongest knights failed the test.\n\nYoung Arthur, serving humbly as the squire of his brother, the Knight Sir Kay, effortlessly pulled the blade to replace his foster brother''s lost sword. In doing so, he revealed his royal lineage and accepted his destiny as the ''Once and Future King'' to unite the fractured realm.',
                    '15th Century'),
                   ('The Quest for the Holy Grail',
                    'The ultimate spiritual journey of the Round Table.',
                    'The pursuit of the Holy Grail was the highest calling a knight could answer. It promised divine grace and ultimate spiritual fulfillment. However, it was a quest that required absolute purity of heart, a standard that disqualified many of Arthur''s greatest champions.\n\nUltimately, only three knights achieved the Grail. Sir Galahad was lifted to heaven upon seeing it. Sir Percival became the new Grail King. Sir Bors returned to Camelot to tell the tale. Even the mighty Sir Lancelot was denied the ultimate vision due to his earthly sins.',
                    '15th Century'),
                   ('The Epic of Gilgamesh',
                    'A tyrannical king learns the value of friendship and the inevitability of death.',
                    'Gilgamesh, the tyrannical king of Uruk, is challenged by the wild man Enkidu. After a fierce battle that shakes the heavens, they become closest friends and embark on monster-slaying adventures. They defeat the demon Humbaba and slay the Bull of Heaven.\n\nWhen the gods punish them by taking Enkidu''s life, a heartbroken Gilgamesh journeys to the edge of the world searching for the secret to immortality. He ultimately realizes that human life is finite, but one''s legacy endures through their works.',
                    'c. 2100 BCE'),
                   ('The Twelve Labors of Heracles',
                    'A hero performs impossible feats to atone for a terrible crime.',
                    'Driven mad by the goddess Hera, Heracles commits an unforgivable crime against his own family. To atone, the Oracle of Delphi orders him to serve King Eurystheus and complete a series of impossible tasks.\n\nThese twelve labors pushed Heracles to his absolute limits. He strangled the Nemean Lion, outsmarted the hydra, cleaned the Augean stables in a single day, and even descended into the Underworld to capture the hellhound Cerberus. Through these trials, he earned his place among the gods.',
                    'Mythological Era'),
                   ('The Merry Adventures of Robin Hood',
                    'An outlaw steals from the rich to give to the poor in Sherwood Forest.',
                    'Deep in Sherwood Forest, the outlaw Robin Hood and his Merry Men wage a guerilla campaign against the corrupt Sheriff of Nottingham. A master archer and champion of the common folk, Robin relieves the greedy nobility of their wealth to support the overtaxed villagers.\n\nThrough clever disguises, archery tournaments, and daring rescues, Robin outwits his enemies at every turn, keeping the spirit of justice alive while waiting for the rightful return of King Richard.',
                    '13th Century'),
                   ('John Henry''s Race',
                    'A legendary steel-driver goes head-to-head with a steam powered machine.',
                    'As the railroads pushed westward across America, the invention of the steam-powered drill threatened the livelihood of manual laborers. John Henry, an incredibly strong steel-driver, refused to be replaced by a machine.\n\nHe challenged the steam drill to a race through the mountain. Swinging his hammers with impossible speed and power, he beat the machine. However, the immense effort caused his heart to give out, and he died with his hammer in his hand, becoming an eternal symbol of human resilience.',
                    'Late 19th Century'),
                    (
                    'Le Morte d''Arthur (The Death of Arthur)',
                    'The tragic downfall of a legendary king and his knights.',
                    'As Arthur''s reign reached its zenith, the seeds of his downfall were sown. The love affair between Sir Lancelot and Queen Guinevere fractured the Round Table, leading to bitter rivalries and betrayals. The quest for the Holy Grail further exposed the knights'' flaws, as only the purest could succeed.\\n\\nIn the end, Arthur faced his illegitimate son Mordred in a final battle that left both mortally wounded. As he lay dying, Arthur entrusted his kingdom to Sir Bedivere and was taken to the mystical Isle of Avalon, where he is said to await a time when Britain needs him most.',
                    'Early 16th Century');
        `);

        // Insert Character-Story Links
        await pool.query(`
            INSERT INTO character_stories (character_id, story_id, role) VALUES
            (1, 1, 'The Once and Future King'),
            (13, 1, 'Arthur''s Kingmaker'),
            (14, 1, 'The man who put the sword in the stone'),
            (15, 1, 'Arthur''s Foster Father'),
            (17, 1, 'Arthur''s Foster Brother'),
            
            (1, 2, 'The Waiting King'),
            (2, 2, 'The Achiever of the Grail'),
            (3, 2, 'The Grail Knight'),
            (4, 2, 'The Survivor'),
            (5, 2, 'The Knight Errant'),
            (6, 2, 'The Fallen Champion'),
            
            (7, 3, 'The Seeking Hero'),
            (8, 3, 'The Tragic Companion'),
            
            (9, 4, 'The Penitent Hero'),
            (19, 4, 'The Jealous Goddess'),
            
            (10, 5, 'The Outlaw Leader'),
            (18, 5, 'The Absent King'),
            
            (11, 6, 'The Unyielding Laborer'),
            
            (1,7, 'The Legendary King'),
            (6, 7, 'The Adulterous Knight'),
            (16, 7, 'The Tragic Queen'),
            (12, 7, 'The Treacherous Usurper');
        `);

        // Insert Default Tags
        await pool.query(`
            INSERT INTO tags (name) VALUES
            ('Mythology'), ('Folklore'), ('Tragedy'), ('Heroic Journey'), ('Magic');
        `);

        // Link Tags to Characters
        await pool.query(`
            INSERT INTO character_tags (character_id, tag_id) VALUES
            (1, 4), -- Arthur: Heroic Journey
            (1, 2), -- Arthur: Folklore
            (7, 1), -- Gilgamesh: Mythology
            (7, 3), -- Gilgamesh: Tragedy
            (10, 2), -- Robin Hood: Folklore
            (11, 2); -- John Hood: Folklore
        `);

        // Link Tags to Stories
        await pool.query(`
            INSERT INTO story_tags (story_id, tag_id) VALUES
            (1, 4), -- Arthur: Heroic Journey
            (1, 2), -- Arthur: Folklore
            (2, 4), -- Grail: Heroic Journey
            (2, 3), -- Grail: Tragedy
            (2, 2), -- Grail: Folklore
            (3, 1), -- Gilgamesh: Mythology
            (3, 3), -- Gilgamesh: Tragedy
            (4, 1), -- Heracles: Mythology
            (4, 3), -- Heracles: Tragedy
            (4, 4), -- Heracles: Heroic Journey
            (5, 2), -- Robin Hood: Folklore
            (6, 2), -- John Hood: Folklore
            (7, 3), -- Le Morte d'Arthur: Tragedy
            (7, 2); -- Le Morte d'Arthur: Folklore
        `);

        console.log('Database seeded successfully with new test data!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        pool.end();
    }
};

seedDatabase();