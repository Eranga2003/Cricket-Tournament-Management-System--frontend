import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import BattleLoader from '../components/BattleLoader';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
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
    const [showTransitionSelector, setShowTransitionSelector] = useState(false);
    const [showExtraModal, setShowExtraModal] = useState(false);
    const [pendingExtraType, setPendingExtraType] = useState(null);

    const [s2Striker, setS2Striker] = useState('');
    const [s2NonStriker, setS2NonStriker] = useState('');
    const [s2Bowler, setS2Bowler] = useState('');

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
        if (!showTransitionSelector) {
            setShowTransitionSelector(true);
            return;
        }

        if (!s2Striker || !s2NonStriker || !s2Bowler) {
            alert("Select Team B starting lineup first!");
            return;
        }

        setIsSyncing(true);
        try {
            await axios.post(`http://localhost:5000/api/scoring/${matchId}/switch-innings`, {
                striker_id: s2Striker,
                non_striker_id: s2NonStriker,
                bowler_id: s2Bowler,
                batting_order: bowlingSquad.map(p => p.id)
            }, { headers: { Authorization: `Bearer ${token}` } });
            setShowSummaryModal(false);
            window.location.reload(); 
        } catch (err) { 
            alert(err.response?.data?.error || "Switch failed"); 
            setIsSyncing(false); 
        }
    };

    const handleSwapBatter = async (playerId) => {
        setIsSyncing(true);
        try {
            const res = await axios.post(`http://localhost:5000/api/scoring/${matchId}/batsman`, { new_batsman_id: playerId }, { headers: { Authorization: `Bearer ${token}` } });
            const updatedScore = res.data.liveScore;
            setLiveScore(updatedScore);
            setShowBatterModal(false);

            // Chain logic: If the over also completed on this ball, prompt for bowler next
            if (updatedScore.balls_in_over === 0 && updatedScore.current_over > 0 && !updatedScore.bowler_id) {
                setShowBowlerModal(true);
            }
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

    const handleExtraClick = (type) => {
        setPendingExtraType(type);
        setShowExtraModal(true);
    };

    const handleExtraChoice = (runs) => {
        recordBall(runs, false, pendingExtraType);
        setShowExtraModal(false);
        setPendingExtraType(null);
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
            await axios.delete(`http://localhost:5000/api/scoring/${matchId}/reset`, { headers: { Authorization: `Bearer ${token}` } });
            window.location.reload();
        } catch (err) { alert("Reset failed."); }
        finally { setIsSyncing(false); }
    };

    const getChartData = () => {
        if (!liveScore) return [];
        const h1 = liveScore.innings1_history || [];
        const h2 = liveScore.ball_history || [];
        const maxBalls = Math.max(h1.length, h2.length);
        
        let data = [];
        let cumA = 0;
        let cumB = 0;
        
        for (let i = 0; i < maxBalls; i++) {
            if (h1[i]) cumA += (h1[i].runs || 0) + (h1[i].extra ? 1 : 0);
            if (h2[i]) cumB += (h2[i].runs || 0) + (h2[i].extra ? 1 : 0);
            
            data.push({
                ball: i + 1,
                [match?.team1_name || 'Team A']: i < h1.length ? cumA : null,
                [match?.team2_name || 'Team B']: i < h2.length ? cumB : null
            });
        }
        return data;
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
            {/* --- TOP HERO SCOREBOARD --- */}
            <header className="hero-scoreboard">
                <div className="match-identity">
                    <div className="team-pill">
                        {match?.team1_logo && <img src={match.team1_logo} alt="" className="pill-logo" />}
                        {match?.team1_name}
                    </div>
                    <div className="vs-badge">VS</div>
                    <div className="team-pill" style={{textAlign: 'right'}}>
                        {match?.team2_name}
                        {match?.team2_logo && <img src={match.team2_logo} alt="" className="pill-logo" />}
                    </div>
                </div>

                <div className="main-score-display">
                    <span className="score-runs">{liveScore.total_runs}</span>
                    <span className="score-wickets">/ {liveScore.total_wickets}</span>
                </div>

                <div className="mid-meta-row">
                    <div className="status-pill">{liveScore.innings_number === 1 ? 'INN 1' : 'INN 2'} - {liveScore.current_over}.{liveScore.balls_in_over} OVERS</div>
                    {liveScore.innings_number === 2 && <div className="target-pill">Target: {liveScore.target_runs}</div>}
                    <div className="status-pill" style={{borderColor: 'rgba(255,255,255,0.2)', color: '#94a3b8'}}>CRR: {currentRR}</div>
                    {requiredRR && <div className="target-pill" style={{borderColor: 'var(--neon-blue)', color: 'var(--neon-blue)'}}>RRR: {requiredRR}</div>}
                </div>
            </header>

            {/* --- BATTLE ARENA (Players) --- */}
            <div className="battle-arena">
                <div className="battle-card glass-card">
                    <label className="card-label">Striker End</label>
                    {striker ? (
                        <>
                            <div className="player-header">
                                <div className="player-name"><span className="striker-star">★</span>{striker.name}</div>
                                <button className="mini-swap-btn" onClick={() => setShowBatterModal(true)} title="Emergency Change">🔄 Swap</button>
                            </div>
                            <div className="stat-grid">
                                <div className="stat-item">
                                    <span className="stat-val">{liveScore.player_stats?.[striker.id]?.runs || 0}</span>
                                    <span className="stat-tag">Runs</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-val">{liveScore.player_stats?.[striker.id]?.balls || 0}</span>
                                    <span className="stat-tag">Balls</span>
                                </div>
                            </div>
                        </>
                    ) : <div className="player-name vacancy">Awaiting Batter...</div>}
                </div>

                <div className="battle-card glass-card" style={{opacity: 0.8}}>
                    <label className="card-label">Partner End</label>
                    {nonStriker ? (
                        <>
                            <div className="player-header">
                                <div className="player-name">{nonStriker.name}</div>
                                <button className="mini-swap-btn" onClick={() => setShowBatterModal(true)} title="Emergency Change">🔄 Swap</button>
                            </div>
                            <div className="stat-grid">
                                <div className="stat-item">
                                    <span className="stat-val">{liveScore.player_stats?.[nonStriker.id]?.runs || 0}</span>
                                    <span className="stat-tag">Runs</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-val">{liveScore.player_stats?.[nonStriker.id]?.balls || 0}</span>
                                    <span className="stat-tag">Balls</span>
                                </div>
                            </div>
                        </>
                    ) : <div className="player-name vacancy">Awaiting Partner...</div>}
                </div>

                <div className="battle-card glass-card border-neon">
                    <label className="card-label">Battle Bowler</label>
                    {currentBowler ? (
                        <>
                            <div className="player-name">{currentBowler.name}</div>
                            <div className="stat-grid">
                                <div className="stat-item">
                                    <span className="stat-val" style={{color: 'var(--neon-blue)'}}>{liveScore.player_stats?.[currentBowler.id]?.wickets || 0}</span>
                                    <span className="stat-tag">Wickets</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-val">{liveScore.player_stats?.[currentBowler.id]?.runs_conceded || 0}</span>
                                    <span className="stat-tag">Runs Gived</span>
                                </div>
                            </div>
                        </>
                    ) : <div className="player-name vacancy">Ready Next Bowler</div>}
                </div>
            </div>

            {/* --- CONTROL DECK --- */}
            <div className="scoring-deck">
                <div className="controls-main">
                    <div className="run-grid">
                        {[0,1,2,3,4,6].map(r => (
                            <button key={r} className={`btn-score r-${r}`} onClick={() => recordBall(r)} disabled={isSyncing}>
                                {syncingRun === r ? '...' : r}
                            </button>
                        ))}
                    </div>
                    <div className="deck-footer">
                        <button className="btn-action" onClick={() => handleExtraClick('wide')} disabled={isSyncing}>Wide</button>
                        <button className="btn-action" onClick={() => handleExtraClick('no-ball')} disabled={isSyncing}>No Ball</button>
                        <button className="btn-action wicket" onClick={() => setShowWicketModal(true)} disabled={isSyncing}>WICKET</button>
                        <button className="btn-action" onClick={handleUndo} disabled={isSyncing}>Undo</button>
                        <button className="btn-action" onClick={handleRestart} disabled={isSyncing}>Reset</button>
                    </div>
                </div>

                <div className="analytics-card glass-card">
                    <label className="card-label">Live Analytics (Last 12 Balls)</label>
                    <div className="ball-timeline-grouped">
                        {(() => {
                            const lastBalls = liveScore.ball_history?.slice(-12) || [];
                            const groups = [];
                            lastBalls.forEach(b => {
                                const overIdx = (b.ball === 0 && b.over > 0) ? b.over - 1 : b.over;
                                let group = groups.find(g => g.overIdx === overIdx);
                                if (!group) {
                                    group = { overIdx, balls: [] };
                                    groups.push(group);
                                }
                                group.balls.push(b);
                            });

                            return groups.map((group, gi) => (
                                <div key={gi} className="over-row">
                                    <div className="over-num-label">Ov {group.overIdx + 1}</div>
                                    <div className="over-balls">
                                        {group.balls.map((b, bi) => (
                                            <div key={bi} className={`ball-pip r-${b.runs} ${b.is_wicket ? 'out' : ''}`}>
                                                {b.is_wicket ? 'W' : 
                                                 b.extra === 'wide' ? 'WD' : 
                                                 b.extra === 'no-ball' ? 'NB' : 
                                                 b.runs}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </div>

            {/* --- MODALS (Summary, Selection, etc.) --- */}
            {showSummaryModal && (
                <div className="modal-overlay blur full-summary">
                    <div className="summary-card glass-card animate-pop">
                        <div className="summary-header">
                            <div>
                                <h1 className="gradient-text">{liveScore.innings_number === 1 ? 'First Innings Complete' : 'Match Concluded'}</h1>
                                <p>{match?.team1_name} vs {match?.team2_name}</p>
                            </div>
                            <div className="total-display">
                                <span className="runs" style={{fontSize: '3rem'}}>{liveScore.total_runs}/{liveScore.total_wickets}</span>
                            </div>
                        </div>

                        {match?.winner_team_id && (
                            <div className="victory-banner glass-card">
                                <div className="winner-logo-nexus">
                                    {(String(match.winner_team_id) === String(match.team1_id) ? match.team1_logo : match.team2_logo) ? (
                                        <img 
                                            src={String(match.winner_team_id) === String(match.team1_id) ? match.team1_logo : match.team2_logo} 
                                            alt="Winner Logo" 
                                            className="winner-stadium-logo"
                                        />
                                    ) : (
                                        <div className="winner-stadium-logo placeholder">🏆</div>
                                    )}
                                </div>
                                <h2 style={{color: 'var(--neon-green)'}}>
                                    🏆 {match.match_summary?.replace(/Team A/gi, match.team1_name).replace(/Team B/gi, match.team2_name)}
                                </h2>
                            </div>
                        )}

                        {!showTransitionSelector ? (
                        <div className="summary-scroll-content">
                            {(() => {
                                const isInn1 = liveScore.innings_number === 1;
                                const t1Squad = isInn1 ? battingSquad : bowlingSquad;
                                const t2Squad = isInn1 ? bowlingSquad : battingSquad;
                                const t1Name = match?.team1_name || 'Team 1';
                                const t2Name = match?.team2_name || 'Team 2';
                                
                                const winnerId = match?.winner_team_id;
                                const winningTeamName = String(winnerId) === String(match?.team1_id) ? t1Name : t2Name;

                                const combinedStats = {};
                                [liveScore.innings1_player_stats, liveScore.player_stats].forEach(ps => {
                                    if (!ps) return;
                                    Object.entries(ps).forEach(([pid, stats]) => {
                                        if (!combinedStats[pid]) combinedStats[pid] = { runs: 0, balls: 0, wickets: 0, runs_conceded: 0, balls_bowled: 0 };
                                        combinedStats[pid].runs += (stats.runs || 0);
                                        combinedStats[pid].balls += (stats.balls || 0);
                                        combinedStats[pid].wickets += (stats.wickets || 0);
                                        combinedStats[pid].runs_conceded += (stats.runs_conceded || 0);
                                        combinedStats[pid].balls_bowled += (stats.balls_bowled || 0);
                                    });
                                });

                                const combinedWickets = [...(liveScore.innings1_wickets_list || []), ...(liveScore.wickets_list || [])].map(String);
                                
                                // Identify Champion's Best performers
                                let winnerMaxRuns = -1;
                                let winnerBestBatterId = null;
                                let winnerMaxWkts = -1;
                                let winnerBestBowlerId = null;

                                const findWinnerBest = (squad) => {
                                    squad.forEach(p => {
                                        const s = combinedStats[p.id] || { runs: 0, wickets: 0 };
                                        if (s.runs > winnerMaxRuns) { winnerMaxRuns = s.runs; winnerBestBatterId = p.id; }
                                        if (s.wickets > winnerMaxWkts) { winnerMaxWkts = s.wickets; winnerBestBowlerId = p.id; }
                                    });
                                };

                                if (String(winnerId) === String(match?.team1_id)) findWinnerBest(t1Squad);
                                else if (String(winnerId) === String(match?.team2_id)) findWinnerBest(t2Squad);

                                return (
                                    <>
                                        <div className="scorecard-viz">
                                            <div className="viz-header-row">
                                                <h3>Match Batting Masterclass</h3>
                                                {match?.winner_team_id && <span className="winner-tag-info">Highlighting {winningTeamName} Stars</span>}
                                            </div>
                                            <table className="summary-table master">
                                                <thead><tr><th>Batsman</th><th>Team</th><th>Runs</th><th>Balls</th><th>SR</th><th>Status</th></tr></thead>
                                                <tbody>
                                                    {[
                                                        ...t1Squad.map(p => ({ ...p, team: t1Name })),
                                                        ...t2Squad.map(p => ({ ...p, team: t2Name }))
                                                    ].map(p => { 
                                                        const stats = combinedStats[p.id] || { runs: 0, balls: 0 };
                                                        const sr = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : "0.0";
                                                        const out = combinedWickets.includes(String(p.id));
                                                        const isMatchMVP = String(match?.best_batsman_id) === String(p.id);
                                                        const isWinnerMVP = String(winnerBestBatterId) === String(p.id);

                                                        if (stats.balls === 0 && !out) return null;
                                                        return (
                                                            <tr key={p.id} className={`${isMatchMVP ? 'mvp-row animate-glow' : ''} ${isWinnerMVP ? 'winner-star-row' : ''}`}>
                                                                <td>
                                                                    {p.name} 
                                                                    {isMatchMVP && <span className="mvp-badge">⚡ MVP</span>}
                                                                    {isWinnerMVP && <span className="mvp-badge champion">🏆 CHAMPION'S BEST</span>}
                                                                </td>
                                                                <td><span className={`team-tag ${p.team === t1Name ? 't1' : 't2'}`}>{p.team}</span></td>
                                                                <td className="bold">{stats.runs}</td>
                                                                <td>{stats.balls}</td>
                                                                <td>{sr}</td>
                                                                <td><span className={`status-tag ${out ? 'out' : 'not-out'}`}>{out ? 'Out' : 'Not Out'}</span></td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="scorecard-viz">
                                            <div className="viz-header-row">
                                                <h3>Match Bowling Force</h3>
                                            </div>
                                            <table className="summary-table master">
                                                <thead><tr><th>Bowler</th><th>Team</th><th>Wkts</th><th>Runs</th><th>Econ</th></tr></thead>
                                                <tbody>
                                                    {[
                                                        ...t1Squad.map(p => ({ ...p, team: t1Name })),
                                                        ...t2Squad.map(p => ({ ...p, team: t2Name }))
                                                    ].map(p => {
                                                        const stats = combinedStats[p.id] || { wickets: 0, runs_conceded: 0, balls_bowled: 0 };
                                                        const econ = stats.balls_bowled > 0 ? ((stats.runs_conceded / stats.balls_bowled) * 6).toFixed(2) : "0.00";
                                                        const isMatchMVP = String(match?.best_bowler_id) === String(p.id);
                                                        const isWinnerMVP = String(winnerBestBowlerId) === String(p.id);

                                                        if (stats.balls_bowled === 0) return null;
                                                        return (
                                                            <tr key={p.id} className={`${isMatchMVP ? 'mvp-row-bowler animate-glow-bowl' : ''} ${isWinnerMVP ? 'winner-star-row bowl' : ''}`}>
                                                                <td>
                                                                    {p.name} 
                                                                    {isMatchMVP && <span className="mvp-badge bowl">🎯 MVP</span>}
                                                                    {isWinnerMVP && <span className="mvp-badge champion bowl">🏆 CHAMPION'S BEST</span>}
                                                                </td>
                                                                <td><span className={`team-tag ${p.team === t1Name ? 't1' : 't2'}`}>{p.team}</span></td>
                                                                <td className="bold">{stats.wickets}</td>
                                                                <td>{stats.runs_conceded}</td>
                                                                <td>{econ}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                );
                            })()}


                                    <div className="match-analytics-suite animate-slide-up">
                                        <div className="chart-container glass-card">
                                            <h3>Battle Flow: Run Progression</h3>
                                            <div style={{ width: '100%', height: 300 }}>
                                                <ResponsiveContainer>
                                                    <LineChart data={getChartData()}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                        <XAxis dataKey="ball" stroke="#64748b" />
                                                        <YAxis stroke="#64748b" />
                                                        <Tooltip 
                                                            contentStyle={{ background: '#0d1117', border: '1px solid var(--neon-blue)', borderRadius: '12px' }}
                                                        />
                                                        <Legend verticalAlign="top"/>
                                                        <Line type="monotone" dataKey={match?.team1_name || 'Team A'} stroke="var(--neon-pink)" strokeWidth={3} dot={false} connectNulls />
                                                        <Line type="monotone" dataKey={match?.team2_name || 'Team B'} stroke="var(--neon-blue)" strokeWidth={3} dot={false} connectNulls />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                            </div>
                        ) : (
                            <div className="transition-selector-panel">
                                <h3>Set Team B Starting Lineup</h3>
                                <div className="selector-grid">
                                    <div className="s-group">
                                        <label>Striker</label>
                                        <select value={s2Striker} onChange={e => setS2Striker(e.target.value)}>
                                            <option value="">Select Striker</option>
                                            {bowlingSquad.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="s-group">
                                        <label>Non-Striker</label>
                                        <select value={s2NonStriker} onChange={e => setS2NonStriker(e.target.value)}>
                                            <option value="">Select Non-Striker</option>
                                            {bowlingSquad.filter(p => p.id !== s2Striker).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="s-group">
                                        <label>Opening Bowler</label>
                                        <select value={s2Bowler} onChange={e => setS2Bowler(e.target.value)}>
                                            <option value="">Select Bowler</option>
                                            {battingSquad.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="modal-footer">
                            {liveScore.innings_number === 1 ? (
                                <button className="prime-action-btn" onClick={showTransitionSelector ? handleSwitchInnings : () => setShowTransitionSelector(true)} disabled={isSyncing}>
                                    {isSyncing ? 'Syncing...' : showTransitionSelector ? 'Start Chase ⚡' : 'Proceed to Innings 2 →'}
                                </button>
                            ) : (
                                <button className="prime-action-btn alt" onClick={() => window.location.reload()}>Finish Match & Return</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- SELECTION MODALS (Bowling, Batter, Extra) --- */}
            {(showWicketModal || showBatterModal || showBowlerModal || showExtraModal) && (
                <div className="modal-overlay blur">
                    <div className="simple-modal glass-card animate-pop">
                        <h3>
                            {showWicketModal ? 'Wicket Selection' : 
                             showBatterModal ? 'Active Batter Selection' : 
                             showBowlerModal ? 'Select Bowler' : 
                             `Extra Runs (+ ${pendingExtraType})`}
                        </h3>
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
                            {showExtraModal && [0,1,2,3,4,6].map(r => (
                                <button key={r} className="opt-btn" onClick={() => handleExtraChoice(r)} disabled={isSyncing}>+ {r} {pendingExtraType === 'no-ball' ? 'from bat' : 'runs'}</button>
                            ))}
                        </div>
                        <button onClick={() => { setShowWicketModal(false); setShowBatterModal(false); setShowBowlerModal(false); setShowExtraModal(false); }} className="opt-btn cancel">Dismiss</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveScoring;
