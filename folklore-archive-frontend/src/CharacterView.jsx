import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './App.css';
import './CharacterCard.css';

function CharacterView() {
    const { id } = useParams();
    const [character, setCharacter] = useState(null);
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editingField, setEditingField] = useState(null);
    const [editData, setEditData] = useState({ name: '', alias: '', description: '' });

    const [tags, setTags] = useState([]);
    const [newTag, setNewTag] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);

    const fetchData = () => {
        Promise.all([
            fetch(`http://localhost:3000/api/characters/${id}`).then(res => res.json()),
            fetch(`http://localhost:3000/api/characters/${id}/stories`).then(res => res.json()),
            fetch(`http://localhost:3000/api/characters/${id}/tags`).then(res => res.json())
        ])
            .then(([charData, storyData, tagData]) => {
                setCharacter(charData);
                setStories(storyData);
                setTags(tagData);
                setEditData({
                    name: charData.name,
                    alias: charData.alias || '',
                    description: charData.description || ''
                });
                setLoading(false);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchData(); }, [id]);

    const handleSaveDetail = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/characters/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                // We must send origin_name back so it isn't overwritten as blank
                body: JSON.stringify({ ...editData, origin_name: character.origin_name })
            });
            if (response.ok) {
                setEditingField(null);
                fetchData();
            }
        } catch (err) { console.error(err); }
    };

    const handleAddTag = async (e) => {
        e.preventDefault();
        if (!newTag.trim()) return;
        try {
            await fetch(`http://localhost:3000/api/characters/${id}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTag.trim() })
            });
            setNewTag('');
            setIsAddingTag(false);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleRemoveTag = async (tagId) => {
        try {
            await fetch(`http://localhost:3000/api/characters/${id}/tags/${tagId}`, { method: 'DELETE' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="App"><h2>Loading character...</h2></div>;
    if (!character || character.message) return <div className="App"><h2>Character not found.</h2></div>;

    return (
        <div className="App">
            <nav className="main-nav">
                <Link to="/" className="back-link">← Back to Archive</Link>
            </nav>

            <div className="story-header-container">
                {/* NAME */}
                {editingField === 'name' ? (
                    <div className="inline-edit-group title-edit">
                        <input type="text" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} autoFocus />
                        <button onClick={handleSaveDetail} className="edit-button">Save</button>
                        <button onClick={() => setEditingField(null)} className="toggle-button">Cancel</button>
                    </div>
                ) : (
                    <h1 className="editable-field">
                        {character.name}
                        <button className="inline-edit-icon" onClick={() => setEditingField('name')}>&#x270E;</button>
                    </h1>
                )}

                {/* ALIAS */}
                {editingField === 'alias' ? (
                    <div className="inline-edit-group date-edit">
                        <input type="text" value={editData.alias} onChange={(e) => setEditData({...editData, alias: e.target.value})} />
                        <button onClick={handleSaveDetail} className="edit-button">Save</button>
                        <button onClick={() => setEditingField(null)} className="toggle-button">Cancel</button>
                    </div>
                ) : (
                    <p className="editable-field story-date" style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '1.2rem', fontStyle: 'italic' }}>
                        "{character.alias || "No known alias"}"
                        <button className="inline-edit-icon" onClick={() => setEditingField('alias')}>&#x270E;</button>
                    </p>
                )}

                <p style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)', letterSpacing: '0.1em', marginTop: '0.5rem' }}>
                    ERA: {character.origin_name || "Unknown"}
                </p>

                {/* DESCRIPTION */}
                {editingField === 'description' ? (
                    <div className="inline-edit-group synopsis-edit">
                        <textarea value={editData.description} onChange={(e) => setEditData({...editData, description: e.target.value})} autoFocus maxLength={1000} />
                        <div className="edit-actions" style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleSaveDetail} className="edit-button">Save</button>
                            <button onClick={() => setEditingField(null)} className="toggle-button">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div className="editable-field story-synopsis preamble">
                        <p>{character.description || "No description provided."}</p>
                        <button className="inline-edit-icon" onClick={() => setEditingField('description')}>&#x270E;</button>
                    </div>
                )}
            </div>

            <div className="tag-container">
                {tags.map(tag => (
                    <span key={tag.id} className="tag-pill">
                        {tag.name}
                        <button className="tag-remove" onClick={() => handleRemoveTag(tag.id)}>&times;</button>
                    </span>
                ))}

                {!isAddingTag ? (
                    <button className="toggle-button" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', width: 'auto' }} onClick={() => setIsAddingTag(true)}>+ Add Tag</button>
                ) : (
                    <form onSubmit={handleAddTag} className="add-tag-form" style={{ margin: 0 }}>
                        <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} className="add-tag-input" placeholder="New tag..." autoFocus />
                        <button type="submit" className="edit-button" style={{ padding: '0.2rem 0.5rem', width: 'auto' }}>Save</button>
                        <button type="button" className="toggle-button" style={{ padding: '0.2rem 0.5rem', width: 'auto' }} onClick={() => setIsAddingTag(false)}>Cancel</button>
                    </form>
                )}
            </div>

            <h2 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Featured In</h2>

            {stories.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: 'var(--color-ink-muted)', textAlign: 'center' }}>
                    This character has not been recorded in any tales yet.
                </p>
            ) : (
                <div className="character-grid">
                    {stories.map(story => (
                        <div key={story.id} className="character-card">
                            <h2>
                                <Link to={`/stories/${story.id}`} className="character-link">
                                    {story.title}
                                </Link>
                            </h2>
                            <h3>{story.publication_date || "Unknown Era"}</h3>

                            <div className="character-details" style={{ display: 'block', borderTop: 'none', padding: 0 }}>
                                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--surface-form)', borderRadius: 'var(--radius-sm)' }}>
                                    <strong>Role:</strong> {story.role || "Unspecified"}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CharacterView;