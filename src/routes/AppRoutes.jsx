import React from 'react';
import { Routes, Route } from 'react-router-dom';
import OrganizerRegistration from '../pages/OrganizerRegistration';
import CaptainRegistration from '../pages/CaptainRegistration';
import Login from '../pages/Login';
import OrganizerDashboard from '../pages/OrganizerDashboard';
import CaptainHome from '../pages/CaptainHome';
import TeamHome from '../pages/TeamHome';
import CreateTeam from '../pages/CreateTeam';
import TeamProfile from '../pages/TeamProfile';
import JoinTeam from '../pages/JoinTeam';
import CaptainProfile from '../pages/CaptainProfile';
import ProtectedRoute from '../components/ProtectedRoute';
import StartMatch from '../pages/StartMatch';
import MatchConfig from '../pages/MatchConfig';
import LiveScoring from '../pages/LiveScoring';
import MatchHistory from '../pages/MatchHistory';
import LiveMatches from '../pages/LiveMatches';
import LiveMatchView from '../pages/LiveMatchView';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/organizer-registration" element={<OrganizerRegistration />} />
            <Route path="/captain-registration" element={<CaptainRegistration />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <OrganizerDashboard />
                </ProtectedRoute>
            } />
            <Route path="/captain-home" element={
                <ProtectedRoute>
                    <CaptainHome />
                </ProtectedRoute>
            } />
            <Route path="/team-home" element={
                <ProtectedRoute>
                    <TeamHome />
                </ProtectedRoute>
            } />
            <Route path="/create-team" element={
                <ProtectedRoute>
                    <CreateTeam />
                </ProtectedRoute>
            } />
            <Route path="/team-profile" element={
                <ProtectedRoute>
                    <TeamProfile />
                </ProtectedRoute>
            } />
            <Route path="/captain-profile" element={
                <ProtectedRoute>
                    <CaptainProfile />
                </ProtectedRoute>
            } />
            <Route path="/start-match" element={
                <ProtectedRoute>
                    <StartMatch />
                </ProtectedRoute>
            } />
            <Route path="/match-config/:matchId" element={
                <ProtectedRoute>
                    <MatchConfig />
                </ProtectedRoute>
            } />
            <Route path="/live-scoring/:matchId" element={
                <ProtectedRoute>
                    <LiveScoring />
                </ProtectedRoute>
            } />
            <Route path="/join-team/:teamId" element={<JoinTeam />} />
            <Route path="/match-history" element={<MatchHistory />} />
            <Route path="/live-matches" element={<LiveMatches />} />
            <Route path="/live-match/:matchId" element={<LiveMatchView />} />
        </Routes>
    );
};

export default AppRoutes;
