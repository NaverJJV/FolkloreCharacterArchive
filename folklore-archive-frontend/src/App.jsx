import { useState, useEffect } from 'react';
import './App.css';

function App() {
    // State to hold our characters data
    const [characters, setCharacters] = useState([]);

    // useEffect runs automatically when the component loads
    useEffect(() => {
        // Fetch data from your backend API
        fetch('http://localhost:3000/api/characters-detailed')
            .then(response => response.json())
            .then(data => {
                // Update the state with the fetched data
                setCharacters(data);
            })
            .catch(error => console.error('Error fetching data:', error));
    }, []); // The empty array ensures this only runs once

    // Render the UI
    return (
        <div className="App">
            <h1>Folklore & Character Archive</h1>

            <div className="character-grid">
                {/* Map through the characters array and create a card for each one */}
                {characters.map(character => (
                    <div key={character.id} className="character-card">
                        <h2>{character.name}</h2>
                        <h3>"{character.alias}"</h3>
                        <p><strong>Origin:</strong> {character.origin_name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;