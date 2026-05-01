import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import OriginRow from './OriginRow';
import AddOriginForm from './AddOriginForm';
import './OriginsManager.css';

function OriginsManager() {
    const [origins, setOrigins] = useState([]);
    const [error, setError] = useState(null); // Error State
    const [searchTerm, setSearchTerm] = useState(''); // Search State

    const fetchOrigins = () => {
        fetch('http://localhost:3000/api/origins')
            .then(res => res.json())
            .then(data => setOrigins(data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchOrigins();
    }, []);

    const handleDeleteOrigin = async (id) => {
        setError(null); // Clear previous errors

        try {
            const response = await fetch(`http://localhost:3000/api/origins/${id}`, {
                method: 'DELETE',
            });
            const data = await response.json();

            if (response.ok) {
                fetchOrigins();
            } else {
                // Set the error message to display at the top
                setError(data.message);
            }
        } catch (err) {
            setError("A network error occurred.");
        }
    };

    const handleUpdateOrigin = async (id, updatedData) => {
        setError(null); // Clear any existing errors

        try {
            const response = await fetch(`http://localhost:3000/api/origins/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });

            if (response.ok) {
                // If successful, refresh the list to show the new data
                fetchOrigins();
            } else {
                // If the server rejects it (e.g., failing validation), show the error
                const data = await response.json();
                setError(data.message || "Failed to update origin.");
            }
        } catch (err) {
            console.error('Error updating origin:', err);
            setError("A network error occurred while saving.");
        }
    };

    const filteredOrigins = origins.filter(origin => {
        const searchLower = searchTerm.toLowerCase();

        // We use (origin.field || '') to prevent crashes if a field is null in the database
        const nameMatch = (origin.name || '').toLowerCase().includes(searchLower);
        const eraMatch = (origin.historical_era || '').toLowerCase().includes(searchLower);
        const descMatch = (origin.description || '').toLowerCase().includes(searchLower);

        return nameMatch || eraMatch || descMatch;
    });

    return (
        <div className="origins-manager">
            <nav className="main-nav">
                <Link to="/" className="back-link">← Back to Character Archive</Link>
            </nav>

            <h1>Eras Library</h1>

            {error && (
                <div className="error-banner">
                    <div className="error-content">
                        <strong>Action Denied:</strong> {error}
                    </div>
                    <button className="close-error" onClick={() => setError(null)}>
                        &times;
                    </button>
                </div>
            )}

            <AddOriginForm onOriginAdded={fetchOrigins} />

            <div className="search-filter-bar" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    placeholder="Search by name, era, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    style={{ flex: 1, maxWidth: '600px' }}
                />
            </div>

            <div className="origins-list">
                {filteredOrigins.map(origin => (
                    <OriginRow
                        key={origin.id}
                        origin={origin}
                        onUpdate={handleUpdateOrigin}
                        onDelete={handleDeleteOrigin}
                    />
                ))}

                {filteredOrigins.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
                        No origins match your search.
                    </p>
                )}
            </div>
        </div>
    );
}

export default OriginsManager;