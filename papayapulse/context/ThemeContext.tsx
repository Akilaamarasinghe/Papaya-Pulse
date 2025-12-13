import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';
type Language = 'en' | 'si';

interface ThemeContextType {
  themeMode: ThemeMode;
  currentTheme: 'light' | 'dark';
  language: Language;
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@papaya_pulse_theme';
const LANGUAGE_STORAGE_KEY = '@papaya_pulse_language';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [language, setLanguageState] = useState<Language>('en');

  const currentTheme = themeMode === 'system' 
    ? (systemColorScheme || 'light')
    : themeMode;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      
      if (savedTheme) {
        setThemeModeState(savedTheme as ThemeMode);
      }
      if (savedLanguage) {
        setLanguageState(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <ThemeContext.Provider value={{ themeMode, currentTheme, language, setThemeMode, setLanguage, t }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Auth
    'login': 'Login',
    'signup': 'Sign Up',
    'email': 'Email',
    'password': 'Password',
    'name': 'Name',
    'district': 'District',
    'logout': 'Logout',
    'signOut': 'Sign Out',
    
    // Navigation
    'home': 'Home',
    'explore': 'Explore',
    'profile': 'Profile',
    'about': 'About',
    
    // Home Screen
    'welcome': 'Welcome',
    'selectService': 'Select a Service',
    'growthStage': 'Growth Stage Detection',
    'growthStageDesc': 'Identify your papaya plant\'s growth stage',
    'qualityCheck': 'Quality Check',
    'qualityCheckDesc': 'Check the quality of your papaya fruits',
    'marketPrice': 'Market Price',
    'marketPriceDesc': 'Get current market prices',
    'leafDisease': 'Leaf Disease Detection',
    'leafDiseaseDesc': 'Detect and identify leaf diseases',
    
    // Profile
    'editProfile': 'Edit Profile',
    'saveProfile': 'Save Profile',
    'cancelEdit': 'Cancel',
    'uploadPhoto': 'Upload Photo',
    'memberSince': 'Member Since',
    'settings': 'Settings',
    
    // Settings
    'appearance': 'Appearance',
    'language': 'Language',
    'theme': 'Theme',
    'lightMode': 'Light Mode',
    'darkMode': 'Dark Mode',
    'systemMode': 'System Default',
    'english': 'English',
    'sinhala': 'Sinhala',
    
    // About
    'version': 'Version',
    'mission': 'Mission',
    'missionText': 'Empowering Sri Lankan papaya farmers with AI-powered tools for better yields and sustainable farming practices.',
    'features': 'Features',
    'contactUs': 'Contact Us',
    'targetRegions': 'Target Regions',
    
    // Messages
    'success': 'Success',
    'error': 'Error',
    'loading': 'Loading...',
    'uploadSuccess': 'Profile photo updated successfully!',
    'uploadFailed': 'Failed to upload profile photo',
    'profileUpdated': 'Profile updated successfully!',
    'profileUpdateFailed': 'Failed to update profile',
    
    // Growth Stage
    'takePhoto': 'Take Photo',
    'selectPhoto': 'Select from Gallery',
    'photoInstructions': 'Photo Instructions',
    'instruction1': 'Stand 2-3 meters away from the plant',
    'instruction2': 'Capture the full plant in frame',
    'instruction3': 'Ensure good lighting conditions',
    'instruction4': 'Avoid shadows on the plant',
    'instruction5': 'Hold camera steady',
    
    // Quality Check
    'checkQuality': 'Check Quality',
    'qualityResult': 'Quality Result',
    
    // Market Price
    'currentPrices': 'Current Prices',
    'pricePerKg': 'Price per kg',
    
    // Leaf Disease
    'detectDisease': 'Detect Disease',
    'diseaseResult': 'Disease Result',
    'treatment': 'Treatment',
    
    // Signup
    'createAccount': 'Create Account',
    'joinPapayaPulse': 'Join Papaya Pulse today',
    'fullName': 'Full Name',
    'confirmPassword': 'Confirm Password',
    'role': 'Role',
    'farmer': 'Farmer',
    'customer': 'Customer',
    'alreadyHaveAccount': 'Already have an account? Sign In',
    
    // Common
    'retake': 'Retake Photo',
    'analyze': 'Analyze',
    'submit': 'Submit',
    'back': 'Back',
    'next': 'Next',
    'save': 'Save',
    'cancel': 'Cancel',
    
    // Growth Module
    'growthStageAndHarvest': 'Growth Stage & Harvest',
    'monitorYourPlants': 'Monitor your papaya plants and predict harvest time',
    'growthStageCheck': 'Growth Stage Check',
    'takePhotoToIdentify': 'Take a photo to identify plant growth stage',
    'harvestPrediction': 'Harvest Prediction',
    'calculateHarvestTime': 'Calculate expected harvest time and yield',
    'openCameraTakePhoto': 'Open Camera & Take Photo',
    'analyzeStage': 'Analyze Growth Stage',
    'growthStages': 'Growth Stages',
    'stageADesc': 'Seedling stage (0-2 months) - Plant establishment and early leaf development',
    'stageBDesc': 'Vegetative stage (3-6 months) - Rapid growth, trunk development, and leaf formation',
    'stageCDesc': 'Flowering stage (7-9 months) - Flower buds appear, pollination occurs',
    'stageDDesc': 'Fruiting stage (10-12 months) - Fruit development and maturation',
    'info': 'Info',
    
    // About Page
    'aboutPapayaPulse': 'About Papaya Pulse',
    'empoweringFarmers': 'Empowering Papaya Farmers with AI',
    'aboutDescription': 'Papaya Pulse is an AI-powered mobile application designed specifically for Sri Lankan papaya farmers and customers. Our mission is to revolutionize papaya farming through smart technology and data-driven insights.',
    'keyFeatures': 'Key Features',
    'growthStageDetectionFeature': 'Growth Stage Detection',
    'growthStageFeatureDesc': 'AI-powered image analysis to identify papaya growth stages and predict harvest time',
    'qualityGrading': 'Quality Grading',
    'qualityGradingDesc': 'Automated quality assessment for both farmers and customers',
    'marketPricePrediction': 'Market Price Prediction',
    'marketPricePredictionDesc': 'Smart pricing recommendations based on quality, variety, and market trends',
    'diseaseDetection': 'Disease Detection',
    'diseaseDetectionDesc': 'Early identification of leaf diseases with treatment recommendations',
    'ourMission': 'Our Mission',
    'ourMissionText': 'To empower papaya farmers with cutting-edge AI technology, helping them make informed decisions, maximize yields, and achieve better market prices while ensuring quality produce for customers.',
    
    // Market Module
    'marketPricePredictor': 'Market Price Predictor',
    'getBestPrice': 'Get the best price for your harvest',
    'variety': 'Variety',
    'cultivationMethod': 'Cultivation Method',
    'qualityGrade': 'Quality Grade',
    'totalHarvestCount': 'Total Harvest Count (fruits)',
    'avgWeightPerFruit': 'Average Weight per Fruit (kg)',
    'expectedSellingDate': 'Expected Selling Date',
    'predictMarketPrice': 'Predict Market Price',
    'farmersOnly': 'Farmers Only',
    'redLady': 'Red Lady',
    'solo': 'Solo',
    'tainung': 'Tainung',
    'organic': 'Organic',
    'inorganic': 'Inorganic',
    'gradeA': 'Grade A',
    'gradeB': 'Grade B',
    'gradeC': 'Grade C',
    'pricePrediction': 'Price Prediction',
    'predictedPricePerKg': 'Predicted Price per KG',
    'totalExpectedIncome': 'Total Expected Income',
    'bestSellingTime': 'Best Selling Time',
    'whyThisPrice': 'Why This Price?',
    'tip': 'Tip',
    
    // Harvest Module
    'harvestPredictionResults': 'Harvest Prediction Results',
    'enterPlantingDetails': 'Enter your planting details',
    'yieldPerTree': 'Yield per Tree',
    'totalHarvestDays': 'Total Harvest Days',
    'daysRemaining': 'Days Remaining',
    'explanation': 'Explanation',
    'plantingMonth': 'Planting Month',
    'numberOfTrees': 'Number of Trees',
    'wateringMethod': 'Watering Method',
    'wateringFrequency': 'Watering Frequency (times per week)',
    'soilType': 'Soil Type',
    'calculatePrediction': 'Calculate Prediction',
    'january': 'January',
    'february': 'February',
    'march': 'March',
    'april': 'April',
    'may': 'May',
    'june': 'June',
    'july': 'July',
    'august': 'August',
    'september': 'September',
    'october': 'October',
    'november': 'November',
    'december': 'December',
    
    // Leaf Disease Module
    'leafDiseaseScanner': 'Leaf Disease Scanner',
    'identifyTreatDiseases': 'Identify and treat papaya leaf diseases',
    'scanLeaf': 'Scan Leaf',
    'scanPhoto': 'Scan photo to detect diseases',
    'scanHistory': 'Scan History',
    'viewPastScans': 'View past scan results',
    'detectableDiseases': 'Detectable Diseases',
    'noScanHistory': 'No Scan History',
    'startByScanning': 'Start by scanning a leaf to detect diseases',
    'clearHistory': 'Clear History',
    'scans': 'scans',
    'scan': 'scan',
    
    // Quality Module  
    'papayaQualityGrader': 'Papaya Quality Grader',
    'assessQualityFruits': 'Assess the quality of your papaya fruits',
    'farmerGrading': 'Farmer Grading',
    'gradeYourHarvest': 'Grade your harvest for selling',
    'customerGrading': 'Customer Grading',
    'checkBeforeBuying': 'Check quality before buying',
    'qualityAssessment': 'Quality Assessment',
    'overallQuality': 'Overall Quality',
    'qualityScore': 'Quality Score',
    'recommendations': 'Recommendations',
    
    // Placeholders
    'enterFullName': 'Enter your full name',
    'enterEmail': 'Enter your email',
    'enterPassword': 'Enter your password',
    'confirmYourPassword': 'Confirm your password',
    'egValue': 'e.g., {value}',
    
    // Common Actions
    'goBack': 'Go Back',
    'done': 'Done',
    'close': 'Close',
    'continue': 'Continue',
    'skip': 'Skip',
    'refresh': 'Refresh',
    'share': 'Share',
    'delete': 'Delete',
    
    // Messages
    'pleaseWait': 'Please wait...',
    'processing': 'Processing...',
    'noData': 'No data available',
    'tryAgain': 'Try Again',
    'somethingWentWrong': 'Something went wrong',
  },
  si: {
    // Auth
    'login': 'ඇතුල් වන්න',
    'signup': 'ලියාපදිංචි වන්න',
    'email': 'විද්‍යුත් ලිපිනය',
    'password': 'මුරපදය',
    'name': 'නම',
    'district': 'දිස්ත්‍රික්කය',
    'logout': 'ඉවත් වන්න',
    'signOut': 'ඉවත් වන්න',
    
    // Navigation
    'home': 'මුල් පිටුව',
    'explore': 'ගවේෂණය',
    'profile': 'පැතිකඩ',
    'about': 'අප ගැන',
    
    // Home Screen
    'welcome': 'ආයුබෝවන්',
    'selectService': 'සේවාවක් තෝරන්න',
    'growthStage': 'වර්ධන අවධිය හඳුනා ගැනීම',
    'growthStageDesc': 'ඔබේ පැපොල් පැළයේ වර්ධන අවධිය හඳුනා ගන්න',
    'qualityCheck': 'ගුණාත්මක පරීක්ෂණය',
    'qualityCheckDesc': 'ඔබේ පැපොල් ඵල වල ගුණාත්මකභාවය පරීක්ෂා කරන්න',
    'marketPrice': 'වෙළඳපල මිල',
    'marketPriceDesc': 'වත්මන් වෙළඳපල මිල ලබා ගන්න',
    'leafDisease': 'කොළ රෝග හඳුනා ගැනීම',
    'leafDiseaseDesc': 'කොළ රෝග හඳුනාගෙන හඳුනා ගන්න',
    
    // Profile
    'editProfile': 'පැතිකඩ සංස්කරණය',
    'saveProfile': 'සුරකින්න',
    'cancelEdit': 'අවලංගු කරන්න',
    'uploadPhoto': 'ඡායාරූපය උඩුගත කරන්න',
    'memberSince': 'සාමාජිකත්වය',
    'settings': 'සැකසීම්',
    
    // Settings
    'appearance': 'පෙනුම',
    'language': 'භාෂාව',
    'theme': 'තේමාව',
    'lightMode': 'ආලෝක මාදිලිය',
    'darkMode': 'අඳුරු මාදිලිය',
    'systemMode': 'පද්ධති පෙරනිමිය',
    'english': 'ඉංග්‍රීසි',
    'sinhala': 'සිංහල',
    
    // About
    'version': 'අනුවාදය',
    'mission': 'මෙහෙවර',
    'missionText': 'වඩා හොඳ අස්වැන්නක් සහ තිරසාර ගොවිතැන් ක්‍රම සඳහා AI බලයෙන් යුත් මෙවලම් සමඟ ශ්‍රී ලංකාවේ පැපොල් ගොවීන් සවිබල ගැන්වීම.',
    'features': 'විශේෂාංග',
    'contactUs': 'අප අමතන්න',
    'targetRegions': 'ඉලක්ක කලාප',
    
    // Messages
    'success': 'සාර්ථකයි',
    'error': 'දෝෂයකි',
    'loading': 'පූරණය වෙමින්...',
    'uploadSuccess': 'පැතිකඩ ඡායාරූපය සාර්ථකව යාවත්කාලීන කරන ලදී!',
    'uploadFailed': 'පැතිකඩ ඡායාරූපය උඩුගත කිරීමට අසමත් විය',
    'profileUpdated': 'පැතිකඩ සාර්ථකව යාවත්කාලීන කරන ලදී!',
    'profileUpdateFailed': 'පැතිකඩ යාවත්කාලීන කිරීමට අසමත් විය',
    
    // Growth Stage
    'takePhoto': 'ඡායාරූපයක් ගන්න',
    'selectPhoto': 'ගැලරියෙන් තෝරන්න',
    'photoInstructions': 'ඡායාරූප උපදෙස්',
    'instruction1': 'පැළයට මීටර් 2-3 ක් දුරින් සිටගන්න',
    'instruction2': 'සම්පූර්ණ පැල රාමුවේ ග්‍රහණය කරගන්න',
    'instruction3': 'හොඳ ආලෝක තත්ත්වයන් සහතික කරන්න',
    'instruction4': 'පැල මත සෙවනැලි වළකින්න',
    'instruction5': 'කැමරාව ස්ථිරව තබා ගන්න',
    
    // Quality Check
    'checkQuality': 'ගුණාත්මකභාවය පරීක්ෂා කරන්න',
    'qualityResult': 'ගුණාත්මක ප්‍රතිඵලය',
    
    // Market Price
    'currentPrices': 'වත්මන් මිල',
    'pricePerKg': 'කිලෝග්‍රෑමයකට මිල',
    
    // Leaf Disease
    'detectDisease': 'රෝගය හඳුනා ගන්න',
    'diseaseResult': 'රෝග ප්‍රතිඵලය',
    'treatment': 'ප්‍රතිකාරය',
    
    // Signup
    'createAccount': 'ගිණුමක් සාදන්න',
    'joinPapayaPulse': 'අදම Papaya Pulse සමඟ එක්වන්න',
    'fullName': 'සම්පූර්ණ නම',
    'confirmPassword': 'මුරපදය තහවුරු කරන්න',
    'role': 'භූමිකාව',
    'farmer': 'ගොවියා',
    'customer': 'ගනුදෙනුකරු',
    'alreadyHaveAccount': 'දැනටමත් ගිණුමක් තිබේද? පුරනය වන්න',
    
    // Common
    'retake': 'නැවත ගන්න',
    'analyze': 'විශ්ලේෂණය කරන්න',
    'submit': 'ඉදිරිපත් කරන්න',
    'back': 'ආපසු',
    'next': 'ඊළඟ',
    'save': 'සුරකින්න',
    'cancel': 'අවලංගු කරන්න',
    
    // Growth Module
    'growthStageAndHarvest': 'වර්ධන අවධිය සහ අස්වැන්න',
    'monitorYourPlants': 'ඔබේ පැපොල් පැල නිරීක්ෂණය කර අස්වැන්න කාලය පුරෝකථනය කරන්න',
    'growthStageCheck': 'වර්ධන අවධිය පරීක්ෂා කිරීම',
    'takePhotoToIdentify': 'පැලවල වර්ධන අවධිය හඳුනා ගැනීමට ඡායාරූපයක් ගන්න',
    'harvestPrediction': 'අස්වනු පුරෝකථනය',
    'calculateHarvestTime': 'අපේක්ෂිත අස්වනු කාලය සහ අස්වැන්න ගණනය කරන්න',
    'openCameraTakePhoto': 'කැමරාව විවෘත කර ඡායාරූපය ගන්න',
    'analyzeStage': 'වර්ධන අවධිය විශ්ලේෂණය කරන්න',
    'growthStages': 'වර්ධන අවධි',
    'stageADesc': 'බීජ අවධිය (මාස 0-2) - පැල ස්ථාපනය සහ මුල් කොළ වර්ධනය',
    'stageBDesc': 'වෘක්ෂලතා අවධිය (මාස 3-6) - වේගවත් වර්ධනය, කඳ වර්ධනය සහ කොළ සෑදීම',
    'stageCDesc': 'මල් පිපීමේ අවධිය (මාස 7-9) - මල් පොහොට්ටු දිස්වීම, පරාගණය සිදුවීම',
    'stageDDesc': 'ඵල දැරීමේ අවධිය (මාස 10-12) - ඵල වර්ධනය සහ පරිණත වීම',
    'info': 'තොරතුරු',
    
    // About Page
    'aboutPapayaPulse': 'Papaya Pulse ගැන',
    'empoweringFarmers': 'AI සමඟ පැපොල් ගොවීන් සවිබල ගැන්වීම',
    'aboutDescription': 'Papaya Pulse යනු ශ්‍රී ලංකාවේ පැපොල් ගොවීන් සහ ගනුදෙනුකරුවන් සඳහා විශේෂයෙන් නිර්මාණය කරන ලද AI බලයෙන් යුත් ජංගම යෙදුමකි. අපගේ මෙහෙවර වන්නේ ස්මාර්ට් තාක්ෂණය සහ දත්ත මත පදනම් වූ තීක්ෂ්ණ බුද්ධිය හරහා පැපොල් ගොවිතැන විප්ලවීය කිරීමයි.',
    'keyFeatures': 'ප්‍රධාන විශේෂාංග',
    'growthStageDetectionFeature': 'වර්ධන අවධිය හඳුනා ගැනීම',
    'growthStageFeatureDesc': 'පැපොල් වර්ධන අවධි හඳුනා ගැනීමට සහ අස්වනු කාලය පුරෝකථනය කිරීමට AI බලයෙන් යුත් රූප විශ්ලේෂණය',
    'qualityGrading': 'ගුණාත්මක ශ්‍රේණිගත කිරීම',
    'qualityGradingDesc': 'ගොවීන් සහ ගනුදෙනුකරුවන් යන දෙදෙනාටම ස්වයංක්‍රීය ගුණාත්මක තක්සේරුව',
    'marketPricePrediction': 'වෙළඳපල මිල පුරෝකථනය',
    'marketPricePredictionDesc': 'ගුණාත්මකභාවය, ප්‍රභේදය සහ වෙළඳපල ප්‍රවණතා මත පදනම් වූ ස්මාර්ට් මිල නිර්දේශ',
    'diseaseDetection': 'රෝග හඳුනා ගැනීම',
    'diseaseDetectionDesc': 'ප්‍රතිකාර නිර්දේශ සමඟ කොළ රෝග ඉක්මනින් හඳුනා ගැනීම',
    'ourMission': 'අපගේ මෙහෙවර',
    'ourMissionText': 'නවීන AI තාක්ෂණය සමඟ පැපොල් ගොවීන් සවිබල ගැන්වීම, ඔවුන්ට දැනුවත් තීරණ ගැනීමට, අස්වැන්න උපරිම කිරීමට සහ වඩා හොඳ වෙළඳපල මිල ගණන් ලබා ගැනීමට උදව් කිරීම, ගනුදෙනුකරුවන් සඳහා ගුණාත්මක නිෂ්පාදන සහතික කිරීම.',
    
    // Market Module
    'marketPricePredictor': 'වෙළඳපල මිල පුරෝකථනය',
    'getBestPrice': 'ඔබේ අස්වැන්න සඳහා හොඳම මිල ලබා ගන්න',
    'variety': 'ප්‍රභේදය',
    'cultivationMethod': 'වගා ක්‍රමය',
    'qualityGrade': 'ගුණාත්මක ශ්‍රේණිය',
    'totalHarvestCount': 'සම්පූර්ණ අස්වනු ගණන (ඵල)',
    'avgWeightPerFruit': 'එක් ඵලයක සාමාන්‍ය බර (kg)',
    'expectedSellingDate': 'අපේක්ෂිත විකුණුම් දිනය',
    'predictMarketPrice': 'වෙළඳපල මිල පුරෝකථනය කරන්න',
    'farmersOnly': 'ගොවීන් සඳහා පමණි',
    'redLady': 'රතු ලේඩි',
    'solo': 'සෝලෝ',
    'tainung': 'ටයිනුං',
    'organic': 'කාබනික',
    'inorganic': 'අකාබනික',
    'gradeA': 'ශ්‍රේණිය A',
    'gradeB': 'ශ්‍රේණිය B',
    'gradeC': 'ශ්‍රේණිය C',
    'pricePrediction': 'මිල පුරෝකථනය',
    'predictedPricePerKg': 'පුරෝකථනය කළ කිලෝග්‍රෑමයකට මිල',
    'totalExpectedIncome': 'සම්පූර්ණ අපේක්ෂිත ආදායම',
    'bestSellingTime': 'හොඳම විකුණුම් කාලය',
    'whyThisPrice': 'මෙම මිල ඇයි?',
    'tip': 'උපදෙස',
    
    // Harvest Module
    'harvestPredictionResults': 'අස්වනු පුරෝකථන ප්‍රතිඵල',
    'enterPlantingDetails': 'ඔබේ රෝපණ විස්තර ඇතුළත් කරන්න',
    'yieldPerTree': 'ගසකට අස්වැන්න',
    'totalHarvestDays': 'සම්පූර්ණ අස්වනු දින',
    'daysRemaining': 'ඉතිරි දින',
    'explanation': 'පැහැදිලි කිරීම',
    'plantingMonth': 'සිටුවීමේ මාසය',
    'numberOfTrees': 'ගස් ගණන',
    'wateringMethod': 'ජල සම්පාදන ක්‍රමය',
    'wateringFrequency': 'ජල සම්පාදන වාර ගණන (සතියකට)',
    'soilType': 'පාංශු වර්ගය',
    'calculatePrediction': 'පුරෝකථනය ගණනය කරන්න',
    'january': 'ජනවාරි',
    'february': 'පෙබරවාරි',
    'march': 'මාර්තු',
    'april': 'අප්‍රේල්',
    'may': 'මැයි',
    'june': 'ජුනි',
    'july': 'ජූලි',
    'august': 'අගෝස්තු',
    'september': 'සැප්තැම්බර්',
    'october': 'ඔක්තෝබර්',
    'november': 'නොවැම්බර්',
    'december': 'දෙසැම්බර්',
    
    // Leaf Disease Module
    'leafDiseaseScanner': 'කොළ රෝග ස්කෑනරය',
    'identifyTreatDiseases': 'පැපොල් කොළ රෝග හඳුනා ගෙන ප්‍රතිකාර කරන්න',
    'scanLeaf': 'කොළය ස්කෑන් කරන්න',
    'scanPhoto': 'රෝග හඳුනා ගැනීමට ඡායාරූපය ස්කෑන් කරන්න',
    'scanHistory': 'ස්කෑන් ඉතිහාසය',
    'viewPastScans': 'පසුගිය ස්කෑන් ප්‍රතිඵල බලන්න',
    'detectableDiseases': 'හඳුනාගත හැකි රෝග',
    'noScanHistory': 'ස්කෑන් ඉතිහාසයක් නැත',
    'startByScanning': 'රෝග හඳුනා ගැනීමට කොළයක් ස්කෑන් කිරීමෙන් ආරම්භ කරන්න',
    'clearHistory': 'ඉතිහාසය ඉවත් කරන්න',
    'scans': 'ස්කෑන්',
    'scan': 'ස්කෑන්',
    
    // Quality Module
    'papayaQualityGrader': 'පැපොල් ගුණාත්මක ශ්‍රේණිගත කරන්නා',
    'assessQualityFruits': 'ඔබේ පැපොල් ඵල වල ගුණාත්මකභාවය තක්සේරු කරන්න',
    'farmerGrading': 'ගොවි ශ්‍රේණිගත කිරීම',
    'gradeYourHarvest': 'විකිණීම සඳහා ඔබේ අස්වැන්න ශ්‍රේණිගත කරන්න',
    'customerGrading': 'ගනුදෙනුකරු ශ්‍රේණිගත කිරීම',
    'checkBeforeBuying': 'මිලදී ගැනීමට පෙර ගුණාත්මකභාවය පරීක්ෂා කරන්න',
    'qualityAssessment': 'ගුණාත්මක තක්සේරුව',
    'overallQuality': 'සමස්ත ගුණාත්මකභාවය',
    'qualityScore': 'ගුණාත්මක ලකුණු',
    'recommendations': 'නිර්දේශ',
    
    // Placeholders
    'enterFullName': 'ඔබේ සම්පූර්ණ නම ඇතුළත් කරන්න',
    'enterEmail': 'ඔබේ විද්‍යුත් ලිපිනය ඇතුළත් කරන්න',
    'enterPassword': 'ඔබේ මුරපදය ඇතුළත් කරන්න',
    'confirmYourPassword': 'ඔබේ මුරපදය තහවුරු කරන්න',
    'egValue': 'උදා., {value}',
    
    // Common Actions
    'goBack': 'ආපසු යන්න',
    'done': 'අවසන්',
    'close': 'වසන්න',
    'continue': 'ඉදිරියට',
    'skip': 'මඟ හරින්න',
    'refresh': 'නැවුම් කරන්න',
    'share': 'බෙදා ගන්න',
    'delete': 'මකන්න',
    
    // Messages
    'pleaseWait': 'කරුණාකර රැඳී සිටින්න...',
    'processing': 'සැකසෙමින්...',
    'noData': 'දත්ත නොමැත',
    'tryAgain': 'නැවත උත්සාහ කරන්න',
    'somethingWentWrong': 'යමක් වැරදී ඇත',
  },
};
