import { useState } from 'react';
import './AddCharacterForm.css'; // Reusing styling container

function AddOriginForm({ onOriginAdded }) {
    const [isCollapsed, setIsCollapsed] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        historical_era: '',
        description: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        try {
            const response = await fetch('http://localhost:3000/api/origins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setFormData({ name: '', historical_era: '', description: '' });
                onOriginAdded();
                setIsCollapsed(true);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    return (
        <div className={`add-character-container ${isCollapsed ? 'collapsed' : 'expanded'}`}>
            <div className="form-header" onClick={() => setIsCollapsed(!isCollapsed)}>
                <h2>{isCollapsed ? '+ Add New Origin' : '- Hide Form'}</h2>
            </div>

            {!isCollapsed && (
                <form className="add-character-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Origin Name:</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required maxLength={255} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="historical_era">Historical Era:</label>
                        <input type="text" id="historical_era" name="historical_era" value={formData.historical_era} onChange={handleChange} maxLength={255} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description:</label>
                        <textarea id="description" name="description" value={formData.description} onChange={handleChange} />
                    </div>

                    <button type="submit">Save to Library</button>
                </form>
            )}
        </div>
    );
}

export default AddOriginForm;