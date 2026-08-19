'use client';

// ============================================================================
// Lightweight client-side i18n for the Karatrack Search Engine.
// ============================================================================
// Same 13 languages as karatrack.com. Auto-detects the browser language on
// first visit, remembers the choice in a cookie, and exposes:
//   <LocaleProvider>       — wrap the app (in app/layout.tsx)
//   useT()                 — t('key') translation hook
//   <LanguageSwitcher />   — the dropdown in the header
//
// This page is a single-route client app, so translating client-side keeps
// URLs unchanged (good for existing SEO) while the visible UI follows the
// visitor's language — the same behavior as the Karameet app.
// ============================================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { MAIN_SITE_LIVE, MAIN_SITE_URL } from '@/lib/site-config';
import {
  LANG_COOKIE,
  readPrefCookie,
  writeSharedPrefCookie,
  expireHostCookie,
} from '@/lib/cross-site-prefs';

export const LOCALES = [
  'en', 'es', 'fr', 'de', 'pt', 'ar', 'hi', 'ja', 'ko', 'vi', 'tl', 'zh-CN', 'zh-TW',
] as const;
export type Locale = (typeof LOCALES)[number];

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  ar: 'العربية',
  hi: 'हिन्दी',
  ja: '日本語',
  ko: '한국어',
  vi: 'Tiếng Việt',
  tl: 'Tagalog',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
};

// Legacy host-only cookie from before preferences were shared with the
// main site. Still read as a fallback so old visitors keep their choice.
const LEGACY_COOKIE = 'KT_LOCALE';

// Map a raw browser language ("pt-BR", "zh-HK", "de") to a supported locale.
function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  const raw = (navigator.language || 'en').trim();
  const lower = raw.toLowerCase();
  if (lower.startsWith('zh')) {
    // Traditional-script regions -> zh-TW; everything else -> zh-CN.
    return /tw|hk|mo|hant/.test(lower) ? 'zh-TW' : 'zh-CN';
  }
  const base = lower.split('-')[0];
  const hit = LOCALES.find((l) => l.toLowerCase() === lower) ??
    LOCALES.find((l) => l.split('-')[0] === base);
  return hit ?? 'en';
}

function readCookie(): Locale | null {
  // Shared cross-site choice first (set by either site), legacy cookie second.
  const v = readPrefCookie(LANG_COOKIE) ?? readPrefCookie(LEGACY_COOKIE) ?? '';
  return (LOCALES as readonly string[]).includes(v) ? (v as Locale) : null;
}

/* ---------------------------------------------------------------------------
   Dictionary — every user-facing UI string on the page.
   (Long-form Help and Terms of Service content intentionally stays in
   English for now; legal text should not be machine-shortened.)
--------------------------------------------------------------------------- */
type Dict = Record<string, string>;

const MESSAGES: Record<Locale, Dict> = {
  en: {
    tagline: 'Karaoke Song Search',
    products: 'Products', pricing: 'Pricing', roadmap: 'Roadmap', updates: 'Updates', support: 'Support', login: 'Login',
    menu: 'Menu',
    contact: 'Contact',
    joinCommunity: 'Join our community on Facebook',
    help: 'Help',
    helpSub: 'How to search',
    tos: 'Terms of Service',
    tosSub: 'Legal information',
    tosShort: 'TOS',
    explore: 'Explore Karatrack',
    aiStudioTitle: 'Karatrack Studio',
    aiStudioSub: 'Create karaoke tracks online',
    lastUpdated: 'Last updated',
    artistPlaceholder: 'Artist (partial OK)',
    titlePlaceholder: 'Title (partial OK)',
    search: 'Search',
    legacyLabel: 'Search legacy disc database',
    slower: '(slower)',
    searching: 'Searching…',
    shownOf: '{shown} shown of {total}',
    noResults: 'No results. Tip: search Artist and/or Title. Partial words are OK.',
    searchingTracks: 'Searching for tracks...',
    progressInit: 'Initializing search...',
    progressSources: 'Searching Party Tyme, Karaoke Version, and YouTube...',
    progressProcessing: 'Processing search results...',
    progressLegacy: 'Checking legacy disc database...',
    artist: 'Artist',
    title: 'Title',
    brand: 'Brand',
    legacy: 'Legacy',
    buy: 'Buy',
    viewBuy: 'View / Buy',
    legacyDiscs: 'Legacy discs',
    noLegacyDiscs: 'No legacy discs found.',
    close: 'Close',
    ytFor: 'YouTube official channels for',
    ytChecking: 'Checking YouTube…',
    ytNone: 'No official channel videos found.',
    copy: 'Copy',
    copied: 'Copied!',
    view: 'View',
    ytGeneral: 'General YouTube results for',
  },
  es: {
    tagline: 'Buscador de canciones de karaoke',
    products: 'Productos', pricing: 'Precios', roadmap: 'Hoja de ruta', updates: 'Novedades', support: 'Soporte', login: 'Iniciar sesión',
    menu: 'Menú',
    contact: 'Contacto',
    joinCommunity: 'Únete a nuestra comunidad en Facebook',
    help: 'Ayuda',
    helpSub: 'Cómo buscar',
    tos: 'Términos de servicio',
    tosSub: 'Información legal',
    tosShort: 'Términos',
    explore: 'Explorar Karatrack',
    aiStudioTitle: 'Karatrack Studio',
    aiStudioSub: 'Crea pistas de karaoke en línea',
    lastUpdated: 'Última actualización',
    artistPlaceholder: 'Artista (parcial OK)',
    titlePlaceholder: 'Título (parcial OK)',
    search: 'Buscar',
    legacyLabel: 'Buscar en la base de discos clásicos',
    slower: '(más lento)',
    searching: 'Buscando…',
    shownOf: '{shown} mostrados de {total}',
    noResults: 'Sin resultados. Consejo: busca por Artista y/o Título. Las palabras parciales funcionan.',
    searchingTracks: 'Buscando pistas...',
    progressInit: 'Iniciando la búsqueda...',
    progressSources: 'Buscando en Party Tyme, Karaoke Version y YouTube...',
    progressProcessing: 'Procesando resultados...',
    progressLegacy: 'Consultando la base de discos clásicos...',
    artist: 'Artista',
    title: 'Título',
    brand: 'Marca',
    legacy: 'Clásicos',
    buy: 'Comprar',
    viewBuy: 'Ver / Comprar',
    legacyDiscs: 'Discos clásicos',
    noLegacyDiscs: 'No se encontraron discos clásicos.',
    close: 'Cerrar',
    ytFor: 'Canales oficiales de YouTube para',
    ytChecking: 'Consultando YouTube…',
    ytNone: 'No se encontraron videos de canales oficiales.',
    copy: 'Copiar',
    copied: '¡Copiado!',
    view: 'Ver',
    ytGeneral: 'Resultados generales de YouTube para',
  },
  fr: {
    tagline: 'Recherche de chansons karaoké',
    products: 'Produits', pricing: 'Tarifs', roadmap: 'Feuille de route', updates: 'Mises à jour', support: 'Assistance', login: 'Connexion',
    menu: 'Menu',
    contact: 'Contact',
    joinCommunity: 'Rejoignez notre communauté sur Facebook',
    help: 'Aide',
    helpSub: 'Comment chercher',
    tos: "Conditions d'utilisation",
    tosSub: 'Informations légales',
    tosShort: 'CGU',
    explore: 'Découvrir Karatrack',
    aiStudioTitle: 'Karatrack Studio',
    aiStudioSub: 'Créez des pistes karaoké en ligne',
    lastUpdated: 'Dernière mise à jour',
    artistPlaceholder: 'Artiste (partiel OK)',
    titlePlaceholder: 'Titre (partiel OK)',
    search: 'Rechercher',
    legacyLabel: 'Chercher dans la base des disques classiques',
    slower: '(plus lent)',
    searching: 'Recherche…',
    shownOf: '{shown} affichés sur {total}',
    noResults: "Aucun résultat. Astuce : cherchez par Artiste et/ou Titre. Les mots partiels fonctionnent.",
    searchingTracks: 'Recherche de pistes...',
    progressInit: 'Initialisation de la recherche...',
    progressSources: 'Recherche sur Party Tyme, Karaoke Version et YouTube...',
    progressProcessing: 'Traitement des résultats...',
    progressLegacy: 'Consultation de la base des disques classiques...',
    artist: 'Artiste',
    title: 'Titre',
    brand: 'Marque',
    legacy: 'Classiques',
    buy: 'Acheter',
    viewBuy: 'Voir / Acheter',
    legacyDiscs: 'Disques classiques',
    noLegacyDiscs: 'Aucun disque classique trouvé.',
    close: 'Fermer',
    ytFor: 'Chaînes officielles YouTube pour',
    ytChecking: 'Vérification de YouTube…',
    ytNone: 'Aucune vidéo de chaîne officielle trouvée.',
    copy: 'Copier',
    copied: 'Copié !',
    view: 'Voir',
    ytGeneral: 'Résultats YouTube généraux pour',
  },
  de: {
    tagline: 'Karaoke-Song-Suche',
    products: 'Produkte', pricing: 'Preise', roadmap: 'Roadmap', updates: 'Updates', support: 'Support', login: 'Anmelden',
    menu: 'Menü',
    contact: 'Kontakt',
    joinCommunity: 'Werde Teil unserer Community auf Facebook',
    help: 'Hilfe',
    helpSub: 'So funktioniert die Suche',
    tos: 'Nutzungsbedingungen',
    tosSub: 'Rechtliche Hinweise',
    tosShort: 'AGB',
    explore: 'Karatrack entdecken',
    aiStudioTitle: 'Karatrack Studio',
    aiStudioSub: 'Karaoke-Tracks online erstellen',
    lastUpdated: 'Zuletzt aktualisiert',
    artistPlaceholder: 'Künstler (teilweise OK)',
    titlePlaceholder: 'Titel (teilweise OK)',
    search: 'Suchen',
    legacyLabel: 'Klassische Disc-Datenbank durchsuchen',
    slower: '(langsamer)',
    searching: 'Suche läuft…',
    shownOf: '{shown} von {total} angezeigt',
    noResults: 'Keine Ergebnisse. Tipp: Nach Künstler und/oder Titel suchen. Teilwörter funktionieren.',
    searchingTracks: 'Tracks werden gesucht...',
    progressInit: 'Suche wird gestartet...',
    progressSources: 'Suche bei Party Tyme, Karaoke Version und YouTube...',
    progressProcessing: 'Ergebnisse werden verarbeitet...',
    progressLegacy: 'Klassische Disc-Datenbank wird geprüft...',
    artist: 'Künstler',
    title: 'Titel',
    brand: 'Marke',
    legacy: 'Klassiker',
    buy: 'Kaufen',
    viewBuy: 'Ansehen / Kaufen',
    legacyDiscs: 'Klassische Discs',
    noLegacyDiscs: 'Keine klassischen Discs gefunden.',
    close: 'Schließen',
    ytFor: 'Offizielle YouTube-Kanäle für',
    ytChecking: 'YouTube wird geprüft…',
    ytNone: 'Keine Videos offizieller Kanäle gefunden.',
    copy: 'Kopieren',
    copied: 'Kopiert!',
    view: 'Ansehen',
    ytGeneral: 'Allgemeine YouTube-Ergebnisse für',
  },
  pt: {
    tagline: 'Busca de músicas de karaokê',
    products: 'Produtos', pricing: 'Preços', roadmap: 'Roteiro', updates: 'Atualizações', support: 'Suporte', login: 'Entrar',
    menu: 'Menu',
    contact: 'Contato',
    joinCommunity: 'Junte-se à nossa comunidade no Facebook',
    help: 'Ajuda',
    helpSub: 'Como pesquisar',
    tos: 'Termos de Serviço',
    tosSub: 'Informações legais',
    tosShort: 'Termos',
    explore: 'Explorar o Karatrack',
    aiStudioTitle: 'Karatrack Studio',
    aiStudioSub: 'Crie faixas de karaokê online',
    lastUpdated: 'Última atualização',
    artistPlaceholder: 'Artista (parcial OK)',
    titlePlaceholder: 'Título (parcial OK)',
    search: 'Pesquisar',
    legacyLabel: 'Pesquisar no banco de discos clássicos',
    slower: '(mais lento)',
    searching: 'Pesquisando…',
    shownOf: '{shown} exibidos de {total}',
    noResults: 'Sem resultados. Dica: pesquise por Artista e/ou Título. Palavras parciais funcionam.',
    searchingTracks: 'Procurando faixas...',
    progressInit: 'Iniciando a pesquisa...',
    progressSources: 'Pesquisando em Party Tyme, Karaoke Version e YouTube...',
    progressProcessing: 'Processando resultados...',
    progressLegacy: 'Consultando o banco de discos clássicos...',
    artist: 'Artista',
    title: 'Título',
    brand: 'Marca',
    legacy: 'Clássicos',
    buy: 'Comprar',
    viewBuy: 'Ver / Comprar',
    legacyDiscs: 'Discos clássicos',
    noLegacyDiscs: 'Nenhum disco clássico encontrado.',
    close: 'Fechar',
    ytFor: 'Canais oficiais do YouTube para',
    ytChecking: 'Verificando o YouTube…',
    ytNone: 'Nenhum vídeo de canal oficial encontrado.',
    copy: 'Copiar',
    copied: 'Copiado!',
    view: 'Ver',
    ytGeneral: 'Resultados gerais do YouTube para',
  },
  ar: {
    tagline: 'بحث أغاني الكاريوكي',
    products: 'المنتجات', pricing: 'الأسعار', roadmap: 'خارطة الطريق', updates: 'التحديثات', support: 'الدعم', login: 'تسجيل الدخول',
    menu: 'القائمة',
    contact: 'اتصل بنا',
    joinCommunity: 'انضم إلى مجتمعنا على فيسبوك',
    help: 'مساعدة',
    helpSub: 'كيفية البحث',
    tos: 'شروط الخدمة',
    tosSub: 'معلومات قانونية',
    tosShort: 'الشروط',
    explore: 'استكشف Karatrack',
    aiStudioTitle: 'Karatrack Studio',
    aiStudioSub: 'أنشئ مقاطع كاريوكي عبر الإنترنت',
    lastUpdated: 'آخر تحديث',
    artistPlaceholder: 'الفنان (جزئي مقبول)',
    titlePlaceholder: 'العنوان (جزئي مقبول)',
    search: 'بحث',
    legacyLabel: 'البحث في قاعدة الأقراص الكلاسيكية',
    slower: '(أبطأ)',
    searching: 'جارٍ البحث…',
    shownOf: 'يظهر {shown} من {total}',
    noResults: 'لا توجد نتائج. نصيحة: ابحث بالفنان و/أو العنوان. الكلمات الجزئية مقبولة.',
    searchingTracks: 'جارٍ البحث عن المقاطع...',
    progressInit: 'جارٍ بدء البحث...',
    progressSources: 'جارٍ البحث في Party Tyme وKaraoke Version وYouTube...',
    progressProcessing: 'جارٍ معالجة النتائج...',
    progressLegacy: 'جارٍ فحص قاعدة الأقراص الكلاسيكية...',
    artist: 'الفنان',
    title: 'العنوان',
    brand: 'العلامة',
    legacy: 'كلاسيكي',
    buy: 'شراء',
    viewBuy: 'عرض / شراء',
    legacyDiscs: 'أقراص كلاسيكية',
    noLegacyDiscs: 'لم يتم العثور على أقراص كلاسيكية.',
    close: 'إغلاق',
    ytFor: 'قنوات YouTube الرسمية لـ',
    ytChecking: 'جارٍ فحص YouTube…',
    ytNone: 'لم يتم العثور على فيديوهات من قنوات رسمية.',
    copy: 'نسخ',
    copied: 'تم النسخ!',
    view: 'عرض',
    ytGeneral: 'نتائج YouTube العامة لـ',
  },
  hi: {
    tagline: 'कराओके गीत खोज',
    products: 'उत्पाद', pricing: 'मूल्य', roadmap: 'रोडमैप', updates: 'अपडेट', support: 'सहायता', login: 'लॉगिन',
    menu: 'मेनू',
    contact: 'संपर्क करें',
    joinCommunity: 'फ़ेसबुक पर हमारी कम्युनिटी से जुड़ें',
    help: 'सहायता',
    helpSub: 'खोज कैसे करें',
    tos: 'सेवा की शर्तें',
    tosSub: 'कानूनी जानकारी',
    tosShort: 'शर्तें',
    explore: 'Karatrack देखें',
    aiStudioTitle: 'Karatrack Studio',
    aiStudioSub: 'ऑनलाइन कराओके ट्रैक बनाएँ',
    lastUpdated: 'अंतिम अपडेट',
    artistPlaceholder: 'कलाकार (आंशिक चलेगा)',
    titlePlaceholder: 'शीर्षक (आंशिक चलेगा)',
    search: 'खोजें',
    legacyLabel: 'क्लासिक डिस्क डेटाबेस में खोजें',
    slower: '(धीमा)',
    searching: 'खोज जारी…',
    shownOf: '{total} में से {shown} दिखाए गए',
    noResults: 'कोई परिणाम नहीं। सुझाव: कलाकार और/या शीर्षक से खोजें। आंशिक शब्द चलेंगे।',
    searchingTracks: 'ट्रैक खोजे जा रहे हैं...',
    progressInit: 'खोज शुरू हो रही है...',
    progressSources: 'Party Tyme, Karaoke Version और YouTube में खोज जारी...',
    progressProcessing: 'परिणाम संसाधित हो रहे हैं...',
    progressLegacy: 'क्लासिक डिस्क डेटाबेस जाँचा जा रहा है...',
    artist: 'कलाकार',
    title: 'शीर्षक',
    brand: 'ब्रांड',
    legacy: 'क्लासिक',
    buy: 'खरीदें',
    viewBuy: 'देखें / खरीदें',
    legacyDiscs: 'क्लासिक डिस्क',
    noLegacyDiscs: 'कोई क्लासिक डिस्क नहीं मिली।',
    close: 'बंद करें',
    ytFor: 'आधिकारिक YouTube चैनल:',
    ytChecking: 'YouTube जाँचा जा रहा है…',
    ytNone: 'आधिकारिक चैनल के वीडियो नहीं मिले।',
    copy: 'कॉपी करें',
    copied: 'कॉपी हो गया!',
    view: 'देखें',
    ytGeneral: 'सामान्य YouTube परिणाम:',
  },
  ja: {
    tagline: 'カラオケ楽曲検索',
    products: '製品', pricing: '料金', roadmap: 'ロードマップ', updates: '更新情報', support: 'サポート', login: 'ログイン',
    menu: 'メニュー',
    contact: 'お問い合わせ',
    joinCommunity: 'Facebookコミュニティに参加',
    help: 'ヘルプ',
    helpSub: '検索のコツ',
    tos: '利用規約',
    tosSub: '法的情報',
    tosShort: '規約',
    explore: 'Karatrack を見る',
    aiStudioTitle: 'Karatrack Studio',
    aiStudioSub: 'オンラインでカラオケ音源を作成',
    lastUpdated: '最終更新',
    artistPlaceholder: 'アーティスト（一部でも可）',
    titlePlaceholder: 'タイトル（一部でも可）',
    search: '検索',
    legacyLabel: 'クラシックディスクのデータベースも検索',
    slower: '（時間がかかります）',
    searching: '検索中…',
    shownOf: '{total} 件中 {shown} 件を表示',
    noResults: '結果がありません。ヒント：アーティストやタイトルで検索してください。部分一致でも検索できます。',
    searchingTracks: '楽曲を検索しています...',
    progressInit: '検索を開始しています...',
    progressSources: 'Party Tyme、Karaoke Version、YouTube を検索中...',
    progressProcessing: '検索結果を処理しています...',
    progressLegacy: 'クラシックディスクのデータベースを確認中...',
    artist: 'アーティスト',
    title: 'タイトル',
    brand: 'ブランド',
    legacy: 'クラシック',
    buy: '購入',
    viewBuy: '見る / 購入',
    legacyDiscs: 'クラシックディスク',
    noLegacyDiscs: 'クラシックディスクは見つかりませんでした。',
    close: '閉じる',
    ytFor: '公式 YouTube チャンネル：',
    ytChecking: 'YouTube を確認中…',
    ytNone: '公式チャンネルの動画は見つかりませんでした。',
    copy: 'コピー',
    copied: 'コピーしました！',
    view: '見る',
    ytGeneral: 'YouTube の一般検索結果：',
  },
  ko: {
    tagline: '노래방 곡 검색',
    products: '제품', pricing: '가격', roadmap: '로드맵', updates: '업데이트', support: '지원', login: '로그인',
    menu: '메뉴',
    contact: '문의하기',
    joinCommunity: 'Facebook 커뮤니티에 참여하세요',
    help: '도움말',
    helpSub: '검색 방법',
    tos: '서비스 약관',
    tosSub: '법적 정보',
    tosShort: '약관',
    explore: 'Karatrack 둘러보기',
    aiStudioTitle: 'Karatrack Studio',
    aiStudioSub: '온라인으로 노래방 트랙 제작',
    lastUpdated: '마지막 업데이트',
    artistPlaceholder: '아티스트 (일부만 입력 가능)',
    titlePlaceholder: '제목 (일부만 입력 가능)',
    search: '검색',
    legacyLabel: '클래식 디스크 데이터베이스 검색',
    slower: '(느림)',
    searching: '검색 중…',
    shownOf: '{total}개 중 {shown}개 표시',
    noResults: '결과가 없습니다. 팁: 아티스트 및/또는 제목으로 검색하세요. 일부 단어만 입력해도 됩니다.',
    searchingTracks: '트랙을 검색하는 중...',
    progressInit: '검색을 시작하는 중...',
    progressSources: 'Party Tyme, Karaoke Version, YouTube 검색 중...',
    progressProcessing: '검색 결과 처리 중...',
    progressLegacy: '클래식 디스크 데이터베이스 확인 중...',
    artist: '아티스트',
    title: '제목',
    brand: '브랜드',
    legacy: '클래식',
    buy: '구매',
    viewBuy: '보기 / 구매',
    legacyDiscs: '클래식 디스크',
    noLegacyDiscs: '클래식 디스크를 찾을 수 없습니다.',
    close: '닫기',
    ytFor: '공식 YouTube 채널:',
    ytChecking: 'YouTube 확인 중…',
    ytNone: '공식 채널 동영상을 찾을 수 없습니다.',
    copy: '복사',
    copied: '복사됨!',
    view: '보기',
    ytGeneral: '일반 YouTube 검색 결과:',
  },
  vi: {
    tagline: 'Tìm kiếm bài hát karaoke',
    products: 'Sản phẩm', pricing: 'Giá', roadmap: 'Lộ trình', updates: 'Cập nhật', support: 'Hỗ trợ', login: 'Đăng nhập',
    menu: 'Menu',
    contact: 'Liên hệ',
    joinCommunity: 'Tham gia cộng đồng của chúng tôi trên Facebook',
    help: 'Trợ giúp',
    helpSub: 'Cách tìm kiếm',
    tos: 'Điều khoản dịch vụ',
    tosSub: 'Thông tin pháp lý',
    tosShort: 'Điều khoản',
    explore: 'Khám phá Karatrack',
    aiStudioTitle: 'Karatrack Studio',
    aiStudioSub: 'Tạo bản karaoke trực tuyến',
    lastUpdated: 'Cập nhật lần cuối',
    artistPlaceholder: 'Nghệ sĩ (một phần cũng được)',
    titlePlaceholder: 'Tựa đề (một phần cũng được)',
    search: 'Tìm kiếm',
    legacyLabel: 'Tìm trong kho đĩa cổ điển',
    slower: '(chậm hơn)',
    searching: 'Đang tìm…',
    shownOf: 'Hiển thị {shown} trong {total}',
    noResults: 'Không có kết quả. Mẹo: tìm theo Nghệ sĩ và/hoặc Tựa đề. Từ khóa một phần vẫn được.',
    searchingTracks: 'Đang tìm bài hát...',
    progressInit: 'Đang khởi tạo tìm kiếm...',
    progressSources: 'Đang tìm trên Party Tyme, Karaoke Version và YouTube...',
    progressProcessing: 'Đang xử lý kết quả...',
    progressLegacy: 'Đang kiểm tra kho đĩa cổ điển...',
    artist: 'Nghệ sĩ',
    title: 'Tựa đề',
    brand: 'Thương hiệu',
    legacy: 'Cổ điển',
    buy: 'Mua',
    viewBuy: 'Xem / Mua',
    legacyDiscs: 'Đĩa cổ điển',
    noLegacyDiscs: 'Không tìm thấy đĩa cổ điển.',
    close: 'Đóng',
    ytFor: 'Kênh YouTube chính thức cho',
    ytChecking: 'Đang kiểm tra YouTube…',
    ytNone: 'Không tìm thấy video từ kênh chính thức.',
    copy: 'Sao chép',
    copied: 'Đã sao chép!',
    view: 'Xem',
    ytGeneral: 'Kết quả YouTube chung cho',
  },
  tl: {
    tagline: 'Paghahanap ng kantang karaoke',
    products: 'Mga Produkto', pricing: 'Presyo', roadmap: 'Roadmap', updates: 'Mga Update', support: 'Suporta', login: 'Mag-login',
    menu: 'Menu',
    contact: 'Makipag-ugnayan',
    joinCommunity: 'Sumali sa aming komunidad sa Facebook',
    help: 'Tulong',
    helpSub: 'Paano maghanap',
    tos: 'Mga Tuntunin ng Serbisyo',
    tosSub: 'Legal na impormasyon',
    tosShort: 'Tuntunin',
    explore: 'Tuklasin ang Karatrack',
    aiStudioTitle: 'Karatrack Studio',
    aiStudioSub: 'Gumawa ng karaoke tracks online',
    lastUpdated: 'Huling na-update',
    artistPlaceholder: 'Artist (puwede ang bahagi)',
    titlePlaceholder: 'Pamagat (puwede ang bahagi)',
    search: 'Hanapin',
    legacyLabel: 'Hanapin sa legacy disc database',
    slower: '(mas mabagal)',
    searching: 'Naghahanap…',
    shownOf: '{shown} ang ipinapakita sa {total}',
    noResults: 'Walang resulta. Tip: maghanap gamit ang Artist at/o Pamagat. Puwede ang bahagi ng salita.',
    searchingTracks: 'Naghahanap ng tracks...',
    progressInit: 'Sinisimulan ang paghahanap...',
    progressSources: 'Naghahanap sa Party Tyme, Karaoke Version, at YouTube...',
    progressProcessing: 'Pinoproseso ang mga resulta...',
    progressLegacy: 'Sinusuri ang legacy disc database...',
    artist: 'Artist',
    title: 'Pamagat',
    brand: 'Brand',
    legacy: 'Legacy',
    buy: 'Bilhin',
    viewBuy: 'Tingnan / Bilhin',
    legacyDiscs: 'Mga legacy disc',
    noLegacyDiscs: 'Walang nahanap na legacy disc.',
    close: 'Isara',
    ytFor: 'Mga opisyal na YouTube channel para sa',
    ytChecking: 'Sinusuri ang YouTube…',
    ytNone: 'Walang nahanap na video mula sa opisyal na channel.',
    copy: 'Kopyahin',
    copied: 'Nakopya!',
    view: 'Tingnan',
    ytGeneral: 'Pangkalahatang resulta ng YouTube para sa',
  },
  'zh-CN': {
    tagline: '卡拉OK歌曲搜索',
    products: '产品', pricing: '价格', roadmap: '路线图', updates: '更新', support: '支持', login: '登录',
    menu: '菜单',
    contact: '联系我们',
    joinCommunity: '加入我们的 Facebook 社区',
    help: '帮助',
    helpSub: '搜索技巧',
    tos: '服务条款',
    tosSub: '法律信息',
    tosShort: '条款',
    explore: '探索 Karatrack',
    aiStudioTitle: 'Karatrack Studio',
    aiStudioSub: '在线制作卡拉OK伴奏',
    lastUpdated: '最近更新',
    artistPlaceholder: '歌手（可输入部分）',
    titlePlaceholder: '歌名（可输入部分）',
    search: '搜索',
    legacyLabel: '同时搜索经典碟片数据库',
    slower: '（较慢）',
    searching: '搜索中…',
    shownOf: '共 {total} 条，显示 {shown} 条',
    noResults: '没有结果。提示：按歌手和/或歌名搜索，输入部分词语也可以。',
    searchingTracks: '正在搜索歌曲...',
    progressInit: '正在开始搜索...',
    progressSources: '正在搜索 Party Tyme、Karaoke Version 和 YouTube...',
    progressProcessing: '正在处理搜索结果...',
    progressLegacy: '正在查询经典碟片数据库...',
    artist: '歌手',
    title: '歌名',
    brand: '品牌',
    legacy: '经典',
    buy: '购买',
    viewBuy: '查看 / 购买',
    legacyDiscs: '经典碟片',
    noLegacyDiscs: '未找到经典碟片。',
    close: '关闭',
    ytFor: '官方 YouTube 频道：',
    ytChecking: '正在检查 YouTube…',
    ytNone: '未找到官方频道视频。',
    copy: '复制',
    copied: '已复制！',
    view: '查看',
    ytGeneral: 'YouTube 常规搜索结果：',
  },
  'zh-TW': {
    tagline: '卡拉OK歌曲搜尋',
    products: '產品', pricing: '價格', roadmap: '路線圖', updates: '更新', support: '支援', login: '登入',
    menu: '選單',
    contact: '聯絡我們',
    joinCommunity: '加入我們的 Facebook 社群',
    help: '說明',
    helpSub: '搜尋技巧',
    tos: '服務條款',
    tosSub: '法律資訊',
    tosShort: '條款',
    explore: '探索 Karatrack',
    aiStudioTitle: 'Karatrack Studio',
    aiStudioSub: '線上製作卡拉OK伴奏',
    lastUpdated: '最近更新',
    artistPlaceholder: '歌手（可輸入部分）',
    titlePlaceholder: '歌名（可輸入部分）',
    search: '搜尋',
    legacyLabel: '同時搜尋經典碟片資料庫',
    slower: '（較慢）',
    searching: '搜尋中…',
    shownOf: '共 {total} 筆，顯示 {shown} 筆',
    noResults: '沒有結果。提示：以歌手和/或歌名搜尋，輸入部分詞語也可以。',
    searchingTracks: '正在搜尋歌曲...',
    progressInit: '正在開始搜尋...',
    progressSources: '正在搜尋 Party Tyme、Karaoke Version 和 YouTube...',
    progressProcessing: '正在處理搜尋結果...',
    progressLegacy: '正在查詢經典碟片資料庫...',
    artist: '歌手',
    title: '歌名',
    brand: '品牌',
    legacy: '經典',
    buy: '購買',
    viewBuy: '查看 / 購買',
    legacyDiscs: '經典碟片',
    noLegacyDiscs: '未找到經典碟片。',
    close: '關閉',
    ytFor: '官方 YouTube 頻道：',
    ytChecking: '正在檢查 YouTube…',
    ytNone: '未找到官方頻道影片。',
    copy: '複製',
    copied: '已複製！',
    view: '查看',
    ytGeneral: 'YouTube 一般搜尋結果：',
  },
};

/* ---------------------------------------------------------------------------
   Provider + hooks
--------------------------------------------------------------------------- */
type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<Ctx>({
  locale: 'en',
  setLocale: () => {},
  t: (k) => MESSAGES.en[k] ?? k,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Start with 'en' for the server render, then correct on mount — this
  // avoids a hydration mismatch while still auto-detecting the language.
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    setLocaleState(readCookie() ?? detectLocale());
  }, []);

  // Keep <html lang> and text direction in sync (Arabic is right-to-left).
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  function setLocale(l: Locale) {
    // Shared with www.karatrack.com — the main site reads KT_LANG and follows.
    writeSharedPrefCookie(LANG_COOKIE, l);
    // Clear the old host-only cookie so it can't shadow the shared one.
    expireHostCookie(LEGACY_COOKIE);
    setLocaleState(l);
  }

  const t = (key: string, vars?: Record<string, string | number>) => {
    let s = MESSAGES[locale]?.[key] ?? MESSAGES.en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replaceAll(`{${k}}`, String(v));
      }
    }
    return s;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  return useContext(I18nContext);
}

/* ---------------------------------------------------------------------------
   Language switcher (header dropdown) — styled identically to the main
   karatrack.com LanguageSwitcher.
--------------------------------------------------------------------------- */
export function LanguageSwitcher() {
  const { locale, setLocale } = useT();
  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      aria-label="Language"
      className="rounded-full border border-slate-200 bg-white px-2 py-1 text-sm font-medium text-slate-600 transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}

/* ---------------------------------------------------------------------------
   Main-site navigation links — the same five links as karatrack.com's
   header, pointing back to the main site, with translated labels.
--------------------------------------------------------------------------- */
export const MAIN_SITE_LINKS = [
  { href: `${MAIN_SITE_URL}/products`, key: 'products' },
  { href: `${MAIN_SITE_URL}/pricing`, key: 'pricing' },
  { href: `${MAIN_SITE_URL}/roadmap`, key: 'roadmap' },
  { href: `${MAIN_SITE_URL}/updates`, key: 'updates' },
  { href: `${MAIN_SITE_URL}/support`, key: 'support' },
] as const;

export function NavLinks() {
  const { t } = useT();
  // Hidden until the main site launches (see lib/site-config.ts).
  if (!MAIN_SITE_LIVE) return null;
  return (
    <>
      {MAIN_SITE_LINKS.map((link) => (
        <a key={link.href} href={link.href} className="transition hover:text-cyan-500">
          {t(link.key)}
        </a>
      ))}
    </>
  );
}

/* Cyan Login pill, identical to the main site's, linking to its login page */
export function LoginPill() {
  const { t } = useT();
  // Hidden until the main site launches (see lib/site-config.ts).
  if (!MAIN_SITE_LIVE) return null;
  return (
    <a
      href={`${MAIN_SITE_URL}/login`}
      className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-400"
    >
      {t('login')}
    </a>
  );
}
