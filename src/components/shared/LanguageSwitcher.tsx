import { useLang } from '../../contexts/LanguageContext';
import type { Lang } from '../../i18n/translations';

type Theme = 'light' | 'dark';

export default function LanguageSwitcher({
  theme = 'light',
  className = '',
}: {
  theme?: Theme;
  className?: string;
}) {
  const { lang, setLang } = useLang();
  const options: Lang[] = ['ka', 'en', 'ru'];

  const base =
    theme === 'dark'
      ? 'border border-white/20 bg-white/10 backdrop-blur'
      : 'border border-stone-200 bg-white/70 backdrop-blur';

  const activeCls =
    theme === 'dark'
      ? 'bg-white text-stone-900 shadow'
      : 'bg-stone-900 text-white shadow';

  const idleCls =
    theme === 'dark'
      ? 'text-white/70 hover:text-white'
      : 'text-stone-500 hover:text-stone-900';

  return (
    <div
      className={`inline-flex items-center rounded-full p-0.5 text-xs font-semibold shadow-sm ${base} ${className}`}
    >
      {options.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-label={`Switch to ${l.toUpperCase()}`}
          className={`rounded-full px-2.5 py-1 transition-all ${
            lang === l ? activeCls : idleCls
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
