import {useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import ExportMenu from './ExportMenu';
import './App.css';
import './CharacterCard.css';

function CharacterView() {
    const {id} = useParams();
    const [character, setCharacter] = useState(null);
    const [stories, setStories] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editingField, setEditingField] = useState(null);
    const [editData, setEditData] = useState({
        name: '', alias: '', description: '',
        story_synopsis: '', appearance: '', personality: '', image_url: ''
    });

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
                    description: charData.description || '',
                    story_synopsis: charData.story_synopsis || '',
                    appearance: charData.appearance || '',
                    personality: charData.personality || '',
                    image_url: charData.image_url || ''
                });
                setLoading(false);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleSaveDetail = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/characters/${id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({...editData, origin_name: character.origin_name})
            });
            if (response.ok) {
                setEditingField(null);
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Ensure it's an image
            if (!file.type.startsWith('image/')) {
                alert('Please upload a valid image file.');
                return;
            }
            // Limit size (e.g., 2MB = 2 * 1024 * 1024 bytes)
            if (file.size > 2097152) {
                alert('Image must be less than 2MB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setEditData({...editData, image_url: reader.result});
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddTag = async (e) => {
        e.preventDefault();
        if (!newTag.trim()) return;
        try {
            await fetch(`http://localhost:3000/api/characters/${id}/tags`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name: newTag.trim()})
            });
            setNewTag('');
            setIsAddingTag(false);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemoveTag = async (tagId) => {
        try {
            await fetch(`http://localhost:3000/api/characters/${id}/tags/${tagId}`, {method: 'DELETE'});
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="App"><h2>Loading character...</h2></div>;
    if (!character || character.message) return <div className="App"><h2>Character not found.</h2></div>;

    return (
        <div className="App">
            <nav className="main-nav">
                <Link to="/" className="back-link">← Back to Archive</Link>

                <ExportMenu
                    title={character.name}
                    rawData={character}
                    type="character"
                    targetId="printable-character-area"
                />
            </nav>

            <div id="printable-character-area">
                <div className="character-profile-header">
                    {/* Image Section */}
                    <div className="profile-image-container">
                        {editingField === 'image' ? (
                            <div className="inline-edit-group" style={{flexDirection: 'column'}}>
                                <input type="file" accept="image/*" onChange={handleImageUpload}
                                       style={{fontSize: '0.8rem'}}/>
                                {editData.image_url &&
                                    <img src={editData.image_url} alt="Preview" className="profile-image-preview"/>}
                                <div className="edit-actions" style={{display: 'flex', gap: '5px'}}>
                                    <button onClick={handleSaveDetail} className="edit-button">Save</button>
                                    <button onClick={() => setEditingField(null)} className="toggle-button">Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="profile-image-display" onClick={() => setEditingField('image')}
                                 title="Click to edit portrait">
                                {character.image_url ? (
                                    <img src={character.image_url} alt={character.name}/>
                                ) : (
                                    <div className="profile-image-placeholder">No Portrait</div>
                                )}
                                <div className="image-edit-overlay">&#x270E; Change</div>
                            </div>
                        )}
                    </div>

                    {/* Identity Section */}
                    <div className="profile-identity">
                        {editingField === 'name' ? (
                            <div className="inline-edit-group title-edit">
                                <input type="text" value={editData.name}
                                       onChange={(e) => setEditData({...editData, name: e.target.value})} autoFocus/>
                                <button onClick={handleSaveDetail} className="edit-button">Save</button>
                            </div>
                        ) : (
                            <h1 className="editable-field">
                                {character.name}
                                <button className="inline-edit-icon"
                                        onClick={() => setEditingField('name')}>&#x270E;</button>
                            </h1>
                        )}

                        {editingField === 'alias' ? (
                            <div className="inline-edit-group date-edit">
                                <input type="text" value={editData.alias}
                                       onChange={(e) => setEditData({...editData, alias: e.target.value})}/>
                                <button onClick={handleSaveDetail} className="edit-button">Save</button>
                            </div>
                        ) : (
                            <p className="editable-field story-date" style={{
                                textTransform: 'none',
                                letterSpacing: 'normal',
                                fontSize: '1.2rem',
                                fontStyle: 'italic',
                                margin: 0
                            }}>
                                "{character.alias || "No known alias"}"
                                <button className="inline-edit-icon"
                                        onClick={() => setEditingField('alias')}>&#x270E;</button>
                            </p>
                        )}

                        <p style={{
                            fontFamily: 'var(--font-display)',
                            color: 'var(--color-gold)',
                            letterSpacing: '0.1em',
                            marginTop: '0.5rem'
                        }}>
                            ERA: {character.origin_name || "Unknown"}
                        </p>

                        <div className="tag-container" style={{justifyContent: 'flex-start', margin: '0.5rem 0'}}>
                            {tags.map(tag => (
                                <span key={tag.id} className="tag-pill">
                                {tag.name}
                                    <button className="tag-remove"
                                            onClick={() => handleRemoveTag(tag.id)}>&times;</button>
                            </span>
                            ))}
                            {!isAddingTag ? (
                                <button className="toggle-button"
                                        style={{padding: '0.2rem 0.5rem', fontSize: '0.7rem', width: 'auto'}}
                                        onClick={() => setIsAddingTag(true)}>+ Add Tag</button>
                            ) : (
                                <form onSubmit={handleAddTag} className="add-tag-form" style={{margin: 0}}>
                                    <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)}
                                           className="add-tag-input" placeholder="New tag..." autoFocus/>
                                    <button type="submit" className="edit-button"
                                            style={{padding: '0.2rem 0.5rem', width: 'auto'}}>Save
                                    </button>
                                </form>
                            )}
                        </div>

                        <div className="embedded-description"
                             style={{borderTop: '1px solid var(--border-light)', paddingTop: '1rem'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem'}}>
                                <h3 style={{
                                    margin: 0,
                                    fontFamily: 'var(--font-display)',
                                    color: 'var(--color-ink-soft)',
                                    fontSize: '1.1rem'
                                }}>Description</h3>
                                {editingField !== 'description' && (
                                    <button className="inline-edit-icon" onClick={() => setEditingField('description')}
                                            style={{opacity: 0.5}}>&#x270E;</button>
                                )}
                            </div>

                            {editingField === 'description' ? (
                                <div className="inline-edit-group synopsis-edit">
                                    <textarea value={editData.description}
                                              onChange={(e) => setEditData({...editData, description: e.target.value})}
                                              autoFocus maxLength={1000} style={{minHeight: '100px'}}/>
                                    <div className="edit-actions" style={{
                                        display: 'flex',
                                        gap: '10px',
                                        justifyContent: 'flex-end',
                                        marginTop: '0.5rem'
                                    }}>
                                        <button onClick={() => setEditingField(null)} className="toggle-button">Cancel
                                        </button>
                                        <button onClick={handleSaveDetail} className="edit-button">Save</button>
                                    </div>
                                </div>
                            ) : (
                                <p style={{
                                    margin: 0,
                                    color: 'var(--color-ink-soft)',
                                    whiteSpace: 'pre-wrap',
                                    textAlign: 'left',
                                    lineHeight: '1.6'
                                }}>
                                    {character.description ||
                                        <span style={{fontStyle: 'italic', color: 'var(--color-ink-muted)'}}>No description provided.</span>}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Content Sections */}
                <ProfileSection
                    title="Story Synopsis"
                    field="story_synopsis"
                    value={character.story_synopsis}
                    editValue={editData.story_synopsis}
                    isEditing={editingField === 'story_synopsis'}
                    onEdit={() => setEditingField('story_synopsis')}
                    onChange={(e) => setEditData({...editData, story_synopsis: e.target.value})}
                    onSave={handleSaveDetail}
                    onCancel={() => setEditingField(null)}
                />
                <div className="profile-content-sections">
                    <ProfileSection
                        title="Appearance"
                        field="appearance"
                        value={character.appearance}
                        editValue={editData.appearance}
                        isEditing={editingField === 'appearance'}
                        onEdit={() => setEditingField('appearance')}
                        onChange={(e) => setEditData({...editData, appearance: e.target.value})}
                        onSave={handleSaveDetail}
                        onCancel={() => setEditingField(null)}
                    />
                    <ProfileSection
                        title="Personality"
                        field="personality"
                        value={character.personality}
                        editValue={editData.personality}
                        isEditing={editingField === 'personality'}
                        onEdit={() => setEditingField('personality')}
                        onChange={(e) => setEditData({...editData, personality: e.target.value})}
                        onSave={handleSaveDetail}
                        onCancel={() => setEditingField(null)}
                    />
                </div>
            </div>

            <h2 style={{
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '0.5rem',
                marginTop: '3rem'
            }}>Featured In</h2>
            {stories.length === 0 ? (
                <p style={{fontStyle: 'italic', color: 'var(--color-ink-muted)', textAlign: 'center'}}>This character
                    has not been recorded in any tales yet.</p>
            ) : (
                <div className="character-grid">
                    {stories.map(story => (
                        <div key={story.id} className="character-card">
                            <h2><Link to={`/stories/${story.id}`} className="character-link">{story.title}</Link></h2>
                            <h3>{story.publication_date || "Unknown Era"}</h3>
                            <div className="character-details"
                                 style={{display: 'block', borderTop: 'none', padding: 0}}>
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '0.75rem',
                                    backgroundColor: 'var(--surface-form)',
                                    borderRadius: 'var(--radius-sm)'
                                }}>
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

// Reusable component for the text sections
function ProfileSection({title, value, editValue, isEditing, onEdit, onChange, onSave, onCancel}) {
    return (
        <div className="profile-section"
             style={{marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem'}}>
                <h3 style={{margin: 0, fontFamily: 'var(--font-display)', color: 'var(--color-ink-soft)'}}>{title}</h3>
                {!isEditing &&
                    <button className="inline-edit-icon" onClick={onEdit} style={{opacity: 0.5}}>&#x270E;</button>}
            </div>

            {isEditing ? (
                <div className="inline-edit-group synopsis-edit">
                    <textarea value={editValue} onChange={onChange} autoFocus maxLength={2000}/>
                    <div className="edit-actions"
                         style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '0.5rem'}}>
                        <button onClick={onCancel} className="toggle-button">Cancel</button>
                        <button onClick={onSave} className="edit-button">Save</button>
                    </div>
                </div>
            ) : (
                <p style={{margin: 0, color: 'var(--color-ink-soft)', whiteSpace: 'pre-wrap'}}>
                    {value || <span style={{
                        fontStyle: 'italic',
                        color: 'var(--color-ink-muted)'
                    }}>No {title.toLowerCase()} provided.</span>}
                </p>
            )}
        </div>
    );
}

export default CharacterView;