import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'ha' | 'yo' | 'ig';

interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

export const translations: Translations = {
  appTitle: {
    en: 'DubaLafiya Health App',
    ha: 'DubaLafiya',
    yo: 'AyẹwoIlera',
    ig: 'NyochaAhụike'
  },
  welcome: {
    en: 'Welcome to DubaLafiya',
    ha: 'Barka da zuwa DubaLafiya',
    yo: 'Kaabo si AyẹwoIlera',
    ig: 'Nnọọ na NyochaAhụike'
  },
  welcomeSub: {
    en: 'Your AI-powered companion for community health excellence.',
    ha: 'Abokin aikinka na AI don inganta lafiyar al\'umma.',
    yo: 'Oluranlowo AI rẹ fun ilera agbegbe to dara julọ.',
    ig: 'Onye enyemaka AI gị maka ahụike obodo kachasị mma.'
  },
  getStarted: {
    en: 'Get Started',
    ha: 'Fara aiki',
    yo: 'Bẹrẹ',
    ig: 'Malite'
  },
  home: {
    en: 'Home',
    ha: 'Gida',
    yo: 'Ile',
    ig: 'Ụlọ'
  },
  diagnose: {
    en: 'Diagnose',
    ha: 'Gano Ciwo',
    yo: 'Ayẹwo',
    ig: 'Nyocha'
  },
  outbreaks: {
    en: 'Outbreaks',
    ha: 'Barkewar Ciwo',
    yo: 'Ibesile',
    ig: 'Ntiwapụ'
  },
  resources: {
    en: 'Resources',
    ha: 'Ilimi',
    yo: 'Awọn orisun',
    ig: 'Akụrụngwa'
  },
  dashboard: {
    en: 'Community Health',
    ha: 'Lafiyar Al\'umma',
    yo: 'Ilera Agbegbe',
    ig: 'Ahụike Obodo'
  },
  totalPatients: {
    en: 'Total Patients',
    ha: 'Adadin Marasa Lafiya',
    yo: 'Apapọ Awọn Alaisan',
    ig: 'Ngụkọta Ndị Ọrịa'
  },
  vaccinationRate: {
    en: 'Vaccination Rate',
    ha: 'Adadin Rigakafi',
    yo: 'Oṣuwọn Ajẹsara',
    ig: 'Ọnụego Ọgwụ Mgbochi'
  },
  recentPatients: {
    en: 'Recent Patients',
    ha: 'Marasa Lafiya na Kusa',
    yo: 'Awọn Alaisan Laipe',
    ig: 'Ndị Ọrịa Na-adịbeghị anya'
  },
  new: {
    en: 'New',
    ha: 'Sabuwa',
    yo: 'Tuntun',
    ig: 'Ọhụrụ'
  },
  patientInfo: {
    en: 'Patient Information',
    ha: 'Bayanin Mara Lafiya',
    yo: 'Alaye Alaisan',
    ig: 'Ozi Onye Ọrịa'
  },
  fullName: {
    en: 'Full Name',
    ha: 'Cikakken Suna',
    yo: 'Orukọ Kikun',
    ig: 'Aha zuru ezu'
  },
  age: {
    en: 'Age',
    ha: 'Shekaru',
    yo: 'Ọjọ ori',
    ig: 'Afọ'
  },
  gender: {
    en: 'Gender',
    ha: 'Jinsi',
    yo: 'Akọ tabi Abo',
    ig: 'Nwoke ma ọ bụ Nwanyị'
  },
  location: {
    en: 'Village / Location',
    ha: 'Kauye / Wuri',
    yo: 'Abule / Ipo',
    ig: 'Obodo / Ebe'
  },
  vaccinated: {
    en: 'Patient is Vaccinated',
    ha: 'Mara lafiya ya yi rigakafi',
    yo: 'Alaisan ti gba ajẹsara',
    ig: 'Onye ọrịa agbaala ọgwụ mgbochi'
  },
  next: {
    en: 'Next',
    ha: 'Gaba',
    yo: 'Itele',
    ig: 'Osote'
  },
  back: {
    en: 'Back',
    ha: 'Baya',
    yo: 'Pada',
    ig: 'Azu'
  },
  symptoms: {
    en: 'Symptoms',
    ha: 'Alamomin Ciwo',
    yo: 'Awọn aami aisan',
    ig: 'Mgbaàmà'
  },
  runDiagnosis: {
    en: 'Run AI Diagnosis',
    ha: 'Gudanar da AI don Gano Ciwo',
    yo: 'Ṣe Ayẹwo AI',
    ig: 'Mee Nyocha AI'
  },
  analysisComplete: {
    en: 'Analysis Complete',
    ha: 'An kammala bincike',
    yo: 'Ayẹwo ti pari',
    ig: 'Nyocha agwụla'
  },
  statusConsult: {
    en: 'Consult',
    ha: ' Shawara',
    yo: 'Ijumọsọrọ',
    ig: 'Ndụmọdụ'
  },
  statusTreated: {
    en: 'Treated',
    ha: 'An Yi Magani',
    yo: 'Ti tọju',
    ig: 'Agwọrọ'
  },
  statusReferred: {
    en: 'Referred',
    ha: 'An Tura',
    yo: 'Ti tọka',
    ig: 'E zigara'
  },
  recommendedActions: {
    en: 'Recommended Actions',
    ha: 'Abubuwan da ya kamata a yi',
    yo: 'Awọn iṣe ti a ṣe iṣeduro',
    ig: 'Omume ndị a tụrụ aro'
  },
  done: {
    en: 'Done & Return Home',
    ha: 'An gama & Koma Gida',
    yo: 'Pari & Pada si Ile',
    ig: 'Emela & Laghachi Ụlọ'
  },
  offlineMode: {
    en: 'Offline Mode Enabled',
    ha: 'Yanayin ba tare da yanar gizo ba',
    yo: 'Ipo aisinilori ayelujara',
    ig: 'Ụdị anọghị n\'ịntanetị'
  },
  online: {
    en: 'Online',
    ha: 'Akan layi',
    yo: 'Lori ayelujara',
    ig: 'Nọ n\'ịntanetị'
  },
  offline: {
    en: 'Offline',
    ha: 'Ba a kan layi ba',
    yo: 'Aisinilori ayelujara',
    ig: 'Anọghị n\'ịntanetị'
  },
  roleOfficial: {
    en: 'Health Official',
    ha: 'Jami\'in Lafiya',
    yo: 'Oṣiṣẹ Ilera',
    ig: 'Onye Ọrụ Ahụike'
  },
  roleVolunteer: {
    en: 'CHV Volunteer',
    ha: 'Mai Sa-kai na CHV',
    yo: 'Oluyọọda CHV',
    ig: 'Onye wepụtara onwe ya na CHV'
  },
  adminDashboard: {
    en: 'Admin Dashboard',
    ha: 'Shafin Gudanarwa',
    yo: 'Dasibodu Alakoso',
    ig: 'Dashboard Nchịkwa'
  },
  allPatients: {
    en: 'All Patients (District)',
    ha: 'Duk Marasa Lafiya (Gunduma)',
    yo: 'Gbogbo Awọn Alaisan (Agbegbe)',
    ig: 'Ndị Ọrịa Niile (Mpaghara)'
  },
  outbreakDetection: {
    en: 'Outbreak Detection',
    ha: 'Gano Barkewar Ciwo',
    yo: 'Iwari Ibesile',
    ig: 'Nchọpụta Ntiwapụ'
  },
  outbreakSub: {
    en: 'Real-time monitoring of disease trends in your district.',
    ha: 'Kulawa da yanayin cututtuka a gundumar ku.',
    yo: 'Abojuto akoko gidi ti awọn aṣa arun ni agbegbe rẹ.',
    ig: 'Nlekọta oge gidi nke usoro ọrịa na mpaghara gị.'
  },
  districtMap: {
    en: 'District Map View',
    ha: 'Taswirar Gunduma',
    yo: 'Wiwo Maapu Agbegbe',
    ig: 'Map Mpaghara'
  },
  activeTrends: {
    en: 'Active Trends',
    ha: 'Yanayin da ake ciki',
    yo: 'Awọn aṣa lọwọlọwọ',
    ig: 'Usoro dị ugbu a'
  },
  noOutbreaks: {
    en: 'No active outbreaks detected.',
    ha: 'Ba a gano barkewar wani ciwo ba.',
    yo: 'A ko ri ibesile kankan.',
    ig: 'Enweghị ntiwapụ ọrịa ọ bụla achọpụtara.'
  },
  educationalResources: {
    en: 'Educational Resources',
    ha: 'Hanyoyin Ilimi',
    yo: 'Awọn orisun ẹkọ',
    ig: 'Akụrụngwa Mmụta'
  },
  resourcesSub: {
    en: 'Quick guides and training materials for CHVs.',
    ha: 'Jagora da kayan horo don CHVs.',
    yo: 'Awọn itọsọna iyara ati awọn ohun elo ikẹkọ fun awọn CHV.',
    ig: 'Ntuziaka ngwa ngwa na ihe ọzụzụ maka ndị CHV.'
  },
  offlineModeDesc: {
    en: 'Resources are automatically downloaded for offline use in remote areas.',
    ha: 'Ana sauke bayanan ilimi kai tsaye don amfani ba tare da yanar gizo ba.',
    yo: 'A n gba awọn orisun silẹ laifọwọyi fun lilo aisinilori ayelujara.',
    ig: 'A na-ebudata akụrụngwa na-akpaghị aka maka ojiji anọghị n\'ịntanetị.'
  },
  manageDownloads: {
    en: 'Manage Downloads',
    ha: 'Sarrafa Abubuwan da aka Sauke',
    yo: 'Ṣakoso awọn igbasilẹ',
    ig: 'Nwee njikwa nbudata'
  },
  isPregnant: {
    en: 'Is the patient pregnant?',
    ha: 'Shin mara lafiyar tana da juna biyu?',
    yo: 'Njẹ alaisan naa loyun?',
    ig: 'Onye ọrịa ahụ ọ dị ime?'
  },
  immunizationUpToDate: {
    en: 'Immunization up to date?',
    ha: 'Shin rigakafin ya cika?',
    yo: 'Njẹ ajẹsara ti wa ni imudojuiwọn?',
    ig: 'Ọgwụ mgbochi ọ̀ dị n\'oge?'
  },
  validationError: {
    en: 'Please fill in all required fields correctly.',
    ha: 'Da fatan za a cika duk wuraren da ake buƙata daidai.',
    yo: 'Jọwọ fọwọsi gbogbo awọn aaye ti o nilo ni deede.',
    ig: 'Biko dejupụta mpaghara niile achọrọ nke ọma.'
  },
  selectLanguage: {
    en: 'Select Language',
    ha: 'Zaɓi Harshe',
    yo: 'Yan Ede',
    ig: 'Họrọ Asụsụ'
  },
  patientHistory: {
    en: 'Patient History',
    ha: 'Tarihin Mara Lafiya',
    yo: 'Itan Alaisan',
    ig: 'Akụkọ Onye Ọrịa'
  },
  pastDiagnoses: {
    en: 'Past Diagnoses',
    ha: 'Abubuwan da aka gano a baya',
    yo: 'Awọn ayẹwo ti o kọja',
    ig: 'Nchọpụta gara aga'
  },
  noHistory: {
    en: 'No past records found for this patient.',
    ha: 'Ba a sami tarihin wannan mara lafiyar ba.',
    yo: 'A ko ri itan kankan fun alaisan yii.',
    ig: 'Achọpụtaghị akụkọ gara aga maka onye ọrịa a.'
  },
  details: {
    en: 'Details',
    ha: 'Bayanai',
    yo: 'Awọn alaye',
    ig: 'Nkọwa'
  },
  history: {
    en: 'History',
    ha: 'Tarihi',
    yo: 'Itan',
    ig: 'Akụkọ'
  },
  close: {
    en: 'Close',
    ha: 'Rufe',
    yo: 'Paade',
    ig: 'Mechie'
  },
  search: {
    en: 'Search',
    ha: 'Nemo',
    yo: 'Wá',
    ig: 'Chọọ'
  },
  searchPatients: {
    en: 'Search patients by name or location...',
    ha: 'Nemo marasa lafiya ta suna ko wuri...',
    yo: 'Wa awọn alaisan nipasẹ orukọ tabi ipo...',
    ig: 'Chọọ ndị ọrịa site n\'aha ma ọ bụ ebe...'
  },
  guestLogin: {
    en: 'Continue as Guest',
    ha: 'Ci gaba a matsayin Baƙo',
    yo: 'Tẹsiwaju bi alejo',
    ig: 'Gaa n\'ihu dịka onye ọbịa'
  },
  emailLogin: {
    en: 'Login with Email',
    ha: 'Shiga da Imel',
    yo: 'Wọle pẹlu Imeeli',
    ig: 'Banye na email'
  },
  logout: {
    en: 'Log Out',
    ha: 'Fita',
    yo: 'Wọle jade',
    ig: 'Pụọ'
  },
  authAuthorizedOnly: {
    en: 'For Authorized Personnel Only',
    ha: 'Don Ma\'aikata Kawai',
    yo: 'Fun Awọn Oṣiṣẹ ti a fọwọsi nikan',
    ig: 'Maka ndị ọrụ enyere ikike naanị'
  },
  chat: {
    en: 'Chat',
    ha: 'Hira',
    yo: 'Iwiregbe',
    ig: 'Mkparịta ụka'
  },
  typeMessage: {
    en: 'Type a message...',
    ha: 'Rubuta sako...',
    yo: 'Tẹ ọrọ ranṣẹ...',
    ig: 'Deedee ozi...'
  },
  volunteersChat: {
    en: 'CHV Network Chat',
    ha: 'Hirar Masu Sa-kai',
    yo: 'Iwiregbe Nẹtiwọọki CHV',
    ig: 'Mkparịta ụka CHV'
  },
  voiceInput: {
    en: 'Voice Input',
    ha: 'Shigar da Murya',
    yo: 'Iṣawọle Ohun',
    ig: 'Ntinye Olu'
  },
  listening: {
    en: 'Listening...',
    ha: 'Sauraro...',
    yo: 'Ngbo...',
    ig: 'Na-ege ntị...'
  },
  stopListening: {
    en: 'Stop',
    ha: 'Tsaya',
    yo: 'Duro',
    ig: 'Kwụsị'
  },
  removePhoto: {
    en: 'Remove Photo',
    ha: 'Cire Hoto',
    yo: 'Yọ Aworan kuro',
    ig: 'Wepụ Foto'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
