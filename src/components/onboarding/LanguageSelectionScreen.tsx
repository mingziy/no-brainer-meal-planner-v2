import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { UserPreferences } from '../../types';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface LanguageSelectionScreenProps {
  userId: string;
  onComplete: () => void;
}

export function LanguageSelectionScreen({ userId, onComplete }: LanguageSelectionScreenProps) {
  const { t, i18n } = useTranslation('onboarding');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'zh'>('en');
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    try {
      setSaving(true);
      
      // Change the i18n language
      await i18n.changeLanguage(selectedLanguage);
      
      // Save to Firestore
      const userPreferencesRef = doc(db, 'userPreferences', userId);
      const userPreferences: UserPreferences = {
        userId,
        systemLanguage: selectedLanguage,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await setDoc(userPreferencesRef, userPreferences);
      
      console.log('✅ Language preference saved:', selectedLanguage);
      onComplete();
    } catch (error) {
      console.error('❌ Error saving language preference:', error);
      // Continue anyway - don't block user
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('languageSelection.title')}
          </h1>
          <p className="text-gray-600">
            {t('languageSelection.subtitle')}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {t('languageSelection.description')}
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {/* English Option */}
          <button
            onClick={() => setSelectedLanguage('en')}
            className={`w-full p-6 rounded-lg border-2 transition-all ${
              selectedLanguage === 'en'
                ? 'border-orange-500 bg-orange-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="text-2xl mb-1">🇺🇸</div>
                <div className="font-semibold text-lg text-gray-900">
                  {t('languageSelection.selectEnglish')}
                </div>
              </div>
              <div>
                {selectedLanguage === 'en' && (
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </button>

          {/* Chinese Option */}
          <button
            onClick={() => setSelectedLanguage('zh')}
            className={`w-full p-6 rounded-lg border-2 transition-all ${
              selectedLanguage === 'zh'
                ? 'border-orange-500 bg-orange-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="text-2xl mb-1">🇨🇳</div>
                <div className="font-semibold text-lg text-gray-900">
                  {t('languageSelection.selectChinese')}
                </div>
              </div>
              <div>
                {selectedLanguage === 'zh' && (
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </button>
        </div>

        <Button
          onClick={handleContinue}
          disabled={saving}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg font-semibold"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </span>
          ) : (
            t('languageSelection.continue')
          )}
        </Button>
      </Card>
    </div>
  );
}

