import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import BattleLoader from '../components/BattleLoader';
import './MatchConfig.css';

const MatchConfig = () => {
    const { matchId } = useParams();
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();

    const [match, setMatch] = useState(null);
    const [team1Players, setTeam1Players] = useState([]);
    const [team2Players, setTeam2Players] = useState([]);
    const [loading, setLoading] = useState(true);

    const [overs, setOvers] = useState(5);
    const [ballsPerOver, setBallsPerOver] = useState(6);
    const [battingTeamId, setBattingTeamId] = useState('');
    const [strikerId, setStrikerId] = useState('');
    const [nonStrikerId, setNonStrikerId] = useState('');
    const [bowlerId, setBowlerId] = useState('');

    useEffect(() => {
        const fetchMatchData = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/matches/${matchId}`);
                const matchData = res.data.match;
                setMatch(matchData);
                if (matchData.team1_id && matchData.team2_id) {
                    fetchPlayers(matchData.team1_id, matchData.team2_id);
                }
                setLoading(false);
            } catch (err) {
                console.error("Match fetch error:", err);
                setLoading(false);
            }
        };

        if (matchId) fetchMatchData();
    }, [matchId, token]);

    const fetchPlayers = async (t1Id, t2Id) => {
        try {
            const res1 = await axios.get(`http://localhost:5000/api/players/team/${t1Id}`);
            const res2 = await axios.get(`http://localhost:5000/api/players/team/${t2Id}`);
            setTeam1Players(res1.data.players || []);
            setTeam2Players(res2.data.players || []);
        } catch (err) {
            console.error("Players fetch error:", err);
        }
    };

    const handleStart = async () => {
        if (!battingTeamId || !strikerId || !nonStrikerId || !bowlerId) {
            alert("Please select all starting players!");
            return;
        }

        const bowlingTeamId = battingTeamId === match?.team1_id ? match?.team2_id : match?.team1_id;
        const battingPlayers = battingTeamId === match?.team1_id ? team1Players : team2Players;

        try {
            await axios.post(`http://localhost:5000/api/scoring/${matchId}/start`, {
                batting_team_id: battingTeamId,
                bowling_team_id: bowlingTeamId,
                striker_id: strikerId,
                non_striker_id: nonStrikerId,
                bowler_id: bowlerId,
                total_overs: parseInt(overs),
                balls_per_over: parseInt(ballsPerOver),
                batting_order: battingPlayers.map(p => p.id)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            navigate(`/live-scoring/${matchId}`);
        } catch (err) {
            alert(err.response?.data?.error || "Failed to start match");
        }
    };

    if (loading) return <BattleLoader label="Warming up the stadium..." />;

    const battingPlayers = battingTeamId === match?.team1_id ? team1Players : (battingTeamId === match?.team2_id ? team2Players : []);
    const bowlingPlayers = battingTeamId === match?.team1_id ? team2Players : (battingTeamId === match?.team2_id ? team1Players : []);

    return (
        <div className="match-config-page">
            <div className="config-card glass-card">
                <h1 className="gradient-text">Match Configuration</h1>
                <p>Finalize the ground rules before the first ball</p>
                
                <div className="config-grid">
                    <div className="config-item">
                        <label>Total Overs</label>
                        <input type="number" value={overs} onChange={e => setOvers(e.target.value)} />
                    </div>
                    <div className="config-item">
                        <label>Balls per Over</label>
                        <input type="number" value={ballsPerOver} onChange={e => setBallsPerOver(e.target.value)} />
                    </div>
                </div>

                <div className="selection-section">
                    <h3>Game Startup</h3>
                    <div className="select-group">
                        <label>Batting First</label>
                        <select 
                            value={battingTeamId} 
                            onChange={e => setBattingTeamId(e.target.value)}
                            className="batting-select"
                        >
                            <option value="">Select Who Bats First</option>
                            {match?.team1_id && (
                                <option value={match.team1_id}>
                                    {match.team1_name || "Team 1"}
                                </option>
                            )}
                            {match?.team2_id && (
                                <option value={match.team2_id}>
                                    {match.team2_name || "Team 2"}
                                </option>
                            )}
                        </select>
                    </div>

                    <div className="player-selection-grid">
                        <div className="select-group">
                            <label>Striker (Batter 1)</label>
                            <select value={strikerId} onChange={e => setStrikerId(e.target.value)}>
                                <option value="">Select Player</option>
                                {battingPlayers.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="select-group">
                            <label>Non-Striker (Batter 2)</label>
                            <select value={nonStrikerId} onChange={e => setNonStrikerId(e.target.value)}>
                                <option value="">Select Player</option>
                                {battingPlayers.filter(p => p.id !== strikerId).map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="select-group">
                            <label>Opening Bowler</label>
                            <select value={bowlerId} onChange={e => setBowlerId(e.target.value)}>
                                <option value="">Select Player</option>
                                {bowlingPlayers.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <button className="engage-btn" onClick={handleStart}>
                    Confirm & Start Innings ⚡
                </button>
            </div>
        </div>
    );
};

export default MatchConfig;
