import React from 'react';
import './TournamentDetailsModal.css';

const TournamentDetailsModal = ({ tournament, onClose }) => {
    if (!tournament) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <h2 className="gradient-text">{tournament.name} Details</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </header>

                <div className="modal-body">
                    <div className="details-grid">
                        <div className="detail-item">
                            <label>Location</label>
                            <p>{tournament.location || 'TBA'}</p>
                        </div>
                        <div className="detail-item">
                            <label>Date & Time</label>
                            <p>{new Date(tournament.date_time).toLocaleString()}</p>
                        </div>
                        <div className="detail-item">
                            <label>Registration Fee</label>
                            <p>${tournament.registration_fee}</p>
                        </div>
                        <div className="detail-item">
                            <label>Overs</label>
                            <p>{tournament.overs} Overs ({tournament.balls_per_over} balls/over)</p>
                        </div>
                    </div>

                    <div className="prizes-section">
                        <h3>Prize Pool</h3>
                        <div className="prizes-grid">
                            <div className="prize-card gold">
                                <span>1st Place</span>
                                <strong>${tournament.prize_1st}</strong>
                            </div>
                            <div className="prize-card silver">
                                <span>2nd Place</span>
                                <strong>${tournament.prize_2nd}</strong>
                            </div>
                            <div className="prize-card bronze">
                                <span>3rd Place</span>
                                <strong>${tournament.prize_3rd}</strong>
                            </div>
                        </div>
                    </div>

                    {tournament.contact_numbers && tournament.contact_numbers.length > 0 && (
                        <div className="contacts-section">
                            <h3>Organizer Contacts</h3>
                            <div className="contact-tags">
                                {tournament.contact_numbers.map((num, i) => (
                                    <span key={i} className="contact-tag">{num}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {tournament.ground_images && tournament.ground_images.length > 0 && (
                        <div className="gallery-section">
                            <h3>Ground Gallery</h3>
                            <div className="image-grid">
                                {tournament.ground_images.map((img, i) => (
                                    <img key={i} src={img} alt={`Ground ${i+1}`} className="gallery-img" />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="share-section">
                        <h3>Tournament Share Link</h3>
                        <div className="link-box">
                            <code>{tournament.share_link}</code>
                            <button 
                                className="copy-link-btn"
                                onClick={() => {
                                    navigator.clipboard.writeText(tournament.share_link);
                                    alert("Link copied!");
                                }}
                            >
                                Copy Link
                            </button>
                        </div>
                    </div>
                </div>

                <footer className="modal-footer">
                    <button className="done-btn" onClick={onClose}>Close Details</button>
                </footer>
            </div>
        </div>
    );
};

export default TournamentDetailsModal;
