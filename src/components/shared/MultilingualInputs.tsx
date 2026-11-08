import { useState } from 'react';
import { useLang } from '../../contexts/LanguageContext';

/* Field editors for admin forms: three tabs (ka / ru / en) that share a single
   input underneath. The Georgian value is the canonical one — frontend falls
   back to it when a translation is left blank, so only the ka tab is required.

   Each tab shows a small dot when its value is non-empty, so the admin can see
   at a glance which translations are missing without clicking through them. */

type LangKey = 'ka' | 'ru' | 'en';

interface BaseProps {
  label: string;
  required?: boolean;
  placeholder?: string;        // placeholder on the ka tab (hint for new entries)
  ka: string;
  ru: string;
  en: string;
  onChange: (lang: LangKey, value: string) => void;
}

interface TextProps extends BaseProps {
  as?: 'input';
}

interface TextAreaProps extends BaseProps {
  as: 'textarea';
  rows?: number;
}

type Props = TextProps | TextAreaProps;

export function MultilingualTextField(props: Props) {
  const { t } = useLang();
  const c = t.admin.common;
  const [active, setActive] = useState<LangKey>('ka');

  const value = active === 'ka' ? props.ka : active === 'ru' ? props.ru : props.en;
  const required = props.required && active === 'ka';
  const placeholder = active === 'ka' ? props.placeholder : undefined;

  const tabs: Array<{ key: LangKey; label: string }> = [
    { key: 'ka', label: c.langGeorgian },
    { key: 'ru', label: c.langRussian  },
    { key: 'en', label: c.langEnglish  },
  ];

  const filled: Record<LangKey, boolean> = {
    ka: (props.ka ?? '').trim().length > 0,
    ru: (props.ru ?? '').trim().length > 0,
    en: (props.en ?? '').trim().length > 0,
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-stone-700">{props.label}</span>
        <div className="flex gap-1 rounded-full border border-stone-200 bg-stone-50 p-0.5 text-xs">
          {tabs.map((tab) => {
            const isActive = active === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActive(tab.key)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium transition-colors ${
                  isActive ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab.label}
                <span
                  aria-hidden
                  className={`h-1.5 w-1.5 rounded-full ${
                    filled[tab.key]
                      ? isActive ? 'bg-emerald-300' : 'bg-emerald-500'
                      : isActive ? 'bg-stone-600' : 'bg-stone-300'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {props.as === 'textarea' ? (
        <textarea
          value={value}
          rows={props.rows ?? 3}
          required={required}
          placeholder={placeholder}
          onChange={(e) => props.onChange(active, e.target.value)}
          className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm placeholder-stone-400 shadow-sm transition-colors focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      ) : (
        <input
          type="text"
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={(e) => props.onChange(active, e.target.value)}
          className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm placeholder-stone-400 shadow-sm transition-colors focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      )}
    </div>
  );
}
