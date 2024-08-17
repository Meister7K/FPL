'use client'

// components/Navbar.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { fetchLeagueManagers } from '../../utils/fetchManagers';
import { useFPLStore } from '@/store/fplStore';

const Navbar = () => {
    const router = useRouter();
    const leagueId = useFPLStore((state) => state.leagueId);

    // Check if the current route is '/'
    const isHomePage = router.pathname === '/';

    // CSS class to hide the navbar when on the home page
    const navClass = isHomePage ? 'hidden' : 'bg-gray-800 p-4 w-full';

    const links = [
        { name: 'Home', path: '/' },
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'History', path: '/dashboard/history' },
        { name: 'Records', path: '/dashboard/records' },
        { name: 'Matchups', path: '/dashboard/matchups' }
    ];

    // State to hold managers data and dropdown visibility
    const [managers, setManagers] = useState<{ name: string; path: string }[]>([]);
    const [isDropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        if (leagueId) {
            console.log('Fetching managers for league:', leagueId);
            fetchLeagueManagers(leagueId)
                .then((data) => {
                    console.log('Fetched managers data:', data);
                    const formattedManagers = data.map((user: { user_id: string; username: string }) => ({
                        name: user.username,
                        path: `/dashboard/managers/${user.user_id}`
                    }));
                    setManagers(formattedManagers);
                })
                .catch((error) => {
                    console.error('Error fetching league data:', error);
                });
        }
    }, [leagueId]);

    const toggleDropdown = () => {
        setDropdownOpen(!isDropdownOpen);
    };

    console.log(Object.entries(managers))
    return (
        <nav className={navClass}>
            <ul className="flex space-x-4 w-full justify-end items-center">
                {links.map((link) => (
                    <li key={link.name}>
                        <Link href={link.path} 
                            className={`text-white ${
                                router.pathname === link.path
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
                                        className="block px-4 py-2 hover:bg-gray-600 text-black"
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



