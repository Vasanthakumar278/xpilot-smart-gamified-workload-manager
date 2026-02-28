import { createContext, useState, useEffect } from 'react';

export const SessionContext = createContext();

export function SessionProvider({ children }) {
    const [activeSession, setActiveSession] = useState(null);
    const [energyLevel, setEnergyLevel] = useState(5); // 1-10; drives timer length in DeepWork

    // Persist active session across reloads
    useEffect(() => {
        const stored = localStorage.getItem('xpilot_active_session');
        if (stored) setActiveSession(JSON.parse(stored));

        const storedEnergy = localStorage.getItem('xpilot_energy');
        if (storedEnergy) setEnergyLevel(parseInt(storedEnergy, 10));
    }, []);

    const updateActiveSession = (session) => {
        setActiveSession(session);
        if (session) {
            localStorage.setItem('xpilot_active_session', JSON.stringify(session));
        } else {
            localStorage.removeItem('xpilot_active_session');
        }
    };

    const updateEnergyLevel = (level) => {
        setEnergyLevel(level);
        localStorage.setItem('xpilot_energy', String(level));
    };

    return (
        <SessionContext.Provider value={{
            activeSession,
            setActiveSession: updateActiveSession,
            energyLevel,
            setEnergyLevel: updateEnergyLevel,
        }}>
            {children}
        </SessionContext.Provider>
    );
}
