'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function AdminNavbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/[0.06] bg-black/60 backdrop-blur-[20px]">
      <div className="section-container h-[72px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.02]">
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10 group-hover:border-white/20 transition-all">
            <Image src="/logo/logo_icon_white.svg" alt="Circuit" width={24} height={24} />
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase">Circuit</span>
        </Link>

        {/* Admin Badge */}
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-[#666]">Admin Access</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              sessionStorage.removeItem('circuit_admin_session');
              window.location.href = '/admin/login';
            }}
            className="text-[0.65rem] font-bold uppercase tracking-widest text-[#444] hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
