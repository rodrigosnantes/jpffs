import { useState, useEffect } from 'react';
import type { LiveMatchState } from '../types';

export const useMatchTimer = (currentMatch: LiveMatchState & { startTime?: string | null; totalElapsedTime: number }) => {
    const [timeDisplay, setTimeDisplay] = useState('10:00');
    const [elapsedMs, setElapsedMs] = useState(0);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        const updateTimer = () => {
            let elapsed = currentMatch.totalElapsedTime;

            if (currentMatch.isActive && currentMatch.startTime) {
                const startTime = new Date(currentMatch.startTime).getTime();
                const now = new Date().getTime();
                elapsed += (now - startTime);
            }

            setElapsedMs(elapsed);

            const totalDuration = 10 * 60 * 1000; // 10 minutes in ms
            const remaining = Math.max(0, totalDuration - elapsed);

            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);

            setTimeDisplay(
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };

        // Update immediately
        updateTimer();

        if (currentMatch.isActive) {
            interval = setInterval(updateTimer, 1000);
        }

        return () => clearInterval(interval);
    }, [currentMatch.isActive, currentMatch.startTime, currentMatch.totalElapsedTime]);

    return { timeDisplay, elapsedMs };
};
