import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import CreateTournamentModal from '../components/CreateTournamentModal';
import './OrganizerDashboard.css';

const OrganizerDashboard = () => {
    const { user, token, logout } = useContext(AuthContext);
    const organizer = user; // Maps universal user safely back to legacy Organizer hooks
    const [tournaments, setTournaments] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const fetchTournaments = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/tournaments/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTournaments(res.data.tournaments || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (token) fetchTournaments();
    }, [token]);

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav">
                <div className="nav-brand gradient-text">CSCL Organizer Hub</div>
                <button className="logout-btn" onClick={logout}>Logout</button>
            </nav>

            <main className="dashboard-content">
                <header className="profile-header glass-card">
                    <div className="profile-main">
                        {organizer?.logo ? (
                            <img src={organizer.logo} alt="Organization Logo" className="profile-logo" />
                        ) : (
                            <div className="profile-logo-placeholder">
                                {organizer?.org_name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="profile-info">
                            <h1>{organizer?.org_name}</h1>
                            <p>Total Tournaments Hosted: <span className="highlight-text">{tournaments.length}</span></p>
                        </div>
                    </div>
                    <button className="new-tournament-btn" onClick={() => setShowModal(true)}>
                        + Organize New Tournament
                    </button>
                </header>

                <section className="tournaments-section glass-card">
                    <h2>Tournament History</h2>
                    {tournaments.length === 0 ? (
                        <p className="empty-state">No tournaments created yet. Start your first competition!</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="tournaments-table">
                                <thead>
                                    <tr>
                                        <th>Tournament Name</th>
                                        <th>Date & Time</th>
                                        <th>Location</th>
                                        <th>Reg. Fee</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tournaments.map(t => (
                                        <tr key={t.id}>
                                            <td>{t.name}</td>
                                            <td>{new Date(t.date_time).toLocaleString()}</td>
                                            <td>{t.location || 'TBA'}</td>
                                            <td>${t.registration_fee}</td>
                                            <td><span className={`status-badge ${t.status}`}>{t.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>

            {showModal && (
                <CreateTournamentModal
                    onClose={() => setShowModal(false)}
                    onCreated={fetchTournaments}
                />
            )}
        </div>
    );
};

export default OrganizerDashboard;
