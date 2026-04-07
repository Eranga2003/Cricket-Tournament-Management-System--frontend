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
            <Route path="/join-team/:teamId" element={<JoinTeam />} />
        </Routes>
    );
};

export default AppRoutes;
