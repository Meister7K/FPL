// @ts-nocheck
'use client'

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react'; // Import Menu and X icons from lucide-react
import useLeagueStore from '@/store/testStore';
import { getRosterOwnerName } from '@/utils/usernameUtil';

const Navbar = () => {
    const router = useRouter();
    const leagueId = useLeagueStore((state) => state.selectedLeague);
    const rosters = useLeagueStore((state) => state.currentRoster);
    const leagueUsers = useLeagueStore((state) => state.leagueUsers);
    const pathname = usePathname();

    const id = leagueId?.league_id;

    const [isLoading, setIsLoading] = useState(true);
    const [managers, setManagers] = useState([]);
    const [isNavOpen, setNavOpen] = useState(false);
    const [isManagerModalOpen, setManagerModalOpen] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (id && rosters && rosters.length > 0 && leagueUsers) {
                const formattedManagers = rosters.map((roster) => ({
                    name: roster.metadata?.team_name || getRosterOwnerName(roster.owner_id, leagueUsers),
                    path: `/test/${id}/managers/${roster.owner_id}`
                }));

                formattedManagers.sort((a, b) => a.name.localeCompare(b.name));
                setManagers(formattedManagers);
                setIsLoading(false);
            }
        };

        loadData();
    }, [id, rosters, leagueUsers]);

    const isHomePage = pathname === '/';

    // Function to close nav modals on link click
    const closeNav = () => setNavOpen(false);
    const closeManagerModal = () => setManagerModalOpen(false);

    if (isLoading || isHomePage) {
        return null; // Don't render anything while loading or on the home page
    }

    const links = [
        { name: 'Home', path: '/test' },
        { name: 'Dashboard', path: `/test/${id}` },
        { name: 'Draft', path: `/test/${id}/draft` },
        { name: 'History', path: `/test/${id}/history` },
        { name: 'Players', path: `/test/${id}/players` },
        { name: 'Matchups', path: `/test/${id}/matchups` }
    ];

    return (
        <nav className="bg-gray-800 p-4 w-full">
            <div className="flex justify-between items-center">
                <h1 className="text-white text-lg">League Navbar</h1>
                {/* Mobile Hamburger Icon */}
                <button 
                    onClick={() => setNavOpen(true)}
                    className="text-white block lg:hidden"
                >
                    <Menu size={28} />
                </button>
                {/* Desktop Menu */}
                <ul className="hidden lg:flex space-x-4 items-center">
                    {links.map((link) => (
                        <li key={link.name}>
                            <Link href={link.path} 
                                className={`text-white ${
                                    pathname === link.path
                                        ? 'font-bold border-b-2 border-white'
                                        : 'hover:text-gray-300'
                                }`}
                                onClick={closeNav} // Close nav on link click
                            >
                                {link.name}
                            </Link>
                        </li>
                    ))}
                    <li>
                        <button 
                            onClick={() => setManagerModalOpen(true)}
                            className="text-white hover:text-gray-300"
                        >
                            Managers
                        </button>
                    </li>
                </ul>
            </div>

            {/* Full-screen mobile nav modal */}
            {isNavOpen && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-95 z-50 flex flex-col items-center justify-center">
                    <button 
                        onClick={() => setNavOpen(false)}
                        className="absolute top-4 right-4 text-white"
                    >
                        <X size={28} />
                    </button>
                    <ul className="space-y-6">
                        {links.map((link) => (
                            <li key={link.name}>
                                <Link href={link.path} 
                                    className="text-white text-2xl"
                                    onClick={closeNav}
                                >
                                    {link.name}
                                </Link>
                            </li>
                        ))}
                        <li>
                            <button 
                                onClick={() => {
                                    setNavOpen(false);
                                    setManagerModalOpen(true);
                                }}
                                className="text-white text-2xl"
                            >
                                Managers
                            </button>
                        </li>
                    </ul>
                </div>
            )}

            {/* Manager selection modal */}
            {isManagerModalOpen && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-95 z-50 flex flex-col items-center justify-center">
                    <button 
                        onClick={closeManagerModal}
                        className="absolute top-4 right-4 text-white"
                    >
                        <X size={28} />
                    </button>
                    <ul className="space-y-6">
                        {managers.map((manager) => (
                            <li key={manager.name}>
                                <Link href={manager.path} 
                                    className="text-white text-2xl"
                                    onClick={closeManagerModal}
                                >
                                    {manager.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
