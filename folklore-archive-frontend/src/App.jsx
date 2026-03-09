import { useState, useEffect } from 'react';
import AddCharacterForm from './AddCharacterForm';
import CharacterCard from './CharacterCard'; // 1. Import the new component
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

  return (
    <div className="App">
      <h1>Folklore & Character Archive</h1>
      
      <AddCharacterForm onCharacterAdded={fetchCharacters} />
      
      <div className="character-grid">
        {characters.map(character => (
          /* 2. Pass the data and the delete function down as props */
          <CharacterCard 
            key={character.id} 
            character={character} 
            onDelete={handleDelete} 
          />
        ))}
      </div>
    </div>
  );
}

export default App;