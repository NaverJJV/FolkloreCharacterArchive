import {useState} from 'react';
import './AddCharacterForm.css';

function AddCharacterForm({onCharacterAdded}) {
    const [isCollapsed, setIsCollapsed] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        alias: '',
        description: '',
        origin_name: ''
    });

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prevData) => ({...prevData, [name]: value}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.origin_name.trim()) return;

        try {
            const response = await fetch('http://localhost:3000/api/characters', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setFormData({name: '', alias: '', description: '', origin_name: ''});
                onCharacterAdded();
                setIsCollapsed(true); // Automatically collapse after successful addition
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    return (
        <div className={`add-character-container ${isCollapsed ? 'collapsed' : 'expanded'}`}>
            <div className="form-header" onClick={() => setIsCollapsed(!isCollapsed)}>
                <h2>{isCollapsed ? '+ Add New Character' : '- Hide Form'}</h2>
            </div>

            {!isCollapsed && (
                <form className="add-character-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Name:</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required
                               maxLength={255}/>
                    </div>

                    <div className="form-group">
                        <label htmlFor="alias">Alias:</label>
                        <input type="text" id="alias" name="alias" value={formData.alias} onChange={handleChange} maxLength={255}/>
                    </div>

                    <div className="form-group">
                        <label htmlFor="origin_name">Era (Setting or Time Period):</label>
                        <input type="text" id="origin_name" name="origin_name" value={formData.origin_name}
                               onChange={handleChange} required maxLength={255}/>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Core Traits:</label>
                        <textarea id="description" name="description" value={formData.description}
                                  onChange={handleChange} maxLength={1000}/>
                    </div>

                    <button type="submit">Save to Archive</button>
                </form>
            )}
        </div>
    );
}

export default AddCharacterForm;