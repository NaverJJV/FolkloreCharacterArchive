import { useState } from 'react';

function CharacterCard({ character, onDelete }) {
  // Local state to track if this specific card is expanded
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="character-card">
      <h2>{character.name}</h2>
      <h3>"{character.alias}"</h3>
      
      {/* This section only renders if isExpanded is true */}
      {isExpanded && (
        <div className="character-details">
          <p><strong>Origin:</strong> {character.origin_name}</p>
          <p><strong>Core Traits:</strong> {character.core_traits}</p>
        </div>
      )}
      
      <div className="card-actions">
        {/* Toggle button that flips the boolean state */}
        <button 
          className="toggle-button" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show Less' : 'Show Details'}
        </button>

        <button 
          className="delete-button" 
          onClick={() => onDelete(character.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default CharacterCard;