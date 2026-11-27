import type { Governorate } from '../types/prayer';

export const EGYPT_GOVERNORATES: Governorate[] = [
  { id: 'cairo', nameAr: 'القاهرة', regionAr: 'القاهرة الكبرى', latitude: 30.0444, longitude: 31.2357 },
  { id: 'giza', nameAr: 'الجيزة', regionAr: 'القاهرة الكبرى', latitude: 30.0131, longitude: 31.2089 },
  { id: 'alexandria', nameAr: 'الإسكندرية', regionAr: 'الساحل الشمالي', latitude: 31.2001, longitude: 29.9187 },
  { id: 'qalyubia', nameAr: 'القليوبية (بنها)', regionAr: 'الدلتا', latitude: 30.4660, longitude: 31.1848 },
  { id: 'dakahlia', nameAr: 'الدقهلية (المنصورة)', regionAr: 'الدلتا', latitude: 31.0409, longitude: 31.3785 },
  { id: 'sharqia', nameAr: 'الشرقية (الزقازيق)', regionAr: 'الدلتا', latitude: 30.5877, longitude: 31.5020 },
  { id: 'gharbia', nameAr: 'الغربية (طنطا)', regionAr: 'الدلتا', latitude: 30.7865, longitude: 31.0004 },
  { id: 'monufia', nameAr: 'المنوفية (شبين الكوم)', regionAr: 'الدلتا', latitude: 30.5526, longitude: 31.0090 },
  { id: 'beheira', nameAr: 'البحيرة (دمنهور)', regionAr: 'الدلتا', latitude: 31.0341, longitude: 30.4682 },
  { id: 'kafr-el-sheikh', nameAr: 'كفر الشيخ', regionAr: 'الدلتا', latitude: 31.1107, longitude: 30.9388 },
  { id: 'damietta', nameAr: 'دمياط', regionAr: 'الساحل الشمالي', latitude: 31.4175, longitude: 31.8144 },
  { id: 'port-said', nameAr: 'بورسعيد', regionAr: 'مدن القناة', latitude: 31.2653, longitude: 32.3019 },
  { id: 'ismailia', nameAr: 'الإسماعيلية', regionAr: 'مدن القناة', latitude: 30.5965, longitude: 32.2715 },
  { id: 'suez', nameAr: 'السويس', regionAr: 'مدن القناة', latitude: 29.9668, longitude: 32.5498 },
  { id: 'fayoum', nameAr: 'الفيوم', regionAr: 'شمال الصعيد', latitude: 29.3084, longitude: 30.8428 },
  { id: 'beni-suef', nameAr: 'بني سويف', regionAr: 'شمال الصعيد', latitude: 29.0661, longitude: 31.0994 },
  { id: 'minya', nameAr: 'المنيا', regionAr: 'شمال الصعيد', latitude: 28.1099, longitude: 30.7503 },
  { id: 'assiut', nameAr: 'أسيوط', regionAr: 'وسط الصعيد', latitude: 27.1783, longitude: 31.1859 },
  { id: 'sohag', nameAr: 'سوهاج', regionAr: 'جنوب الصعيد', latitude: 26.5590, longitude: 31.6957 },
  { id: 'qena', nameAr: 'قنا', regionAr: 'جنوب الصعيد', latitude: 26.1551, longitude: 32.7160 },
  { id: 'luxor', nameAr: 'الأقصر', regionAr: 'جنوب الصعيد', latitude: 25.6872, longitude: 32.6396 },
  { id: 'aswan', nameAr: 'أسوان', regionAr: 'جنوب الصعيد', latitude: 24.0889, longitude: 32.8998 },
  { id: 'red-sea', nameAr: 'البحر الأحمر (الغردقة)', regionAr: 'البحر الأحمر', latitude: 27.2579, longitude: 33.8116 },
  { id: 'south-sinai', nameAr: 'جنوب سيناء (شرم الشيخ)', regionAr: 'سيناء', latitude: 27.9158, longitude: 34.3300 },
  { id: 'north-sinai', nameAr: 'شمال سيناء (العريش)', regionAr: 'سيناء', latitude: 31.1321, longitude: 33.8033 },
  { id: 'matrouh', nameAr: 'مطروح (مرسى مطروح)', regionAr: 'الساحل الشمالي', latitude: 31.3543, longitude: 27.2373 },
  { id: 'new-valley', nameAr: 'الوادي الجديد (الخارجة)', regionAr: 'الصحراء الغربية', latitude: 25.4514, longitude: 30.5463 },
];

export function getGovernorateById(id: string): Governorate {
  return EGYPT_GOVERNORATES.find((g) => g.id === id) ?? EGYPT_GOVERNORATES[0];
}
