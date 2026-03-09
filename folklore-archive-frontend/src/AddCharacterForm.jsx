import { useState } from 'react';

function AddCharacterForm({ onCharacterAdded }) {
  // State to hold the form data
  const [formData, setFormData] = useState({
    name: '',
    alias: '',
    core_traits: '',
    origin_id: 1 // Defaulting to the first origin (e.g., Post-Civil War America)
  });

  // Update state whenever an input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handle the form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents the browser from reloading the page

    try {
      const response = await fetch('http://localhost:3000/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Clear the form after a successful submission
        setFormData({ name: '', alias: '', core_traits: '', origin_id: 1 });
        
        // Notify the parent component (App.jsx) that a new character was added
        onCharacterAdded();
      } else {
        console.error('Failed to add character');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <form className="add-character-form" onSubmit={handleSubmit}>
      <h2>Add a New Figure</h2>
      
      <div className="form-group">
        <label htmlFor="name">Name:</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label htmlFor="alias">Alias:</label>
        <input type="text" id="alias" name="alias" value={formData.alias} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label htmlFor="core_traits">Core Traits:</label>
        <input type="text" id="core_traits" name="core_traits" value={formData.core_traits} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label htmlFor="origin_id">Origin:</label>
        <select id="origin_id" name="origin_id" value={formData.origin_id} onChange={handleChange}>
          <option value={1}>Post-Civil War America</option>
          <option value={2}>American Frontier</option>
          <option value={3}>6th Century Britain</option>
        </select>
      </div>

      <button type="submit">Add Character</button>
    </form>
  );
}

export default AddCharacterForm;