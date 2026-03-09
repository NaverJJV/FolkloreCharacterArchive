import { useState } from 'react';
import { Link } from 'react-router-dom';
import './OriginRow.css'; // Reusing the identical CSS classes

function StoryRow({ story, onUpdate, onDelete }) {
    const [isEditing, setIsEditing] = useState(false);

    // HTML Date inputs require a specific YYYY-MM-DD format
    const defaultDate = story.publication_date
        ? new Date(story.publication_date).toISOString().split('T')[0]
        : '';

    const [editData, setEditData] = useState({
        title: story.title,
        synopsis: story.synopsis || '',
        publication_date: defaultDate
    });

    const handleSave = () => {
        onUpdate(story.id, editData);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="origin-item edit-mode">
                <input type="text" value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} placeholder="Story Title" maxLength={255} />
                <input type="date" value={editData.publication_date} onChange={(e) => setEditData({...editData, publication_date: e.target.value})} />
                <textarea value={editData.synopsis} onChange={(e) => setEditData({...editData, synopsis: e.target.value})} placeholder="Synopsis" />
                <div className="card-actions">
                    <button className="edit-button" onClick={handleSave}>Save Changes</button>
                    <button className="toggle-button" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
            </div>
        );
    }

    const formattedDate = story.publication_date ? new Date(story.publication_date).toLocaleDateString() : "Unknown Date";

    return (
        <div className="origin-item">
            <button
                className="delete-x-button"
                title="Delete Story"
                onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${story.title}?`)) onDelete(story.id);
                }}
            >
                &times;
            </button>

            <div className="origin-header">
                <h3>{story.title}</h3>
                <span className="era-badge">{formattedDate}</span>
            </div>
            <p>{story.synopsis || "No synopsis available."}</p>

            <div className="card-actions split-actions">
                <Link to={`/stories/${story.id}`} className="view-button">
                    View Story
                </Link>
                <button className="edit-button split-edit" onClick={() => setIsEditing(true)}>
                    Edit
                </button>
            </div>
        </div>
    );
}

export default StoryRow;