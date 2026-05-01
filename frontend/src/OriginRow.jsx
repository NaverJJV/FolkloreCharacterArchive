import {useState} from 'react';
import './OriginRow.css';

function OriginRow({origin, onUpdate, onDelete}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        name: origin.name,
        historical_era: origin.historical_era || '',
        description: origin.description || ''
    });

    const handleSave = () => {
        onUpdate(origin.id, editData);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="origin-item edit-mode">
                <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    placeholder="Origin Name"
                    maxLength={255}
                />
                <input
                    type="text"
                    value={editData.historical_era}
                    onChange={(e) => setEditData({...editData, historical_era: e.target.value})}
                    placeholder="Historical Era"
                    maxLength={255}
                />
                <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({...editData, description: e.target.value})}
                    placeholder="Description"
                />
                <div className="card-actions">
                    <button className="edit-button" onClick={handleSave}>Save Changes</button>
                    <button className="toggle-button" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
            </div>
        );
    }

    return (
        <div className="origin-item">
            <button
                className="delete-x-button"
                title="Delete Origin"
                onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${origin.name}?`)) {
                        onDelete(origin.id);
                    }
                }}
            >
                &times;
            </button>

            <div className="origin-header">
                <h3>{origin.name}</h3>
                <span className="era-badge">{origin.historical_era || "Unknown Era"}</span>
            </div>
            <p>{origin.description || "No description provided."}</p>

            {origin.updated_at && (
                <div className="last-edited-timestamp" style={{ borderTop: 'none', marginTop: 'auto' }}>
                    Last edited: {new Date(origin.updated_at).toLocaleString()}
                </div>
            )}

            <div className="card-actions">
                <button className="edit-button" onClick={() => setIsEditing(true)}>Edit Details</button>
            </div>
        </div>
    );
}

export default OriginRow;