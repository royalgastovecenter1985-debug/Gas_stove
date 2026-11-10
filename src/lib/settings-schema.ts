/**
 * Every editable website setting, with its admin label, group and default value.
 * Settings live in the `settings` table (key/value). Keys missing from the table
 * fall back to the defaults below, and Admin → Settings creates them on first save,
 * so no database migration is needed when a setting is added here.
 */
export type SettingType = 'text' | 'textarea' | 'email' | 'url' | 'tel' | 'number' | 'time';

export interface SettingDef {
  key: string;
  label: string;
  group: 'general' | 'contact' | 'social' | 'stats';
  type: SettingType;
  default: string;
  help?: string;
}

export const SETTING_GROUPS: Record<SettingDef['group'], string> = {
  general: 'Business',
  contact: 'Contact details & opening hours',
  social: 'Social & Google listing',
  stats: 'Home page counters',
};

export const SETTINGS: SettingDef[] = [
  { key: 'site_name', label: 'Business name', group: 'general', type: 'text', default: 'Royal Gas Stove Center' },
  { key: 'tagline', label: 'Tagline', group: 'general', type: 'textarea', default: 'Commercial kitchen equipment — wholesale, supply, distribution and service' },
  { key: 'client_list', label: 'Who we serve', group: 'general', type: 'textarea', help: 'Separate with |', default: 'Restaurants|Hotels|Caterers|Sweet & farsan shops|Cloud kitchens|Canteens|Dhabas|Food trucks|Banquet halls|Hostels & mess' },
  { key: 'notify_email', label: 'Send inquiry e-mails to', group: 'general', type: 'email', help: 'Needs SMTP settings on the server. Leave empty to skip e-mails.', default: '' },

  { key: 'phone_1', label: 'Phone 1 (main)', group: 'contact', type: 'tel', default: '+91-9099779945' },
  { key: 'phone_2', label: 'Phone 2', group: 'contact', type: 'tel', default: '+91-9998327943' },
  { key: 'phone_3', label: 'Phone 3', group: 'contact', type: 'tel', help: 'Leave empty to hide', default: '' },
  { key: 'whatsapp', label: 'WhatsApp number', group: 'contact', type: 'tel', help: 'With country code, e.g. 919998327943. Inquiries are sent here.', default: '919998327943' },
  { key: 'email', label: 'Public e-mail', group: 'contact', type: 'email', help: 'Leave empty to hide', default: 'royalgas1221@gmail.com' },
  { key: 'address', label: 'Showroom address', group: 'contact', type: 'textarea', default: "Nr. Shekha Munjals Pole, Opp. Bhoiwada's Pole, Kalupur Tower Road, Ahmedabad, Gujarat 380001, India" },
  { key: 'business_hours', label: 'Opening hours (text shown on site)', group: 'contact', type: 'text', default: 'Mon – Sat: 9:30 AM – 8:30 PM' },
  { key: 'open_time', label: 'Opens at', group: 'contact', type: 'time', help: 'Used for the “Open now” badge (Mon–Sat)', default: '09:30' },
  { key: 'close_time', label: 'Closes at', group: 'contact', type: 'time', default: '20:30' },
  { key: 'map_lat', label: 'Map latitude', group: 'contact', type: 'text', default: '23.029016' },
  { key: 'map_lng', label: 'Map longitude', group: 'contact', type: 'text', default: '72.592350' },

  { key: 'instagram_url', label: 'Instagram URL', group: 'social', type: 'url', default: 'https://www.instagram.com/royal_gas_stove_center/' },
  { key: 'instagram_handle', label: 'Instagram handle (without @)', group: 'social', type: 'text', default: 'royal_gas_stove_center' },
  { key: 'facebook_url', label: 'Facebook URL', group: 'social', type: 'url', default: 'https://www.facebook.com/share/16Hvx83j11/' },
  { key: 'google_url', label: 'Google Business / reviews URL', group: 'social', type: 'url', default: '' },
  { key: 'google_rating', label: 'Google rating, e.g. 4.8', group: 'social', type: 'text', help: 'Leave empty to hide', default: '' },
  { key: 'google_review_count', label: 'Number of Google reviews', group: 'social', type: 'number', help: 'Leave empty to hide', default: '' },

  { key: 'stat_years', label: 'Years in business', group: 'stats', type: 'number', help: 'Leave empty to hide', default: '' },
  { key: 'stat_clients', label: 'Kitchens supplied / clients', group: 'stats', type: 'number', help: 'Leave empty to hide', default: '' },
];

/** File-type settings, managed by upload fields in Admin → Settings. */
export const FILE_SETTINGS = {
  logo: 'assets/img/logo.png',
  favicon: 'assets/img/favicon.png',
  brochure_file: 'assets/pdf/Booklate-1.pdf',
} as const;

export const ABOUT_KEY = 'about_content';

export const ABOUT_ICONS = ['shield', 'ruler', 'tag', 'support', 'truck', 'chat', 'award', 'fire', 'tool', 'heart', 'check', 'store'] as const;

export interface AboutContent {
  pageTitle: string;
  pageIntro: string;
  heading: string;
  body: string;
  photoMain: string;
  photoMainCaption: string;
  photoSide1: string;
  photoSide2: string;
  valuesTitle: string;
  values: { icon: string; title: string; text: string }[];
  servicesTitle: string;
  services: string[];
  workshopTitle: string;
  workshopIntro: string;
  boardImage: string;
  showroomLandline: string;
  workshopName: string;
  workshopRole: string;
  workshopAddress: string;
  workshopPhones: string;
  ctaTitle: string;
}

export const ABOUT_DEFAULT: AboutContent = {
  pageTitle: 'About Royal Gas Stove Center',
  pageIntro: 'Wholesale trader, supplier, distributor and service provider of commercial kitchen equipment — Kalupur Tower Road, Ahmedabad.',
  heading: 'Equipment that keeps kitchens running',
  body: [
    'Royal Gas Stove Center works from Kalupur Tower Road, in the heart of Ahmedabad’s old-city trading district. We supply commercial kitchen equipment wholesale, fabricate to order, and service what we sell — including stove repairs and steel fabrication jobs.',
    'Our customers feed the city — restaurants and hotels, caterers, sweet and farsan shops, canteens, dhabas, food trucks and cloud kitchens. What they share is equipment that runs hard every day, so that is what we build: cooking ranges and dom stoves, puffer and dhosa bhattis, stainless-steel tables, sinks and trolleys, Ben Marie counters, ovens, grillers and shawarma machines.',
    'Our equipment carries the **SOLID™** name — a trade mark registered with the Trade Marks Registry, Government of India, in 2012 for kitchen and commercial cooking equipment.',
  ].join('\n\n'),
  photoMain: 'assets/img/brand/shopfront.jpg',
  photoMainCaption: 'Our showroom, Kalupur Tower Road',
  photoSide1: 'assets/img/brand/showroom-range.jpg',
  photoSide2: 'assets/img/brand/street-display.jpg',
  valuesTitle: 'What we stand for',
  values: [
    { icon: 'shield', title: 'Built to last', text: 'Heavy-gauge steel, cast burners and solid welding — equipment that handles years of daily service.' },
    { icon: 'ruler', title: 'Made to measure', text: 'We fabricate to your vessel sizes, burner count and kitchen layout instead of forcing a standard fit.' },
    { icon: 'tag', title: 'Honest pricing', text: 'Wholesale rates and clear, itemised quotations — no surprise add-ons after the order.' },
    { icon: 'support', title: 'Service after sale', text: 'Spares, burner servicing and repairs from the same team that supplied your equipment.' },
    { icon: 'truck', title: 'Delivered & installed', text: 'Ready stock on popular models, planned dispatch for custom orders across Gujarat.' },
    { icon: 'chat', title: 'Straight answers', text: 'Call or WhatsApp and speak to people who know the products.' },
  ],
  servicesTitle: 'What we do',
  services: [
    'Wholesale supply to dealers, contractors and multi-outlet chains',
    'Single-piece and bulk orders for restaurants and caterers',
    'Custom fabrication to your sizes and layout',
    'Complete commercial kitchen planning and setup',
    'Burner servicing, spare parts and repairs',
  ],
  workshopTitle: 'Showroom & workshop',
  workshopIntro: 'Our fabrication arm, **SOLID Enterprise**, makes stoves and steel equipment to order.',
  boardImage: 'assets/img/brand/business-board.jpg',
  showroomLandline: '079-22162232',
  workshopName: 'SOLID Enterprise',
  workshopRole: 'Fabrication & manufacturing',
  workshopAddress: '8, Rajnagar Estate, Nr. Ajit Mill, Rakhial, Ahmedabad',
  workshopPhones: '079-22910110, +91 98254 32474',
  ctaTitle: 'Visit our Kalupur showroom',
};
