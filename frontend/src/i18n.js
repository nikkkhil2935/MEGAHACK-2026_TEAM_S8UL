import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: { translation: { welcome: 'Welcome', start_interview: 'Start Interview', dashboard: 'Dashboard', jobs: 'Browse Jobs', profile: 'Profile', login: 'Login', register: 'Register', logout: 'Logout' } },
  hi: { translation: { welcome: 'स्वागत है', start_interview: 'साक्षात्कार शुरू करें', dashboard: 'डैशबोर्ड', jobs: 'नौकरियां', profile: 'प्रोफाइल', login: 'लॉगिन', register: 'रजिस्टर', logout: 'लॉगआउट' } },
  es: { translation: { welcome: 'Bienvenido', start_interview: 'Iniciar Entrevista', dashboard: 'Panel', jobs: 'Empleos', profile: 'Perfil', login: 'Iniciar sesión', register: 'Registrarse', logout: 'Cerrar sesión' } },
  fr: { translation: { welcome: 'Bienvenue', start_interview: "Démarrer l'entretien", dashboard: 'Tableau de bord', jobs: 'Emplois', profile: 'Profil', login: 'Connexion', register: "S'inscrire", logout: 'Déconnexion' } },
  de: { translation: { welcome: 'Willkommen', start_interview: 'Interview starten', dashboard: 'Dashboard', jobs: 'Stellenangebote', profile: 'Profil', login: 'Anmelden', register: 'Registrieren', logout: 'Abmelden' } },
  ar: { translation: { welcome: 'مرحباً', start_interview: 'ابدأ المقابلة', dashboard: 'لوحة التحكم', jobs: 'الوظائف', profile: 'الملف الشخصي', login: 'تسجيل الدخول', register: 'التسجيل', logout: 'تسجيل الخروج' } },
  zh: { translation: { welcome: '欢迎', start_interview: '开始面试', dashboard: '仪表板', jobs: '职位', profile: '个人资料', login: '登录', register: '注册', logout: '退出' } },
  pt: { translation: { welcome: 'Bem-vindo', start_interview: 'Iniciar Entrevista', dashboard: 'Painel', jobs: 'Vagas', profile: 'Perfil', login: 'Entrar', register: 'Cadastrar', logout: 'Sair' } },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('lang') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  })

export default i18n
