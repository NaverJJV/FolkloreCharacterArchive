import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AddCharacterForm from './AddCharacterForm';
import CharacterCard from './CharacterCard';
import OriginsManager from './OriginsManager';
import StoriesManager from './StoriesManager';
import StoryView from './StoryView';
import './App.css';

function ArchiveHome({ characters, fetchCharacters, handleDelete, handleEdit }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');

    // Filter the characters based on the search term
    const filteredCharacters = characters.filter(char => {
        const searchLower = searchTerm.toLowerCase();
        return (
            char.name.toLowerCase().includes(searchLower) ||
            (char.alias && char.alias.toLowerCase().includes(searchLower))
        );
    });

    // Sort the filtered characters
    const sortedCharacters = [...filteredCharacters].sort((a, b) => {
        let valA = (a[sortOption] || '').toString().toLowerCase();
        let valB = (b[sortOption] || '').toString().toLowerCase();

        // Use origin_name instead of 'origin' for sorting consistency
        if (sortOption === 'origin') {
            valA = a.origin_name.toLowerCase();
            valB = b.origin_name.toLowerCase();
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <>
            <nav className="stories-nav">
                <Link to="/stories" className="nav-link">Story Library</Link>
            </nav>
            <nav className="origins-nav">
                <Link to="/origins" className="nav-link">Origins Library</Link>
            </nav>

            <AddCharacterForm onCharacterAdded={fetchCharacters} />

            {/* --- Search & Sort Bar --- */}
            <div className="search-filter-bar">
                <input
                    type="text"
                    placeholder="Search by name or alias..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />

                <div className="sort-controls">
                    <label>Sort By:</label>
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                        <option value="name">Name</option>
                        <option value="alias">Alias</option>
                        <option value="origin">Origin</option>
                    </select>

                    <button
                        className="direction-btn"
                        onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    >
                        {sortDirection === 'asc' ? 'A-Z ↓' : 'Z-A ↑'}
                    </button>
                </div>
            </div>

            <div className="character-grid">
                {sortedCharacters.map(character => (
                    <CharacterCard
                        key={character.id}
                        character={character}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                    />
                ))}
            </div>
        </>
    );
}

function App() {
    const [characters, setCharacters] = useState([]);

    const fetchCharacters = () => {
        fetch('http://localhost:3000/api/characters-detailed')
            .then(res => res.json())
            .then(data => setCharacters(data))
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchCharacters(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this character?")) return;

        try {
            const response = await fetch(`http://localhost:3000/api/characters/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchCharacters();
            } else {
                console.error('Failed to delete character');
            }
        } catch (error) {
            console.error('Error deleting character:', error);
        }
    };

    const handleEdit = async (id, updatedData) => {
        try {
            const response = await fetch(`http://localhost:3000/api/characters/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });

            if (response.ok) {
                // Re-fetch the list to show the updated data
                fetchCharacters();
            } else {
                console.error('Failed to update character');
            }
        } catch (error) {
            console.error('Error updating character:', error);
        }
    };

    return (
        <Router>
            <div className="App">
                <h1>Folklore & Character Archive</h1>

                <Routes>
                    <Route path="/" element={
                        <ArchiveHome
                            characters={characters}
                            fetchCharacters={fetchCharacters}
                            handleDelete={handleDelete}
                            handleEdit={handleEdit}
                        />
                    } />
                    <Route path="/origins" element={<OriginsManager />} />
                    <Route path="/stories" element={<StoriesManager />} />
                    <Route path="stories/:id" element= {<StoryView />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;