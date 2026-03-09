import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './App.css'; // Reusing global layout and grid styles
import './CharacterCard.css'; // Reusing card styles

function StoryView() {
    const { id } = useParams(); // Grabs the story ID from the URL
    const [story, setStory] = useState(null);
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch both the story details and the linked characters simultaneously
        Promise.all([
            fetch(`http://localhost:3000/api/stories/${id}`).then(res => res.json()),
            fetch(`http://localhost:3000/api/stories/${id}/characters`).then(res => res.json())
        ])
            .then(([storyData, charactersData]) => {
                setStory(storyData);
                setCharacters(charactersData);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div className="App"><h2>Loading story details...</h2></div>;
    if (!story || story.message) return <div className="App"><h2>Story not found.</h2></div>;

    const formattedDate = story.publication_date
        ? new Date(story.publication_date).toLocaleDateString()
        : "Unknown Date";

    return (
        <div className="App">
            <nav className="main-nav">
                <Link to="/stories" className="back-link">← Back to Stories Library</Link>
            </nav>

            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1>{story.title}</h1>
                <p style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink-muted)', letterSpacing: '0.1em' }}>
                    PUBLISHED: {formattedDate}
                </p>
                <p style={{ maxWidth: '700px', margin: '1rem auto', fontSize: '1.1rem', color: 'var(--color-ink-soft)' }}>
                    {story.synopsis}
                </p>
            </div>

            <h2 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                Cast of Characters
            </h2>

            {characters.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: 'var(--color-ink-muted)' }}>
                    No characters have been assigned to this story yet.
                </p>
            ) : (
                <div className="character-grid">
                    {characters.map(char => (
                        <div key={char.id} className="character-card">
                            <h2>{char.name}</h2>
                            <h3>"{char.alias}"</h3>

                            <div className="character-details" style={{ display: 'block' }}>
                                <p><strong>Origin:</strong> {char.origin_name}</p>
                                {/* Highlight the role they play in this specific story */}
                                <p style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'var(--surface-form)', borderRadius: 'var(--radius-sm)' }}>
                                    <strong>Role:</strong> {char.role || "Unspecified"}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default StoryView;