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
    const [loading, setLoading] = useState(true);

    // --- Inline Edit States ---
    const [editingField, setEditingField] = useState(null); // 'title', 'date', or 'synopsis'
    const [editStoryData, setEditStoryData] = useState({ title: '', synopsis: '', publication_date: '' });

    // --- Add Character States ---
    const [isAdding, setIsAdding] = useState(false);
    const [newCharId, setNewCharId] = useState('');
    const [newCharRole, setNewCharRole] = useState('');

    // Custom Dropdown States
    const [charSearchTerm, setCharSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const fetchData = () => {
        Promise.all([
            fetch(`http://localhost:3000/api/stories/${id}`).then(res => res.json()),
            fetch(`http://localhost:3000/api/stories/${id}/characters`).then(res => res.json()),
            fetch(`http://localhost:3000/api/characters`).then(res => res.json())
        ])
            .then(([storyData, linkedChars, fullRoster]) => {
                setStory(storyData);
                setCharacters(linkedChars);
                setAllCharacters(fullRoster);

                // Populate edit state with formatted date
                setEditStoryData({
                    title: storyData.title,
                    synopsis: storyData.synopsis || '',
                    publication_date: storyData.publication_date ? new Date(storyData.publication_date).toISOString().split('T')[0] : ''
                });

                setLoading(false);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchData(); }, [id]);

    // --- Story Inline Edit Logic ---
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
        } catch (err) {
            console.error(err);
        }
    };

    // --- Character Junction Logic ---
    const handleDetach = async (characterId) => { /* Same as before */
        try {
            await fetch(`http://localhost:3000/api/stories/${id}/characters/${characterId}`, { method: 'DELETE' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleUpdateRole = async (characterId, newRole) => { /* Same as before */
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
        if (!newCharId) {
            alert("Please select a character from the list.");
            return;
        }

        try {
            const res = await fetch(`http://localhost:3000/api/character_stories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ character_id: newCharId, story_id: id, role: newCharRole })
            });

            if (res.ok) {
                setIsAdding(false);
                setNewCharId('');
                setNewCharRole('');
                setCharSearchTerm(''); // Reset search
                fetchData();
            } else {
                const data = await res.json();
                alert(data.message);
            }
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="App"><h2>Loading story details...</h2></div>;
    if (!story || story.message) return <div className="App"><h2>Story not found.</h2></div>;

    // Filter available characters for the dropdown
    const availableCharacters = allCharacters.filter(ac => !characters.some(lc => lc.id === ac.id));
    const filteredDropdown = availableCharacters.filter(c => c.name.toLowerCase().includes(charSearchTerm.toLowerCase()));
    const formattedDate = story.publication_date ? new Date(story.publication_date).toLocaleDateString() : "Unknown Date";

    return (
        <div className="App">
            <nav className="main-nav">
                <Link to="/stories" className="back-link">← Back to Stories Library</Link>
            </nav>

            <div className="story-header-container">
                {/* TITLE EDIT */}
                {editingField === 'title' ? (
                    <div className="inline-edit-group title-edit">
                        <input type="text" value={editStoryData.title} onChange={(e) => setEditStoryData({...editStoryData, title: e.target.value})} maxLength={255} autoFocus />
                        <button onClick={handleSaveStoryDetail} className="edit-button">Save</button>
                        <button onClick={() => setEditingField(null)} className="toggle-button">Cancel</button>
                    </div>
                ) : (
                    <h1 className="editable-field">
                        {story.title}
                        <button className="inline-edit-icon" onClick={() => setEditingField('title')} title="Edit Title">&#x270E;</button>
                    </h1>
                )}

                {/* DATE EDIT */}
                {editingField === 'date' ? (
                    <div className="inline-edit-group date-edit">
                        <input type="date" value={editStoryData.publication_date} onChange={(e) => setEditStoryData({...editStoryData, publication_date: e.target.value})} />
                        <button onClick={handleSaveStoryDetail} className="edit-button">Save</button>
                        <button onClick={() => setEditingField(null)} className="toggle-button">Cancel</button>
                    </div>
                ) : (
                    <p className="editable-field story-date">
                        PUBLISHED: {formattedDate}
                        <button className="inline-edit-icon" onClick={() => setEditingField('date')} title="Edit Date">&#x270E;</button>
                    </p>
                )}

                {/* SYNOPSIS EDIT */}
                {editingField === 'synopsis' ? (
                    <div className="inline-edit-group synopsis-edit">
                        <textarea value={editStoryData.synopsis} onChange={(e) => setEditStoryData({...editStoryData, synopsis: e.target.value})} autoFocus />
                        <div className="edit-actions">
                            <button onClick={handleSaveStoryDetail} className="edit-button">Save</button>
                            <button onClick={() => setEditingField(null)} className="toggle-button">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div className="editable-field story-synopsis">
                        <p>{story.synopsis}</p>
                        <button className="inline-edit-icon" onClick={() => setEditingField('synopsis')} title="Edit Synopsis">&#x270E;</button>
                    </div>
                )}
            </div>

            <h2 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Cast of Characters</h2>

            <div className="character-grid">
                {characters.map(char => (
                    <StoryCharacterCard key={char.id} char={char} onDetach={handleDetach} onUpdateRole={handleUpdateRole} />
                ))}

                {/* The "Add Character" Card */}
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

                            {/* CUSTOM SEARCHABLE DROPDOWN */}
                            <div className="custom-dropdown-container">
                                <input
                                    type="text"
                                    placeholder="Search character name..."
                                    value={charSearchTerm}
                                    onChange={(e) => {
                                        setCharSearchTerm(e.target.value);
                                        setNewCharId(''); // Clear ID if they start typing again
                                    }}
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
                                                // onMouseDown fires before onBlur, allowing the selection to process
                                                onMouseDown={() => {
                                                    setNewCharId(c.id);
                                                    setCharSearchTerm(c.name);
                                                    setShowDropdown(false);
                                                }}
                                            >
                                                {c.name}
                                            </div>
                                        )) : (
                                            <div className="dropdown-item empty">No characters found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <input
                                type="text"
                                placeholder="Role in story (Max 100 chars)"
                                value={newCharRole}
                                onChange={(e) => setNewCharRole(e.target.value)}
                                maxLength={100}
                            />

                            <div className="card-actions">
                                <button type="submit" className="edit-button">Save</button>
                                <button type="button" className="toggle-button" onClick={() => {
                                    setIsAdding(false);
                                    setCharSearchTerm('');
                                }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StoryView;