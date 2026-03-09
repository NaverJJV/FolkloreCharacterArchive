import { useState } from 'react';
import './CharacterCard.css';
import './OriginRow.css'; // Reusing the top-right X button style

function StoryCharacterCard({ char, onDetach, onUpdateRole }) {
    const [isEditingRole, setIsEditingRole] = useState(false);
    const [roleInput, setRoleInput] = useState(char.role || '');

    const handleSaveRole = () => {
        onUpdateRole(char.id, roleInput);
        setIsEditingRole(false);
    };

    return (
        <div className="character-card">
            <button
                className="delete-x-button"
                title="Remove from Story"
                onClick={() => {
                    if (window.confirm(`Detach ${char.name} from this story?`)) {
                        onDetach(char.id);
                    }
                }}
            >
                &times;
            </button>

            <h2>{char.name}</h2>
            <h3>"{char.alias}"</h3>

            <div className="character-details" style={{ display: 'block', borderTop: 'none', marginTop: '0.5rem', paddingTop: '0' }}>
                <p><strong>Origin:</strong> {char.origin_name}</p>

                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--surface-form)', borderRadius: 'var(--radius-sm)' }}>
                    <strong>Role:</strong>

                    {isEditingRole ? (
                        <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                            <input
                                type="text"
                                value={roleInput}
                                onChange={(e) => setRoleInput(e.target.value)}
                                maxLength={100}
                                style={{ flex: 1, padding: '0.3rem', fontSize: '0.9rem', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)' }}
                            />
                            <button onClick={handleSaveRole} className="edit-button" style={{ padding: '0.3rem 0.6rem', flex: 'none' }}>Save</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                            <span>{char.role || "Unspecified"}</span>
                            <button
                                onClick={() => setIsEditingRole(true)}
                                className="toggle-button"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', flex: 'none' }}
                            >
                                Edit
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StoryCharacterCard;