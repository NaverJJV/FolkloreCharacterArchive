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
                        onUpdate={fetchOrigins}
                        onDelete={handleDeleteOrigin}
                    />
                ))}
            </div>
        </div>
    );
}

export default OriginsManager;