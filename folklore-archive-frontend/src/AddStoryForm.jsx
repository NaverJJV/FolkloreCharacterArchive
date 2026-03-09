import { useState } from 'react';
import './AddCharacterForm.css';

function AddStoryForm({ onStoryAdded }) {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        synopsis: '',
        publication_date: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        try {
            const response = await fetch('http://localhost:3000/api/stories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setFormData({ title: '', synopsis: '', publication_date: '' });
                onStoryAdded();
                setIsCollapsed(true);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    return (
        <div className={`add-character-container ${isCollapsed ? 'collapsed' : 'expanded'}`}>
            <div className="form-header" onClick={() => setIsCollapsed(!isCollapsed)}>
                <h2>{isCollapsed ? '+ Add New Story' : '- Hide Form'}</h2>
            </div>

            {!isCollapsed && (
                <form className="add-character-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="title">Story Title:</label>
                        <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required maxLength={255} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="publication_date">Publication Era/Date:</label>
                        <input type="text" id="publication_date" name="publication_date"
                               value={formData.publication_date} onChange={handleChange}
                               placeholder="e.g., c. 2100 BCE, 19th Century" maxLength={100}/>
                    </div>

                    <div className="form-group">
                        <label htmlFor="synopsis">Synopsis:</label>
                        <textarea id="synopsis" name="synopsis" value={formData.synopsis} onChange={handleChange}/>
                    </div>

                    <button type="submit">Save to Library</button>
                </form>
            )}
        </div>
    );
}

export default AddStoryForm;