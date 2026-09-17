'use client';
import NavLink from './NavLink';

export default function NavBar() {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <NavLink href="/chat">Chat</NavLink>
        </div>
      </div>
    </nav>
  );
} 
