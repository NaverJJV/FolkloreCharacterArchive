import { useState } from 'react';

function OriginRow({ origin, onUpdate }) {
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
                />
                <input
                    type="text"
                    value={editData.historical_era}
                    onChange={(e) => setEditData({...editData, historical_era: e.target.value})}
                    placeholder="Historical Era"
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
            <div className="origin-header">
                <h3>{origin.name}</h3>
                <span className="era-badge">{origin.historical_era || "Unknown Era"}</span>
            </div>
            <p>{origin.description || "No description provided."}</p>
            <button className="edit-button" onClick={() => setIsEditing(true)}>Edit Details</button>
        </div>
    );
}

export default OriginRow;