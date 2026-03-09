import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StoryRow from './StoryRow';
import AddStoryForm from './AddStoryForm';
import './OriginsManager.css';

function StoriesManager() {
    const [stories, setStories] = useState([]);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchStories = () => {
        fetch('http://localhost:3000/api/stories')
            .then(res => res.json())
            .then(data => setStories(data))
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchStories(); }, []);

    const handleDeleteStory = async (id) => {
        setError(null);
        try {
            const response = await fetch(`http://localhost:3000/api/stories/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (response.ok) fetchStories();
            else setError(data.message);
        } catch (err) {
            setError("A network error occurred.");
        }
    };

    const handleUpdateStory = async (id, updatedData) => {
        setError(null);
        try {
            const response = await fetch(`http://localhost:3000/api/stories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });
            if (response.ok) fetchStories();
            else {
                const data = await response.json();
                setError(data.message || "Failed to update story.");
            }
        } catch (err) {
            setError("A network error occurred while saving.");
        }
    };

    const filteredStories = stories.filter(story => {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = (story.title || '').toLowerCase().includes(searchLower);
        const synMatch = (story.synopsis || '').toLowerCase().includes(searchLower);
        return titleMatch || synMatch;
    });

    return (
        <div className="origins-manager">
            <nav className="main-nav">
                <Link to="/" className="back-link">← Back to Character Archive</Link>
            </nav>

            <h1>Stories Library</h1>

            {error && (
                <div className="error-banner">
                    <div className="error-content"><strong>Action Denied:</strong> {error}</div>
                    <button className="close-error" onClick={() => setError(null)}>&times;</button>
                </div>
            )}

            <AddStoryForm onStoryAdded={fetchStories} />

            <div className="search-filter-bar" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    placeholder="Search by title or synopsis..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    style={{ flex: 1, maxWidth: '600px' }}
                />
            </div>

            <div className="origins-list">
                {filteredStories.map(story => (
                    <StoryRow
                        key={story.id}
                        story={story}
                        onUpdate={handleUpdateStory}
                        onDelete={handleDeleteStory}
                    />
                ))}

                {filteredStories.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
                        No stories match your search.
                    </p>
                )}
            </div>
        </div>
    );
}

export default StoriesManager;