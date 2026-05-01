import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import StoryCharacterCard from './StoryCharacterCard';
import './App.css';
import './CharacterCard.css';

function StoryView() {
    const { id } = useParams();
    const [story, setStory] = useState(null);
    const [characters, setCharacters] = useState([]);
    const [allCharacters, setAllCharacters] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Inline Edit States ---
    const [editingField, setEditingField] = useState(null);
    const [editStoryData, setEditStoryData] = useState({
        title: '', synopsis: '', content: '', publication_date: '', image_url: ''
    });

    // --- Tag States ---
    const [newTag, setNewTag] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);

    // --- Add Character States ---
    const [isAdding, setIsAdding] = useState(false);
    const [newCharId, setNewCharId] = useState('');
    const [newCharRole, setNewCharRole] = useState('');
    const [charSearchTerm, setCharSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const fetchData = () => {
        Promise.all([
            fetch(`http://localhost:3000/api/stories/${id}`).then(res => res.json()),
            fetch(`http://localhost:3000/api/stories/${id}/characters`).then(res => res.json()),
            fetch(`http://localhost:3000/api/characters`).then(res => res.json()),
            fetch(`http://localhost:3000/api/stories/${id}/tags`).then(res => res.json())
        ])
            .then(([storyData, linkedChars, fullRoster, tagData]) => {
                setStory(storyData);
                setCharacters(linkedChars);
                setAllCharacters(fullRoster);
                setTags(tagData);

                setEditStoryData({
                    title: storyData.title,
                    synopsis: storyData.synopsis || '',
                    content: storyData.content || '',
                    publication_date: storyData.publication_date || '',
                    image_url: storyData.image_url || ''
                });

                setLoading(false);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchData(); }, [id]);

    // --- Story Detail Logic ---
    const handleSaveStoryDetail = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/stories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editStoryData)
            });

            if (response.ok) {
                setEditingField(null);
                fetchData();
            } else {
                const data = await response.json();
                alert(data.message || "Failed to update story.");
            }
        } catch (err) { console.error(err); }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) { alert('Please upload a valid image file.'); return; }
            if (file.size > 2097152) { alert('Image must be less than 2MB.'); return; }

            const reader = new FileReader();
            reader.onloadend = () => {
                setEditStoryData({ ...editStoryData, image_url: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    // --- Tag Logic ---
    const handleAddTag = async (e) => {
        e.preventDefault();
        if (!newTag.trim()) return;
        try {
            await fetch(`http://localhost:3000/api/stories/${id}/tags`, {
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
            await fetch(`http://localhost:3000/api/stories/${id}/tags/${tagId}`, { method: 'DELETE' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    // --- Character Junction Logic ---
    const handleDetach = async (characterId) => {
        try {
            await fetch(`http://localhost:3000/api/stories/${id}/characters/${characterId}`, { method: 'DELETE' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleUpdateRole = async (characterId, newRole) => {
        try {
            await fetch(`http://localhost:3000/api/character_stories`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ character_id: characterId, story_id: id, role: newRole })
            });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleAttachSubmit = async (e) => {
        e.preventDefault();
        if (!newCharId) { alert("Please select a character from the list."); return; }
        try {
            const res = await fetch(`http://localhost:3000/api/character_stories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ character_id: newCharId, story_id: id, role: newCharRole })
            });
            if (res.ok) {
                setIsAdding(false); setNewCharId(''); setNewCharRole(''); setCharSearchTerm(''); fetchData();
            } else {
                const data = await res.json(); alert(data.message);
            }
        } catch (err) { console.error(err); }
    };

    // --- Render Checks ---
    if (loading) return <div className="App"><h2>Loading story details...</h2></div>;
    if (!story || story.message) return <div className="App"><h2>Story not found.</h2></div>;

    const availableCharacters = allCharacters.filter(ac => !characters.some(lc => lc.id === ac.id));
    const filteredDropdown = availableCharacters.filter(c => c.name.toLowerCase().includes(charSearchTerm.toLowerCase()));
    const displayDate = story.publication_date || "Unknown Era";

    return (
        <div className="App">
            <nav className="main-nav">
                <Link to="/stories" className="back-link">← Back to Stories Library</Link>
            </nav>

            {/* --- NEW PROFILE HEADER LAYOUT --- */}
            <div className="character-profile-header">

                {/* Image Section */}
                <div className="profile-image-container">
                    {editingField === 'image' ? (
                        <div className="inline-edit-group" style={{ flexDirection: 'column' }}>
                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: '0.8rem' }} />
                            {editStoryData.image_url && <img src={editStoryData.image_url} alt="Preview" className="profile-image-preview" />}
                            <div className="edit-actions" style={{ display: 'flex', gap: '5px' }}>
                                <button onClick={handleSaveStoryDetail} className="edit-button">Save</button>
                                <button onClick={() => setEditingField(null)} className="toggle-button">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div className="profile-image-display" onClick={() => setEditingField('image')} title="Click to edit illustration">
                            {story.image_url ? (
                                <img src={story.image_url} alt={story.title} />
                            ) : (
                                <div className="profile-image-placeholder" style={{ textAlign: 'center', padding: '1rem' }}>No Illustration</div>
                            )}
                            <div className="image-edit-overlay">&#x270E; Change</div>
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <div className="profile-identity">
                    {/* TITLE */}
                    {editingField === 'title' ? (
                        <div className="inline-edit-group title-edit">
                            <input type="text" value={editStoryData.title} onChange={(e) => setEditStoryData({...editStoryData, title: e.target.value})} maxLength={255} autoFocus />
                            <button onClick={handleSaveStoryDetail} className="edit-button">Save</button>
                        </div>
                    ) : (
                        <h1 className="editable-field">
                            {story.title}
                            <button className="inline-edit-icon" onClick={() => setEditingField('title')} title="Edit Title">&#x270E;</button>
                        </h1>
                    )}

                    {/* ERA/DATE */}
                    {editingField === 'date' ? (
                        <div className="inline-edit-group date-edit">
                            <input type="text" value={editStoryData.publication_date} onChange={(e) => setEditStoryData({...editStoryData, publication_date: e.target.value})} placeholder="e.g., c. 2100 BCE" maxLength={100} />
                            <button onClick={handleSaveStoryDetail} className="edit-button">Save</button>
                        </div>
                    ) : (
                        <p className="editable-field story-date" style={{ margin: 0, justifyContent: 'flex-start' }}>
                            ERA: {displayDate}
                            <button className="inline-edit-icon" onClick={() => setEditingField('date')} title="Edit Era">&#x270E;</button>
                        </p>
                    )}

                    {/* TAGS */}
                    <div className="tag-container" style={{ justifyContent: 'flex-start', margin: '0.5rem 0' }}>
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

                    {/* SYNOPSIS */}
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                        {editingField === 'synopsis' ? (
                            <div className="inline-edit-group synopsis-edit">
                                <textarea value={editStoryData.synopsis} onChange={(e) => setEditStoryData({...editStoryData, synopsis: e.target.value})} autoFocus placeholder="Enter a brief synopsis..." maxLength={1000}/>
                                <div className="edit-actions" style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                                    <button onClick={handleSaveStoryDetail} className="edit-button">Save</button>
                                    <button onClick={() => setEditingField(null)} className="toggle-button">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className="editable-field story-synopsis preamble" style={{ alignItems: 'flex-start', margin: 0 }}>
                                <p style={{ textAlign: 'left', margin: 0, width: '100%' }}>{story.synopsis || "No synopsis available."}</p>
                                <button className="inline-edit-icon" onClick={() => setEditingField('synopsis')} title="Edit Synopsis" style={{ alignSelf: 'flex-start', marginTop: '5px' }}>&#x270E;</button>
                            </div>
                        )}
                    </div>

                    {/* TIMESTAMP */}
                    {story.updated_at && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', fontStyle: 'italic', marginTop: '1rem', textAlign: 'left' }}>
                            Last modified: {new Date(story.updated_at).toLocaleString()}
                        </p>
                    )}
                </div>
            </div>

            {/* --- THE TALE (Main Content) --- */}
            <div className="story-content-section" style={{ position: 'relative', maxWidth: '850px', margin: '2rem auto 4rem' }}>
                <div className="tale-header">
                    <h2>The Tale</h2>
                    {editingField !== 'content' && (
                        <button className="edit-tale-btn" onClick={() => setEditingField('content')}>
                            <span>&#x270E;</span> Edit Tale
                        </button>
                    )}
                </div>

                <div className="story-content-container" style={{ margin: 0 }}>
                    {editingField === 'content' ? (
                        <div className="inline-edit-group content-edit">
                            <textarea
                                value={editStoryData.content}
                                onChange={(e) => setEditStoryData({...editStoryData, content: e.target.value})}
                                autoFocus
                                placeholder="Pen your tale here..."
                            />
                            <div className="edit-actions" style={{ display: 'flex', gap: '10px', marginTop: '1rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => setEditingField(null)} className="toggle-button">Cancel</button>
                                <button onClick={handleSaveStoryDetail} className="edit-button">Save Tale</button>
                            </div>
                        </div>
                    ) : (
                        <div className="story-body-display">
                            <div className="story-text">
                                {story.content ? (
                                    story.content.split('\n').map((paragraph, index) => (
                                        <p key={index}>{paragraph}</p>
                                    ))
                                ) : (
                                    <p className="empty-content">Click "Edit Tale" to begin chronicling this story...</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- CAST OF CHARACTERS --- */}
            <h2 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Cast of Characters</h2>

            <div className="character-grid">
                {characters.map(char => (
                    <StoryCharacterCard key={char.id} char={char} onDetach={handleDetach} onUpdateRole={handleUpdateRole} />
                ))}

                {/* ADD CHARACTER CARD */}
                {!isAdding ? (
                    <div className="character-card add-card" onClick={() => setIsAdding(true)}>
                        <div className="add-card-content">
                            <span className="plus-icon">+</span>
                            <h3>Add Character</h3>
                        </div>
                    </div>
                ) : (
                    <div className="character-card edit-mode" style={{ justifyContent: 'center', overflow: 'visible' }}>
                        <form onSubmit={handleAttachSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <h3 style={{ margin: 0, color: 'var(--color-ink)', fontSize: '1.1rem' }}>Attach Character</h3>

                            <div className="custom-dropdown-container">
                                <input
                                    type="text"
                                    placeholder="Search character name..."
                                    value={charSearchTerm}
                                    onChange={(e) => { setCharSearchTerm(e.target.value); setNewCharId(''); }}
                                    onFocus={() => setShowDropdown(true)}
                                    onBlur={() => setShowDropdown(false)}
                                    className="dropdown-input"
                                />
                                {showDropdown && (
                                    <div className="dropdown-list">
                                        {filteredDropdown.length > 0 ? filteredDropdown.map(c => (
                                            <div
                                                key={c.id}
                                                className="dropdown-item"
                                                onMouseDown={() => { setNewCharId(c.id); setCharSearchTerm(c.name); setShowDropdown(false); }}
                                            >
                                                {c.name}
                                            </div>
                                        )) : (
                                            <div className="dropdown-item empty">No characters found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <input type="text" placeholder="Role in story (Max 100 chars)" value={newCharRole} onChange={(e) => setNewCharRole(e.target.value)} maxLength={100} />

                            <div className="card-actions">
                                <button type="submit" className="edit-button">Save</button>
                                <button type="button" className="toggle-button" onClick={() => { setIsAdding(false); setCharSearchTerm(''); }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StoryView;