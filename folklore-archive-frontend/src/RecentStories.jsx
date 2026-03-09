import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './OriginRow.css'; // Reusing your parchment card styles

function RecentStories() {
    const [recentStories, setRecentStories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3000/api/stories/recent')
            .then(res => res.json())
            .then(data => {
                setRecentStories(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return null; // Fail silently while loading
    if (recentStories.length === 0) return null; // Hide if no stories exist

    return (
        <div className="recent-stories-dashboard" style={{ marginBottom: '3rem' }}>
            <h2 style={{
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline'
            }}>
                Recently Added Tales
                <Link to="/stories" style={{ fontSize: '0.8rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    View All →
                </Link>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {recentStories.map(story => {
                    const addedDate = new Date(story.created_at).toLocaleDateString();

                    return (
                        <div key={story.id} className="origin-item" style={{ padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                            <div className="origin-header" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '0.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem' }}>{story.title}</h3>
                            </div>

                            <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', fontStyle: 'normal', marginBottom: '1rem' }}>
                                Added to archive: {addedDate}
                            </p>

                            <div style={{ marginTop: 'auto' }}>
                                <Link to={`/stories/${story.id}`} className="view-button" style={{ width: '100%' }}>
                                    Read Tale
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default RecentStories;