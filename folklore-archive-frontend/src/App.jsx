import { useState, useEffect } from 'react';
import AddCharacterForm from './AddCharacterForm';
import CharacterCard from './CharacterCard';
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
    <div className="App">
      <h1>Folklore & Character Archive</h1>
      
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
    </div>
  );
}

export default App;