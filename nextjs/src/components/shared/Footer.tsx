import Link from 'next/link';
import { Mail } from 'lucide-react';

const FOOTER_LINKS: Record<string, { name: string; href: string }[]> = {
  'Платформ': [
    { name: 'Дэлгүүрүүд', href: '/shops' },
    { name: 'Зарын булан', href: '/feed' },
    { name: 'Бараанууд', href: '/store' },
    { name: 'Gold', href: '/gold' },
  ],
  'Дэмжлэг': [
    { name: 'Нөхцөл', href: '/terms' },
    { name: 'Нууцлал', href: '/privacy' },
    { name: 'Холбоо барих', href: '/contact' },
    { name: 'Тусламж', href: '/help' },
  ],
  'Бизнес': [
    { name: 'Дэлгүүр нээх', href: '/open-shop' },
    { name: 'Борлуулагч болох', href: '/become-seller' },
    { name: 'Жолооч болох', href: '/become-driver' },
    { name: 'Хамтрах', href: '/partner' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#07080D] py-12 px-[6%] border-t border-white/[.06]">
      <div className="max-w-[1100px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <Link href="/" className="text-xl font-black text-white mb-2 inline-block no-underline cursor-pointer">
              eseller<em className="text-[#E8242C] not-italic">.mn</em>
            </Link>
            <p className="text-sm text-white/30 mb-4">Монголын нэгдсэн цахим зах</p>
            <div className="flex flex-col gap-2 text-sm text-white/40">
              <span className="flex items-center gap-1.5"><Mail size={13} /> info@eseller.mn</span>
            </div>
            <div className="flex gap-3 mt-4">
              <a href="https://facebook.com/eseller.mn" target="_blank" rel="noopener noreferrer"
                className="text-white/30 hover:text-white/60 transition text-sm no-underline">Facebook</a>
              <a href="https://instagram.com/eseller.mn" target="_blank" rel="noopener noreferrer"
                className="text-white/30 hover:text-white/60 transition text-sm no-underline">Instagram</a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white/60 text-sm font-semibold mb-3">{title}</h4>
              <div className="flex flex-col gap-2">
                {links.map((link) => (
                  <Link key={link.href} href={link.href}
                    className="text-white/30 text-sm no-underline hover:text-white/60 transition">
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Feedback */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[.06] pt-6">
          <p className="text-xs text-white/20">&copy; 2026 eseller.mn — Бүх эрх хуулиар хамгаалагдсан</p>
          <a href="mailto:feedback@eseller.mn?subject=Санал хүсэлт"
            className="bg-[#E8242C] text-white px-4 py-2 rounded-lg text-sm font-semibold no-underline hover:bg-[#c91f26] transition-colors">
            Санал хүсэлт илгээх
          </a>
        </div>
      </div>
    </footer>
  );
}
