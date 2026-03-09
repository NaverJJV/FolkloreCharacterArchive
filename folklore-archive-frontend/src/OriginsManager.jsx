import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './OriginsManager.css';

function OriginsManager() {
    const [origins, setOrigins] = useState([]);

    useEffect(() => {
        fetch('http://localhost:3000/api/origins')
            .then(res => res.json())
            .then(data => setOrigins(data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="origins-manager">
            <Link to="/" className="back-link">← Back to Characters</Link>
            <h1>Manage Origins</h1>
            <p>Total Regions/Eras Discovered: {origins.length}</p>

            <div className="origins-list">
                {origins.map(origin => (
                    <div key={origin.id} className="origin-item">
                        <h3>{origin.name}</h3>
                        <p>{origin.description || "No description provided yet."}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default OriginsManager;