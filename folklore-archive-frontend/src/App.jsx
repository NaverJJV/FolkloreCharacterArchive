import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AddCharacterForm from './AddCharacterForm';
import CharacterCard from './CharacterCard';
import OriginsManager from './OriginsManager'; // Import the new page
import './App.css';

// We move the main archive logic into its own component to keep App.jsx clean
function ArchiveHome({ characters, fetchCharacters, handleDelete, handleEdit }) {
    return (
        <>
            <nav className="main-nav">
                <Link to="/origins" className="nav-link">Manage Origins Library</Link>
            </nav>
            <AddCharacterForm onCharacterAdded={fetchCharacters} />
            <div className="character-grid">
                {characters.map(character => (
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

    const handleDelete = async (id) => { /* Same as before */ };
    const handleEdit = async (id, data) => { /* Same as before */ };

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
                </Routes>
            </div>
        </Router>
    );
}

export default App;