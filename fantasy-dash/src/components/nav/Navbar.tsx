// @ts-nocheck
'use client'

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import useLeagueStore from '@/store/testStore';
import { getRosterOwnerName } from '@/utils/usernameUtil'

const Navbar = () => {
    const router = useRouter();
    const leagueId = useLeagueStore((state) => state.selectedLeague);
    const rosters = useLeagueStore((state) => state.currentRoster);
    const leagueUsers = useLeagueStore((state) => state.leagueUsers);
    const pathname = usePathname();

    const id = leagueId?.league_id;

    const [isLoading, setIsLoading] = useState(true);
    const [managers, setManagers] = useState([]);
    const [isDropdownOpen, setDropdownOpen] = useState(false);

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

    const toggleDropdown = () => {
        setDropdownOpen(!isDropdownOpen);
    };

    return (
        <nav className="bg-gray-800 p-4 w-full">
            <ul className="flex space-x-4 w-full justify-end items-center">
                {links.map((link) => (
                    <li key={link.name}>
                        <Link href={link.path} 
                            className={`text-white ${
                                pathname === link.path
                                    ? 'font-bold border-b-2 border-white'
                                    : 'hover:text-gray-300'
                            }`}
                        >
                            {link.name}
                        </Link>
                    </li>
                ))}
                <li className="relative">
                    <button 
                        onClick={toggleDropdown}
                        className="text-white hover:text-gray-300"
                    >
                        Managers
                    </button>
                    {isDropdownOpen && (
                        <ul className="absolute right-0 mt-2 w-48 bg-gray-700 text-white border border-gray-600 rounded-md shadow-lg">
                            {managers.map((manager) => (
                                <li key={manager.name}>
                                    <Link 
                                        href={manager.path} 
                                        className="block px-4 py-2 hover:bg-gray-600 text-white hover:text-black"
                                    >
                                        {manager.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;