import { useState, useEffect } from 'react';
import AddCharacterForm from './AddCharacterForm'; // Import the new component
import './App.css';

function App() {
  const [characters, setCharacters] = useState([]);

  // Moving the fetch logic into its own function so we can call it repeatedly
  const fetchCharacters = () => {
    fetch('http://localhost:3000/api/characters-detailed')
      .then(response => response.json())
      .then(data => setCharacters(data))
      .catch(error => console.error('Error fetching data:', error));
  };

  // Run the fetch when the component first loads
  useEffect(() => {
    fetchCharacters();
  }, []);

  return (
    <div className="App">
      <h1>Folklore & Character Archive</h1>
      
      {/* Render the form and pass the fetch function as a prop */}
      <AddCharacterForm onCharacterAdded={fetchCharacters} />
      
      <div className="character-grid">
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