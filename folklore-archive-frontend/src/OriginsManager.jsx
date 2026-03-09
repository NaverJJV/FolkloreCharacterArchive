import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import OriginRow from './OriginRow';

function OriginsManager() {
    const [origins, setOrigins] = useState([]);
    const [error, setError] = useState(null); // New state for errors

    const fetchOrigins = () => {
        fetch('http://localhost:3000/api/origins')
            .then(res => res.json())
            .then(data => setOrigins(data))
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchOrigins(); }, []);

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

    return (
        <div className="origins-manager">
            <nav className="main-nav">
                <Link to="/" className="back-link">← Back to Character Archive</Link>
            </nav>

            <h1>Origins Library</h1>

            {/* Visual Error Notification */}
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

            <div className="origins-list">
                {origins.map(origin => (
                    <OriginRow
                        key={origin.id}
                        origin={origin}
                        onUpdate={handleUpdateOrigin}
                        onDelete={handleDeleteOrigin}
                    />
                ))}
            </div>
        </div>
    );
}

export default OriginsManager;