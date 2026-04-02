import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './CreateTournamentModal.css';

const CreateTournamentModal = ({ onClose, onCreated }) => {
    const { token } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        name: '',
        date_time: '',
        location: '',
        registration_fee: 0,
        overs: 0,
        balls_per_over: 6,
        prize_1st: 0,
        prize_2nd: 0,
        prize_3rd: 0,
        contact_numbers: [],
        ground_images: []
    });

    // For array inputs to keep them as strings while typing
    const [arrayInputs, setArrayInputs] = useState({
        contact_numbers: '',
        ground_images: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleArrayInputChange = (e) => {
        const { name, value } = e.target;
        setArrayInputs({ ...arrayInputs, [name]: value });
        const array = value.split(',').map(s => s.trim()).filter(s => s);
        setFormData({ ...formData, [name]: array });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post('http://localhost:5000/api/tournaments/create', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onCreated();
            onClose();
        } catch (err) {
            setError(err.response?.data?.msg || err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content glass-card">
                <h2>Organize New Tournament</h2>
                <p className="subtitle">Fill in all details matching the backend tournament model.</p>

                <form onSubmit={handleSubmit} className="form-layout modal-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-row">
                        <div className="input-group">
                            <label>Tournament Name *</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="input-group">
                            <label>Date & Time *</label>
                            <input type="datetime-local" name="date_time" value={formData.date_time} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Location</label>
                        <input type="text" name="location" value={formData.location} onChange={handleChange} />
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label>Registration Fee</label>
                            <input type="number" name="registration_fee" value={formData.registration_fee} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Overs / Match</label>
                            <input type="number" name="overs" value={formData.overs} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>Balls Per Over</label>
                            <input type="number" name="balls_per_over" value={formData.balls_per_over} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label>1st Prize</label>
                            <input type="number" name="prize_1st" value={formData.prize_1st} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>2nd Prize</label>
                            <input type="number" name="prize_2nd" value={formData.prize_2nd} onChange={handleChange} />
                        </div>
                        <div className="input-group">
                            <label>3rd Prize</label>
                            <input type="number" name="prize_3rd" value={formData.prize_3rd} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label>Contact Numbers (comma separated)</label>
                            <input type="text" name="contact_numbers" value={arrayInputs.contact_numbers} onChange={handleArrayInputChange} placeholder="077xxxxxxx, 071xxxxxxx" />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label>Ground Images (comma separated URLs)</label>
                            <input type="text" name="ground_images" value={arrayInputs.ground_images} onChange={handleArrayInputChange} placeholder="https://..." />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>Cancel</button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Tournament'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTournamentModal;
