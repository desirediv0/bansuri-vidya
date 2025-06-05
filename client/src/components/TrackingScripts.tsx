"use client";

import React from 'react';
import useTrackingScripts from '@/hooks/useTrackingScripts';

const TrackingScripts: React.FC = () => {
    useTrackingScripts();
    return null; // This component doesn't render anything visible
};

export default TrackingScripts;
