import React, { useState } from 'react';
import axios from 'axios';

const UploadComponent = () => {
    const [file, setFile] = useState(null);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleParse = async () => {
        if (!file) {
            alert("Please select a file first.");
            return;
        }
        const formData = new FormData();
        formData.append('demoFile', file);

        try {
            const response = await axios.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('Response data:', response.data);
            setStats(response.data);
            setError(null);
        } catch (error) {
            console.error('Error parsing the demo file:', error);
            setError('Failed to parse the demo file. Please try again.');
        }
    };

    const renderTeamStats = (team, teamName) => (
        <div>
            <h3>{teamName}</h3>
            {team ? (
                <table>
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Kills</th>
                            <th>Deaths</th>
                            <th>KDR</th>
                            <th>HS%</th>
                            <th>MVPs</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(team).map(([player, stats]) => (
                            <tr key={player}>
                                <td>{player}</td>
                                <td>{stats.kills}</td>
                                <td>{stats.deaths}</td>
                                <td>{stats.kdr}</td>
                                <td>{stats.hsPercentage}%</td>
                                <td>{stats.mvps}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No data available for {teamName}</p>
            )}
        </div>
    );

    return (
        <div>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleParse}>Parse</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {stats && (
                <div>
                    {renderTeamStats(stats.CT, "Counter-Terrorists")}
                    {renderTeamStats(stats.TERRORIST, "Terrorists")}
                </div>
            )}
        </div>
    );
};

export default UploadComponent;
