import { useState, useEffect } from 'react';
import AddCharacterForm from './AddCharacterForm';
import './App.css';

function App() {
  const [characters, setCharacters] = useState([]);

  const fetchCharacters = () => {
    fetch('http://localhost:3000/api/characters-detailed')
      .then(response => response.json())
      .then(data => setCharacters(data))
      .catch(error => console.error('Error fetching data:', error));
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  // Function to handle the delete action
  const handleDelete = async (id) => {
    // Adding a quick confirmation dialog so users don't accidentally delete records
    if (!window.confirm("Are you sure you want to delete this character?")) return;

    try {
      const response = await fetch(`http://localhost:3000/api/characters/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // If successful, re-fetch the list to update the UI
        fetchCharacters();
      } else {
        console.error('Failed to delete character');
      }
    } catch (error) {
      console.error('Error deleting character:', error);
    }
  };

  return (
    <div className="App">
      <h1>Folklore & Character Archive</h1>
      
      <AddCharacterForm onCharacterAdded={fetchCharacters} />
      
      <div className="character-grid">
        {characters.map(character => (
          <div key={character.id} className="character-card">
            <h2>{character.name}</h2>
            <h3>"{character.alias}"</h3>
            <p><strong>Origin:</strong> {character.origin_name}</p>
            
            {/* The delete button */}
            <button 
              className="delete-button" 
              onClick={() => handleDelete(character.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;