import { config } from '../../config';

interface HeaderProps {
  onHomeClick?: () => void;
}

export default function Header({ onHomeClick }: HeaderProps) {
  const title = `${config.schoolName}${config.classYear ? ' ' + config.classYear : ''}: ${config.tagline}`;

  return (
    <header className="bg-surface border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onHomeClick}
          className="text-left group focus:outline-none flex items-center gap-3"
          aria-label="Back to map"
        >
          {config.logoSrc && (
            <img src={config.logoSrc} alt="" className="h-9 w-9 object-contain" />
          )}
          <div>
            <h1 className="font-playfair text-2xl md:text-3xl text-gray-900 tracking-tight group-hover:text-primary transition-colors">
              {title}
            </h1>
            <p className="text-sm text-gray-500 font-sans mt-0.5">
              {config.subtitle}
            </p>
          </div>
        </button>
        {config.credit.text && (
          <p className="text-xs text-gray-500 font-sans text-right leading-relaxed">
            <a
              href={config.credit.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              {config.credit.text}
            </a>
          </p>
        )}
      </div>
    </header>
  );
}
