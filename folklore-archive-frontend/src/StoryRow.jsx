import { Link } from 'react-router-dom';
import './OriginRow.css';

function StoryRow({ story, onDelete }) {
    const formattedDate = story.publication_date
        ? new Date(story.publication_date).toLocaleDateString()
        : "Unknown Date";

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

            {story.updated_at && (
                <div className="last-edited-timestamp" style={{ borderTop: 'none' }}>
                    Last edited: {new Date(story.updated_at).toLocaleString()}
                </div>
            )}

            <div className="card-actions">
                <Link to={`/stories/${story.id}`} className="view-button" style={{ width: '100%', flex: '1' }}>
                    View Story
                </Link>
            </div>
        </div>
    );
}

export default StoryRow;