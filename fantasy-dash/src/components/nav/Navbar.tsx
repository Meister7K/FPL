'use client'

import Link from 'next/link';
import { useRouter,usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import useLeagueStore from '@/store/testStore';
import {getRosterOwnerName} from '@/utils/usernameUtil'

const Navbar = () => {
    const router = useRouter();
    const leagueId = useLeagueStore((state) => state.selectedLeague);
    const rosters = useLeagueStore((state) => state.currentRoster);
    const pathname = usePathname();

    const id = leagueId?.league_id;



    // Check if the current route is '/test'
    const isHomePage = pathname === '/test';

    // CSS class to hide the navbar when on the home page
    const navClass = isHomePage ? 'hidden' : 'bg-gray-800 p-4 w-full';

    const links = [
        { name: 'Home', path: '/test' },
        { name: 'Dashboard', path: `/test/${id}` },
        { name: 'History', path: `/test/${id}/history` },
        { name: 'Records', path: `/test/${id}/records` },
        { name: 'Matchups', path: `/test/${id}/matchups` }
    ];

    // State to hold managers data and dropdown visibility
    const [managers, setManagers] = useState([]);
    const [isDropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        if (rosters && rosters.length > 0) {
            const formattedManagers = rosters.map((roster) => ({
                name: roster.metadata?.team_name ||  getRosterOwnerName(roster.roster_id),
                path: `/test/${id}/managers/${roster.owner_id}`
            }));

            // Sort the managers alphabetically by their name
            formattedManagers.sort((a, b) => a.name.localeCompare(b.name));

            setManagers(formattedManagers);
        }
    }, [rosters, id]);

    const toggleDropdown = () => {
        setDropdownOpen(!isDropdownOpen);
    };

    return (
        <nav className={navClass}>
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
                {/* Dropdown for managers */}
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
