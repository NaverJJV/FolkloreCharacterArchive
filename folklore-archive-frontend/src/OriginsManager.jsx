import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import OriginRow from './OriginRow';

function OriginsManager() {
    const [origins, setOrigins] = useState([]);

    const fetchOrigins = () => {
        fetch('http://localhost:3000/api/origins')
            .then(res => res.json())
            .then(data => setOrigins(data))
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchOrigins(); }, []);

    const handleUpdateOrigin = async (id, updatedData) => {
        try {
            const response = await fetch(`http://localhost:3000/api/origins/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });

            if (response.ok) {
                fetchOrigins(); // Refresh the list
            }
        } catch (error) {
            console.error('Error updating origin:', error);
        }
    };

    return (
        <div className="origins-manager">
            <nav className="main-nav">
                <Link to="/" className="back-link">← Back to Character Archive</Link>
            </nav>
            <h1>Origins Library</h1>
            <div className="origins-list">
                {origins.map(origin => (
                    <OriginRow
                        key={origin.id}
                        origin={origin}
                        onUpdate={handleUpdateOrigin}
                    />
                ))}
            </div>
        </div>
    );
}

export default OriginsManager;