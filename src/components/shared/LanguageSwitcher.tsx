import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  console.log('🎨 LanguageSwitcher rendering, current language:', i18n.language);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    console.log('🔄 Toggling language from', i18n.language, 'to', newLang);
    i18n.changeLanguage(newLang).then(() => {
      console.log('✅ Language changed successfully to:', i18n.language);
    }).catch((error) => {
      console.error('❌ Error changing language:', error);
    });
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={toggleLanguage}
      className="shrink-0"
    >
      {i18n.language === 'zh' ? 'EN' : '中文'}
    </Button>
  );
}

