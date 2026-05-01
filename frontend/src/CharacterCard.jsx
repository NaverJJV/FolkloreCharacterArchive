import {useState} from 'react';
import { Link } from 'react-router-dom';
import './CharacterCard.css';

function CharacterCard({character, onDelete, onEdit}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Local state just for the edit form
    const [editData, setEditData] = useState({
        name: character.name,
        alias: character.alias,
        description: character.description || '',
        origin_name: character.origin_name || '',
        updated_at: character.updated_at
    });

    const handleChange = (e) => {
        const {name, value} = e.target;
        setEditData({...editData, [name]: value});
    };

    const submitEdit = () => {
        onEdit(character.id, editData);
        setIsEditing(false); // Close the edit form after saving
    };

    // If the card is in Edit Mode, render a form
    if (isEditing) {
        return (
            <div className="character-card edit-mode">
                <input type="text" name="name" value={editData.name} onChange={handleChange} maxLength={255}/>
                <input type="text" name="alias" value={editData.alias} onChange={handleChange} maxLength={255}/>
                <textarea name="description" value={editData.description} onChange={handleChange} maxLength={1000}/>
                <div className="form-group">
                    <label>Era:</label>
                    <input
                        type="text"
                        name="origin_name"
                        value={editData.origin_name}
                        onChange={handleChange}
                        maxLength={255}
                    />
                </div>

                <div className="card-actions">
                    <button className="toggle-button" onClick={submitEdit}>Save</button>
                    <button className="delete-button" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
            </div>
        );
    }

    // Otherwise, render the standard display
    return (
        <div className="character-card">
            <h2>
                <Link to={`/characters/${character.id}`} className="character-link">
                    {character.name}
                </Link>
            </h2>
            <h3>"{character.alias}"</h3>
            <div className="tag-container" style={{ margin: '0.5rem 0', justifyContent: 'center' }}>
                {character.tags && character.tags.map(tag => (
                    <span key={tag.id} className="tag-pill">{tag.name}</span>
                ))}
            </div>

            {isExpanded && (
                <div className="character-details">
                    <p><strong>Era:</strong> {character.origin_name}</p>
                    <p><strong>Description:</strong> {character.description}</p>
                </div>
            )}

            <div className="card-actions">
                <button className="toggle-button" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? 'Show Less' : 'Show Details'}
                </button>
                <button className="edit-button" onClick={() => setIsEditing(true)}>Edit</button>
                <button className="delete-button" onClick={() => onDelete(character.id)}>Delete</button>
            </div>
        </div>
    );
}

export default CharacterCard;