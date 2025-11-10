'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLink({ href, children }: { href: string, children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <Link 
      href={href} 
      className={`px-4 py-2 rounded ${
        pathname === href 
          ? 'bg-gray-700 text-white' 
          : 'text-gray-300 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
} 
