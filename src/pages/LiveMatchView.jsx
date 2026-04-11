import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BattleLoader from '../components/BattleLoader';
import './LiveScoring.css'; 

const LiveMatchView = () => {
    const { matchId } = useParams();
    const navigate = useNavigate();

    const [match, setMatch] = useState(null);
    const [liveScore, setLiveScore] = useState(null);
    const [battingSquad, setBattingSquad] = useState([]);
    const [bowlingSquad, setBowlingSquad] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const fetchMatchLive = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/matches/${matchId}`);
            const matchData = res.data.match;
            setMatch(matchData);
            setLiveScore(matchData.live_score);

            if (matchData.live_score && battingSquad.length === 0) {
                // Initial fetch for teams - only once to avoid flickering
                try {
                    const batRes = await axios.get(`http://localhost:5000/api/players/team/${matchData.live_score.batting_team_id}`);
                    const bowlRes = await axios.get(`http://localhost:5000/api/players/team/${matchData.live_score.bowling_team_id}`);
                    
                    const orderedIds = matchData.live_score.batting_order || [];
                    const players = batRes.data.players || [];
                    const sortedBatting = orderedIds.length > 0 
                        ? orderedIds.map(id => players.find(p => String(p.id) === String(id))).filter(Boolean)
                        : players;

                    setBattingSquad(sortedBatting);
                    setBowlingSquad(bowlRes.data.players || []);
                } catch (e) { console.error("Squad sync fail", e); }
            }
            setLoading(false);
        } catch (err) {
            console.error("Sync failure:", err);
        }
    };

    useEffect(() => {
        fetchMatchLive();
        const interval = setInterval(fetchMatchLive, 5000); // Poll every 5 seconds for "live" feel
        return () => clearInterval(interval);
    }, [matchId]);

    if (loading || !liveScore) return <BattleLoader label="Connecting to Ground Feed..." />;

    const strikerId = liveScore?.striker_id;
    const nonStrikerId = liveScore?.non_striker_id;
    const striker = battingSquad.find(p => p.id && strikerId && String(p.id) === String(strikerId));
    const nonStriker = battingSquad.find(p => p.id && nonStrikerId && String(p.id) === String(nonStrikerId));
    const currentBowler = bowlingSquad.find(p => p.id && liveScore?.bowler_id && String(p.id) === String(liveScore?.bowler_id));
    
    const totalBalls = (liveScore.current_over * liveScore.balls_per_over) + liveScore.balls_in_over;
    const currentRR = totalBalls > 0 ? ((liveScore.total_runs / totalBalls) * liveScore.balls_per_over).toFixed(2) : "0.00";
    
    let requiredRR = null;
    if (liveScore.innings_number === 2 && liveScore.target_runs) {
        const remainingRuns = Math.max(0, liveScore.target_runs - liveScore.total_runs);
        const remainingBalls = (liveScore.total_overs * liveScore.balls_per_over) - totalBalls;
        requiredRR = remainingBalls > 0 ? ((remainingRuns / remainingBalls) * liveScore.balls_per_over).toFixed(2) : "0.00";
    }

    return (
        <div className="live-scoring-page viewer-mode">
            <button className="back-home-btn" onClick={() => navigate(-1)}>← Exit Stadium</button>
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

            <div className="battle-arena">
                <div className="battle-card glass-card">
                    <label className="card-label">Striker End</label>
                    {striker ? (
                        <>
                            <div className="player-name"><span className="striker-star">★</span>{striker.name}</div>
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
                            <div className="player-name">{nonStriker.name}</div>
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
                    <label className="card-label">Current Bowler</label>
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
                                    <span className="stat-tag">Runs Gives</span>
                                </div>
                            </div>
                        </>
                    ) : <div className="player-name vacancy">Next Bowler Readying...</div>}
                </div>
            </div>

            <div className="analytics-card glass-card" style={{maxWidth: '800px', margin: '0 auto'}}>
                <label className="card-label">Live Timeline (Recent Balls)</label>
                <div className="ball-timeline-grouped" style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center'}}>
                    {liveScore.ball_history?.slice(-12).map((b, bi) => (
                        <div key={bi} className={`ball-pip r-${b.runs} ${b.is_wicket ? 'out' : ''}`} style={{margin: '0.5rem'}}>
                            {b.is_wicket ? 'W' : 
                                b.extra === 'wide' ? 'WD' : 
                                b.extra === 'no-ball' ? 'NB' : 
                                b.runs}
                        </div>
                    ))}
                </div>
            </div>
            
            {liveScore.innings_complete && (
                <div className="modal-overlay blur" style={{zIndex: 2000}}>
                    <div className="simple-modal glass-card animate-pop">
                        <h1 className="gradient-text">{liveScore.innings_number === 1 ? 'Innings Complete' : 'Match Concluded'}</h1>
                        <p style={{fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--neon-green)'}}>{match.match_summary || "Analyzing game results..."}</p>
                        <button className="prime-action-btn" onClick={() => navigate('/live-matches')}>Return to Arena</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveMatchView;
