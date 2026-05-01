import { Link } from 'react-router-dom';
import './OriginRow.css';

function StoryRow({ story, onDelete }) {
    const displayDate = story.publication_date || "Unknown Era";

    // Calculate tags to display
    const displayTags = story.tags ? story.tags.slice(0, 3) : [];
    const extraTagsCount = story.tags ? story.tags.length - 3 : 0;

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
                <span className="era-badge">{displayDate}</span>
            </div>

            {/* Display up to 3 tags */}
            <div className="tag-container" style={{ justifyContent: 'flex-start', margin: '0.5rem 0' }}>
                {displayTags.map(tag => (
                    <span key={tag.id} className="tag-pill">{tag.name}</span>
                ))}
                {extraTagsCount > 0 && (
                    <span className="tag-pill" style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--color-ink-muted)' }}>
                        +{extraTagsCount} more
                    </span>
                )}
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