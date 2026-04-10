import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import CreateTournamentModal from '../components/CreateTournamentModal';
import TournamentDetailsModal from '../components/TournamentDetailsModal';
import TeamDetailsModal from '../components/TeamDetailsModal';
import QRScannerModal from '../components/QRScannerModal';
import MatchSetupModal from '../components/MatchSetupModal';
import BattleLoader from '../components/BattleLoader';
import './OrganizerDashboard.css';

const OrganizerDashboard = () => {
    const { user, token, logout, updateUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [organizer, setOrganizer] = useState(user);
    const [tournaments, setTournaments] = useState([]);
    const [applications, setApplications] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [selectedRegForDetails, setSelectedRegForDetails] = useState(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isMatchSetupOpen, setIsMatchSetupOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/organizers/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) {
                setOrganizer(res.data);
                updateUser(res.data);
            }
        } catch (err) {
            console.error("Organizer profile sync fail:", err);
        }
    };

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

    const fetchApplications = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/registrations/organizer', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApplications(res.data.registrations || []);
        } catch (err) {
            console.error("Error fetching applications:", err);
        }
    };

    const handleApprove = async (regId) => {
        try {
            await axios.put(`http://localhost:5000/api/registrations/${regId}/status`, 
                { status: 'approved' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchApplications(); // Refresh list
        } catch (err) {
            alert("Failed to approve team. Please try again.");
        }
    };

    const handleScanSuccess = async (qrData) => {
        try {
            const res = await axios.post('http://localhost:5000/api/registrations/scan', 
                { qr_data: qrData },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(res.data.msg || "Team Arrived!");
            setIsScannerOpen(false);
            fetchApplications(); // Refresh to show them in the arrived table
        } catch (err) {
            console.error("Scan error:", err);
            alert(err.response?.data?.error || "QR Scan failed verification.");
        }
    };

    useEffect(() => {
        const init = async () => {
            if (token) {
                setLoading(true);
                await Promise.all([
                    fetchProfile(),
                    fetchTournaments(),
                    fetchApplications()
                ]);
                setLoading(false);
            }
        };
        init();
    }, [token]);

    if (loading) return <BattleLoader label="Syncing Organizer Intelligence..." />;

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
                    <div className="header-actions">
                        <button className="scan-qr-btn" onClick={() => navigate('/start-match')} style={{ background: 'linear-gradient(135deg, #7000FF 0%, #FF2E93 100%)' }}>
                            🔥 Start Match Setup
                        </button>
                        <button className="scan-qr-btn" onClick={() => setIsScannerOpen(true)}>
                            📷 Scan Arrival QR
                        </button>
                        <button className="new-tournament-btn" onClick={() => setShowModal(true)}>
                            + Organize New Tournament
                        </button>
                    </div>
                </header>

                <section className="arrived-section glass-card">
                    <h2>Teams Arrived at Ground</h2>
                    {applications.filter(app => app.status === 'arrived').length === 0 ? (
                        <p className="empty-state">No teams have checked in yet today.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="applications-table arrived-table">
                                <thead>
                                    <tr>
                                        <th>Team Name</th>
                                        <th>Tournament</th>
                                        <th>Check-in Time</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.filter(app => app.status === 'arrived').map(app => (
                                        <tr key={app.id}>
                                            <td className="team-name-cell arrived-name">{app.team_name}</td>
                                            <td>{app.tournament_name}</td>
                                            <td>
                                                <span className="arrival-timestamp">
                                                    ✅ Just Now
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    className="view-team-btn"
                                                    onClick={() => setSelectedRegForDetails(app)}
                                                >
                                                    View Squad
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="applications-section glass-card">
                    <h2>Entry Applications & Approvals</h2>
                    {applications.filter(app => app.status !== 'arrived').length === 0 ? (
                        <p className="empty-state">No pending or approved applications found.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="applications-table">
                                <thead>
                                    <tr>
                                        <th>Team Name</th>
                                        <th>Tournament</th>
                                        <th>Status</th>
                                        <th>Contact</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.filter(app => app.status !== 'arrived').map(app => (
                                        <tr key={app.id}>
                                            <td className="team-name-cell">{app.team_name}</td>
                                            <td>{app.tournament_name}</td>
                                            <td>
                                                <span className={`status-badge ${app.status}`}>
                                                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                                </span>
                                            </td>
                                            <td>{app.contact_number}</td>
                                            <td className="action-cell">
                                                <button 
                                                    className="view-team-btn"
                                                    onClick={() => setSelectedRegForDetails(app)}
                                                >
                                                    View Squad
                                                </button>
                                                {app.status === 'pending' && (
                                                    <button 
                                                        className="approve-btn"
                                                        onClick={() => handleApprove(app.id)}
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

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
                                        <th>Action</th>
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
                                            <td>
                                                <button 
                                                    className="view-details-btn"
                                                    onClick={() => setSelectedTournament(t)}
                                                >
                                                    View Details
                                                </button>
                                            </td>
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

            {selectedTournament && (
                <TournamentDetailsModal
                    tournament={selectedTournament}
                    onClose={() => setSelectedTournament(null)}
                />
            )}

            {selectedRegForDetails && (
                <TeamDetailsModal
                    registration={selectedRegForDetails}
                    onClose={() => setSelectedRegForDetails(null)}
                />
            )}

            <QRScannerModal 
                isOpen={isScannerOpen} 
                onClose={() => setIsScannerOpen(false)} 
                onScanSuccess={handleScanSuccess} 
            />

            <MatchSetupModal 
                isOpen={isMatchSetupOpen}
                onClose={() => setIsMatchSetupOpen(false)}
                arrivedTeams={applications.filter(app => app.status === 'arrived')}
            />
        </div>
    );
};

export default OrganizerDashboard;
