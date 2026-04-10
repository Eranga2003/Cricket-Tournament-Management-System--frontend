import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import BattleLoader from '../components/BattleLoader';
import './LiveScoring.css';

const LiveScoring = () => {
    const { matchId } = useParams();
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();

    const [match, setMatch] = useState(null);
    const [liveScore, setLiveScore] = useState(null);
    const [battingSquad, setBattingSquad] = useState([]);
    const [bowlingSquad, setBowlingSquad] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncingRun, setSyncingRun] = useState(null);

    const [showBatterModal, setShowBatterModal] = useState(false);
    const [showBowlerModal, setShowBowlerModal] = useState(false);
    const [showWicketModal, setShowWicketModal] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);

    useEffect(() => {
        const fetchMatchLive = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/matches/${matchId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const matchData = res.data.match;
                setMatch(matchData);
                setLiveScore(matchData.live_score);

                if (matchData.live_score) {
                    // Logic: Fetch based on the CURRENT active role (who is batting/bowling right now)
                    const batRes = await axios.get(`http://localhost:5000/api/players/team/${matchData.live_score.batting_team_id}`);
                    const bowlRes = await axios.get(`http://localhost:5000/api/players/team/${matchData.live_score.bowling_team_id}`);
                    
                    const orderedIds = matchData.live_score.batting_order || [];
                    const players = batRes.data.players || [];
                    const sortedBatting = orderedIds.length > 0 
                        ? orderedIds.map(id => players.find(p => String(p.id) === String(id))).filter(Boolean)
                        : players;

                    setBattingSquad(sortedBatting);
                    setBowlingSquad(bowlRes.data.players || []);

                    if (matchData.live_score.innings_complete) setShowSummaryModal(true);
                }
                setLoading(false);
            } catch (err) {
                console.error("Sync failure:", err);
                setLoading(false);
            }
        };
        if (token && matchId) fetchMatchLive();
    }, [matchId, token]);

    const recordBall = async (runs, isWicket = false, extraType = null, outBatsmanId = null) => {
        if (isSyncing) return;
        setIsSyncing(true);
        if (!isWicket && !extraType) setSyncingRun(runs);
        
        try {
            const res = await axios.post(`http://localhost:5000/api/scoring/${matchId}/ball`, {
                runs, is_wicket: isWicket, extra_type: extraType, out_batsman_id: outBatsmanId
            }, { headers: { Authorization: `Bearer ${token}` } });

            setLiveScore(res.data.liveScore);
            setShowWicketModal(false);

            if (res.data.liveScore.innings_complete) setShowSummaryModal(true);
            else if (isWicket && (!res.data.liveScore.striker_id || !res.data.liveScore.non_striker_id)) setShowBatterModal(true);
            else if (res.data.liveScore.balls_in_over === 0 && res.data.liveScore.current_over > 0 && !res.data.liveScore.bowler_id) setShowBowlerModal(true);
        } catch (err) {
            alert(`Sync Error: ${err.response?.data?.error || "Sync failed"}`);
        } finally {
            setIsSyncing(false);
            setSyncingRun(null);
        }
    };

    const handleSwitchInnings = async () => {
        setIsSyncing(true);
        try {
            await axios.post(`http://localhost:5000/api/scoring/${matchId}/switch-innings`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowSummaryModal(false);
            window.location.reload(); 
        } catch (err) { alert("Switch failed"); setIsSyncing(false); }
    };

    const handleSwapBatter = async (playerId) => {
        setIsSyncing(true);
        try {
            const res = await axios.post(`http://localhost:5000/api/scoring/${matchId}/batsman`, { new_batsman_id: playerId }, { headers: { Authorization: `Bearer ${token}` } });
            setLiveScore(res.data.liveScore);
            setShowBatterModal(false);
        } catch (err) { console.error(err); }
        finally { setIsSyncing(false); }
    };

    const handleSwapBowler = async (playerId) => {
        setIsSyncing(true);
        try {
            const res = await axios.post(`http://localhost:5000/api/scoring/${matchId}/bowler`, { new_bowler_id: playerId }, { headers: { Authorization: `Bearer ${token}` } });
            setLiveScore(res.data.liveScore);
            setShowBowlerModal(false);
        } catch (err) { console.error(err); }
        finally { setIsSyncing(false); }
    };

    const handleUndo = async () => {
        if (!window.confirm("Undo ball?")) return;
        setIsSyncing(true);
        try {
            const res = await axios.post(`http://localhost:5000/api/scoring/${matchId}/undo`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setLiveScore(res.data.liveScore);
        } catch (err) { alert("Undo failed."); }
        finally { setIsSyncing(false); }
    };

    const handleRestart = async () => {
        if (!window.confirm("Restart Innings?")) return;
        setIsSyncing(true);
        try {
            const res = await axios.delete(`http://localhost:5000/api/scoring/${matchId}/reset`, { headers: { Authorization: `Bearer ${token}` } });
            setLiveScore(res.data.liveScore);
            alert("Reset done.");
        } catch (err) { alert("Reset failed."); }
        finally { setIsSyncing(false); }
    };

    if (loading || !liveScore) return <BattleLoader label="Synchronizing Battle State..." />;


    const strikerId = liveScore?.striker_id;
    const nonStrikerId = liveScore?.non_striker_id;
    const striker = battingSquad.find(p => p.id && strikerId && String(p.id) === String(strikerId));
    const nonStriker = battingSquad.find(p => p.id && nonStrikerId && String(p.id) === String(nonStrikerId));
    const currentBowler = bowlingSquad.find(p => p.id && liveScore?.bowler_id && String(p.id) === String(liveScore?.bowler_id));
    
    const sittingBatters = battingSquad.filter(p => 
        String(p.id) !== String(strikerId) && 
        String(p.id) !== String(nonStrikerId) && 
        !liveScore?.wickets_list?.map(String).includes(String(p.id))
    );
    const outBatters = battingSquad.filter(p => liveScore?.wickets_list?.map(String).includes(String(p.id)));

    const totalBalls = (liveScore.current_over * liveScore.balls_per_over) + liveScore.balls_in_over;
    const currentRR = totalBalls > 0 ? ((liveScore.total_runs / totalBalls) * liveScore.balls_per_over).toFixed(2) : "0.00";
    
    let requiredRR = null;
    if (liveScore.innings_number === 2 && liveScore.target_runs) {
        const remainingRuns = Math.max(0, liveScore.target_runs - liveScore.total_runs);
        const remainingBalls = (liveScore.total_overs * liveScore.balls_per_over) - totalBalls;
        requiredRR = remainingBalls > 0 ? ((remainingRuns / remainingBalls) * liveScore.balls_per_over).toFixed(2) : "0.00";
    }

    return (
        <div className={`live-scoring-page ${isSyncing ? 'is-syncing' : ''}`}>
            <header className="scoring-header glass-card">
                <div className="match-meta">
                    <button className="back-btn" onClick={() => navigate('/dashboard')}>← Final Dashboard</button>
                    <h1>{match?.team1_name} vs {match?.team2_name}</h1>
                </div>
                
                <div className="live-indicator-group">
                    <div className="main-counts">
                        <span className="count-total">{liveScore.total_runs}</span>
                        <span className="count-wickets">/ {liveScore.total_wickets}</span>
                        {liveScore.innings_number === 2 && <span className="target-pill">Target: {liveScore.target_runs}</span>}
                    </div>
                    <div className="rate-indicators">
                        <span className="rate-badge">CRR: {currentRR}</span>
                        {requiredRR && <span className="rate-badge req">RRR: {requiredRR}</span>}
                        {isSyncing && <span className="rate-badge sync-active pulse">BATTLE SYNCING...</span>}
                    </div>
                </div>

                <div className="over-meta">
                    <div className="ov-display">Overs: {liveScore.current_over}.{liveScore.balls_in_over} / {liveScore.total_overs}</div>
                    <div className="ov-label">{liveScore.innings_number === 1 ? 'INN 1 Batting' : 'INN 2 Chasing'}</div>
                </div>
            </header>

            <main className="scoring-layout">
                <aside className="batting-squad-panel glass-card">
                    <div className="crease-viz batting-crease-container">
                        <div className="crease-sides-grid">
                            <div className={`crease-side striker-side ${striker ? 'occupied' : 'vacant'}`}>
                                <label>STRIKER END</label>
                                {striker ? (
                                    <div className="batter-card-mini animate-pop">
                                        <div className="st-marker">★</div>
                                        <div className="b-name">{striker.name}</div>
                                        <div className="b-score">{liveScore.player_stats[striker.id]?.runs || 0} <small>({liveScore.player_stats[striker.id]?.balls || 0})</small></div>
                                    </div>
                                ) : <div className="vacancy">OUT</div>}
                            </div>
                            <div className="pitch-divider">STUMP</div>
                            <div className={`crease-side non-striker-side ${nonStriker ? 'occupied' : 'vacant'}`}>
                                <label>PARTNER END</label>
                                {nonStriker ? (
                                    <div className="batter-card-mini animate-pop">
                                        <div className="b-name">{nonStriker.name}</div>
                                        <div className="b-score">{liveScore.player_stats[nonStriker.id]?.runs || 0} <small>({liveScore.player_stats[nonStriker.id]?.balls || 0})</small></div>
                                    </div>
                                ) : <div className="vacancy">OUT</div>}
                            </div>
                        </div>
                    </div>

                    <div className="batting-lists">
                        <div className="list-section waiting">
                            <h4>Yet to Bat</h4>
                            {sittingBatters.map(p => <div key={p.id} className="p-row"><span>{p.name}</span><span>Ready</span></div>)}
                        </div>
                        <div className="list-section out">
                            <h4>The Pavilion</h4>
                            {outBatters.map(p => <div key={p.id} className="p-row dimmed"><span>{p.name}</span><span>{liveScore.player_stats[p.id]?.runs} ({liveScore.player_stats[p.id]?.balls})</span></div>)}
                        </div>
                    </div>
                </aside>

                <section className="scoring-interface">
                    <div className="bowler-card-container glass-card">
                        <div className="cb-info">
                            <label>BATTLE BOWLER</label>
                            <h3>{currentBowler?.name || "Ready Next Bowler"}</h3>
                        </div>
                        <div className="cb-stats">
                            <span>W: {liveScore.player_stats[currentBowler?.id]?.wickets || 0}</span>
                            <span>R: {liveScore.player_stats[currentBowler?.id]?.runs_conceded || 0}</span>
                        </div>
                    </div>

                    <div className="control-deck">
                        <div className="grid-score">
                            {[0,1,2,3,4,6].map(r => (
                                <button 
                                    key={r} 
                                    className={`btn-r r-${r}`} 
                                    onClick={() => recordBall(r)}
                                    disabled={isSyncing}
                                >
                                    {syncingRun === r ? <div className="btn-loader"></div> : r}
                                </button>
                            ))}
                        </div>
                        <div className="flex-extras">
                            <button className="btn-ex wide" onClick={() => recordBall(0, false, 'wide')} disabled={isSyncing}>Wide</button>
                            <button className="btn-ex nb" onClick={() => recordBall(4, false, 'no-ball')} disabled={isSyncing}>NB+4</button>
                            <button className="btn-ex wicket" onClick={() => setShowWicketModal(true)} disabled={isSyncing}>WICKET</button>
                        </div>
                        <div className="flex-emergency">
                            <button className="btn-em undo" onClick={handleUndo} disabled={isSyncing}>Undo Ball</button>
                            <button className="btn-em reset" onClick={handleRestart} disabled={isSyncing}>Reset Match</button>
                        </div>
                    </div>

                    <div className="history-viz glass-card">
                        <label>BATTLE ANALYTICS (Last 12 Balls)</label>
                        <div className="balls">
                            {liveScore.ball_history?.slice(-12).map((b, i) => (
                                <div key={i} className={`ball-pip ${b.is_wicket ? 'out' : ''}`}>{b.is_wicket ? 'W' : (b.extra ? b.extra[0].toUpperCase() : b.runs)}</div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {showSummaryModal && (
                <div className="modal-overlay blur full-summary">
                    <div className="summary-card glass-card animate-pop">
                        <div className="summary-header">
                            <h2>{liveScore.innings_number === 1 ? 'Innings 1 Complete!' : 'The Battle Concluded!'}</h2>
                            <div className="total-display">
                                <span className="runs">{liveScore.total_runs}/{liveScore.total_wickets}</span>
                                <span className="rr">Final RR: {currentRR}</span>
                            </div>
                        </div>

                        <div className="performance-table-container">
                            <h3>Battle Performance Scorecard</h3>
                            <table className="summary-table">
                                <thead>
                                    <tr>
                                        <th>Player</th>
                                        <th>Runs</th>
                                        <th>Balls</th>
                                        <th>SR</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {battingSquad.map(p => {
                                        const stats = liveScore.player_stats[p.id] || { runs: 0, balls: 0 };
                                        const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : "0.0";
                                        const out = liveScore.wickets_list?.map(String).includes(String(p.id));
                                        if (stats.balls === 0 && !out) return null;
                                        return (
                                            <tr key={p.id} className={out ? 'out-row' : ''}>
                                                <td>{p.name}</td>
                                                <td className="bold">{stats.runs}</td>
                                                <td>{stats.balls}</td>
                                                <td>{sr}</td>
                                                <td>{out ? 'Out' : 'Not Out'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="modal-footer">
                            {liveScore.innings_number === 1 ? (
                                <button className="prime-action-btn" onClick={handleSwitchInnings} disabled={isSyncing}>
                                    {isSyncing ? <div className="btn-loader"></div> : 'Commit & Proceed to Innings 2 →'}
                                </button>
                            ) : (
                                <button className="prime-action-btn alt" onClick={() => navigate('/dashboard')} disabled={isSyncing}>Confirm & Store Battle History</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {(showWicketModal || showBatterModal || showBowlerModal) && (
                <div className="modal-overlay blur">
                    <div className="simple-modal glass-card animate-pop">
                        <h3>{showWicketModal ? 'Wicket Selection' : showBatterModal ? 'Next Active Batter' : 'Select Bowler'}</h3>
                        <div className="btn-grid scrollable">
                            {showWicketModal && [striker, nonStriker].filter(Boolean).map(p => (
                                <button key={p.id} className="opt-btn" onClick={() => recordBall(0, true, null, p.id)} disabled={isSyncing}>{p.name}</button>
                            ))}
                            {showBatterModal && sittingBatters.map(p => (
                                <button key={p.id} className="opt-btn" onClick={() => handleSwapBatter(p.id)} disabled={isSyncing}>{p.name}</button>
                            ))}
                            {showBowlerModal && bowlingSquad.filter(p => !liveScore.bowler_id || String(p.id) !== String(liveScore.bowler_id)).map(p => (
                                <button key={p.id} className="opt-btn" onClick={() => handleSwapBowler(p.id)} disabled={isSyncing}>{p.name}</button>
                            ))}
                        </div>
                        <button onClick={() => { setShowWicketModal(false); setShowBatterModal(false); setShowBowlerModal(false); }} className="opt-btn cancel" disabled={isSyncing}>Dismiss</button>
                        {isSyncing && <div className="loading-overlay"><div className="btn-loader"></div></div>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveScoring;
