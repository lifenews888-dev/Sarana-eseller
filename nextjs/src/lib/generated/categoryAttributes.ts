/** AUTO-GENERATED from data/eseller_angilal_master.xlsx — do not edit by hand. */
/** Run: python scripts/generate-categories-from-master.py */

import type { ListingMetadataField } from '../listingMetadata';

export const GENERATED_CATEGORY_ATTRIBUTES: Record<string, ListingMetadataField[]> = {
  "jobs": [
    { key: "sector", label: "Салбар", type: "text", required: true },
    { key: "salaryRange", label: "Цалин (муж)", type: "number", required: true, hint: "Доод ≤ дээд; 0 бол «Тохиролцоно» гэж харуулна" },
    { key: "jobType", label: "Ажлын цаг", type: "select", required: true, options: ["Бүтэн", "Цагийн", "Ээлжийн", "Зайнаас"] },
    { key: "experience", label: "Шаардлагатай туршлага", type: "select", required: true, options: ["Шаардлагагүй", "1–3 жил", "3+ жил"] },
    { key: "education", label: "Боловсрол", type: "select", options: ["Бүрэн дунд", "Бакалавр", "Магистр+"] },
    { key: "employerName", label: "Компанийн нэр", type: "text", required: true, hint: "Байгууллагын профайлтай холбох" }
  ],
  "women": [
    { key: "size", label: "Хэмжээ", type: "select", required: true, options: ["XS", "S", "M", "L", "XL", "XXL эсвэл тоон хэмжээ"], hint: "Ангиллаас хамаарсан хэмжээний жагсаалт" },
    { key: "color", label: "Өнгө", type: "text", required: true, hint: "Чөлөөт текст биш, жагсаалтаас" },
    { key: "brand", label: "Брэнд", type: "text", hint: "Шинэ брэндийг админ баталгаажуулж жагсаалтад нэмнэ" },
    { key: "material", label: "Материал", type: "select", options: ["Хөвөн", "ноос", "арьс", "синтетик"] },
    { key: "season", label: "Улирал", type: "select", options: ["Зун", "Өвөл", "Дөрвөн улирал"] }
  ],
  "men": [
    { key: "size", label: "Хэмжээ", type: "select", required: true, options: ["XS", "S", "M", "L", "XL", "XXL эсвэл тоон хэмжээ"], hint: "Ангиллаас хамаарсан хэмжээний жагсаалт" },
    { key: "color", label: "Өнгө", type: "text", required: true, hint: "Чөлөөт текст биш, жагсаалтаас" },
    { key: "brand", label: "Брэнд", type: "text", hint: "Шинэ брэндийг админ баталгаажуулж жагсаалтад нэмнэ" },
    { key: "material", label: "Материал", type: "select", options: ["Хөвөн", "ноос", "арьс", "синтетик"] },
    { key: "season", label: "Улирал", type: "select", options: ["Зун", "Өвөл", "Дөрвөн улирал"] }
  ],
  "beauty-health": [
    { key: "brand", label: "Брэнд", type: "text", required: true },
    { key: "sizeVolume", label: "Хэмжээ, багтаамж", type: "text", options: ["мл", "гр"] },
    { key: "expiryDate", label: "Хугацаа дуусах огноо", type: "text", required: true, hint: "Өнгөрсөн огноо хориглоно; 30 хоног дотор бол анхааруулга" },
    { key: "originCountry", label: "Гарал улс", type: "text" },
    { key: "skinType", label: "Арьсны төрөл", type: "select", options: ["Хуурай", "Тослог", "Холимог", "Мэдрэмтгий"] }
  ],
  "home-decor": [
    { key: "dimensionsCm", label: "Хэмжээ (см)", type: "text" },
    { key: "material", label: "Материал", type: "text" },
    { key: "color", label: "Өнгө", type: "text" }
  ],
  "real-estate": [
    { key: "field", label: "Талбай (м²)", type: "number", required: true, hint: ">0; орон сууцанд 10–1000 мужид" },
    { key: "field2", label: "Өрөөний тоо", type: "select", required: true, options: ["1", "2", "3", "4", "5+"], hint: "Орон сууц, байшинд заавал" },
    { key: "field3", label: "Байршил (дүүрэг, хороо)", type: "text", required: true, hint: "Газрын зурган дээр цэг тавих сонголт" },
    { key: "field4", label: "Давхар / Нийт давхар", type: "text", options: ["5", "16"] },
    { key: "field5", label: "Ашиглалтад орсон он", type: "number", hint: "4 оронтой он" },
    { key: "field6", label: "Хаалганы тоо, цонх", type: "text" },
    { key: "field7", label: "Төлбөрийн нөхцөл", type: "select", options: ["Бэлэн", "Лизинг", "Барьцаа+түрээс"] }
  ],
  "new-buildings": [
    { key: "field", label: "Төслийн нэр", type: "text", required: true, hint: "Төслийн профайлтай холбох" },
    { key: "field2", label: "Ашиглалтад орох он, улирал", type: "text", required: true },
    { key: "field3", label: "м²-ийн үнэ", type: "number", required: true, hint: ">0" },
    { key: "field4", label: "Лизингийн нөхцөл", type: "text" },
    { key: "field5", label: "Барилгын компани", type: "text", required: true }
  ],
  "vehicles": [
    { key: "brand", label: "Үйлдвэрлэгч", type: "select", required: true, options: ["Toyota", "Lexus", "Hyundai", "Nissan..."], hint: "Чөлөөт текст хориглоно" },
    { key: "model", label: "Загвар", type: "text", required: true, hint: "Cascade dropdown (үйлдвэр→загвар)" },
    { key: "year", label: "Үйлдвэрлэсэн он", type: "number", required: true, hint: "4 оронтой; орж ирсэн оноос ≤" },
    { key: "importYear", label: "Орж ирсэн он", type: "number", required: true },
    { key: "mileage", label: "Гүйлт (км)", type: "number", required: true, hint: "0–1,000,000; хэт бага бол анхааруулга" },
    { key: "engine", label: "Хөдөлгүүр (л)", type: "select", required: true, options: ["1.0", "1.5", "2.0", "Цахилгаан"] },
    { key: "fuelType", label: "Түлш", type: "select", required: true, options: ["Бензин", "Дизель", "Хайбрид", "Цахилгаан", "Газ"] },
    { key: "transmission", label: "Хурдны хайрцаг", type: "select", required: true, options: ["Автомат", "Механик"] },
    { key: "drivetrain", label: "Хөтлөгч", type: "select", options: ["Урдаа", "Хойноо", "4WD"] },
    { key: "color", label: "Өнгө", type: "text" },
    { key: "hasPlate", label: "Улсын дугаартай эсэх", type: "boolean", required: true, hint: "Арлын дугаараар давхардал шалгах" },
    { key: "leasing", label: "Лизингтэй эсэх", type: "boolean" }
  ],
  "jewelry": [
    { key: "material", label: "Материал", type: "select", required: true, options: ["Алт 585", "Алт 750", "Мөнгө 925", "Ган", "Бусад"] },
    { key: "field", label: "Жин (гр)", type: "number", hint: ">0" },
    { key: "field2", label: "Чулууны төрөл", type: "select", options: ["Алмаз", "Оюу", "Сувд"] },
    { key: "field3", label: "Гэрчилгээтэй эсэх", type: "boolean", hint: "Гэрчилгээний зураг хавсаргах" }
  ],
  "kids": [
    { key: "field", label: "Нас", type: "select", required: true, options: ["0–1", "1–3", "3–7", "8–14"] },
    { key: "field2", label: "Хүйс", type: "select", options: ["Охин", "Хүү"] },
    { key: "size", label: "Хэмжээ", type: "text" },
    { key: "brand", label: "Брэнд", type: "text" },
    { key: "field3", label: "Аюулгүйн гэрчилгээ", type: "boolean", hint: "Авто суудал, тоглоомонд санал болгоно" }
  ],
  "adult": [
    { key: "field", label: "Насны баталгаажуулалт", type: "boolean", required: true, hint: "Худалдан авагч 18+ баталгаажуулсан байх; зураг blur" },
    { key: "brand", label: "Брэнд", type: "text" }
  ],
  "health": [
    { key: "expiryDate", label: "Хугацаа дуусах огноо", type: "text", required: true, hint: "Өнгөрсөн огноо хориглоно" },
    { key: "originCountry", label: "Гарал улс", type: "text", required: true },
    { key: "field", label: "Бүртгэлийн дугаар", type: "text", options: ["ЭМЯ", "ХХААХҮЯ бүртгэл"], hint: "Витамин, эмнэлгийн хэрэгсэлд шаардана" },
    { key: "field2", label: "Тун, хэмжээ", type: "text", options: ["мг", "ширхэг"] }
  ],
  "phones": [
    { key: "brand", label: "Брэнд", type: "select", required: true, options: ["Apple", "Samsung", "Xiaomi"] },
    { key: "model", label: "Загвар", type: "text", required: true, hint: "Cascade dropdown" },
    { key: "gb", label: "Багтаамж (GB)", type: "select", required: true, options: ["64", "128", "256", "512", "1TB"], hint: "Утас, таблетад заавал" },
    { key: "color", label: "Өнгө", type: "text" },
    { key: "field", label: "Шинэ/хуучин", type: "select", required: true, options: ["Шинэ", "Хэрэглэсэн", "Засварласан"] },
    { key: "field2", label: "Батарейн байдал (%)", type: "number", hint: "Хуучин iPhone-д санал болгоно" },
    { key: "field3", label: "Баталгаат хугацаа", type: "text" }
  ],
  "technology": [
    { key: "brand", label: "Брэнд", type: "text", required: true },
    { key: "model", label: "Загвар", type: "text", required: true },
    { key: "cpu", label: "Процессор (CPU)", type: "select", options: ["i3", "i5", "i7", "i9", "M-цуврал", "Ryzen"], hint: "Компьютерт заавал" },
    { key: "ramGb", label: "RAM (GB)", type: "select", options: ["4", "8", "16", "32", "64"], hint: "Компьютерт заавал" },
    { key: "field", label: "Хадгалах төхөөрөмж", type: "select", options: ["SSD 256", "512", "1TB", "HDD"] },
    { key: "field2", label: "Дэлгэцийн хэмжээ (инч)", type: "text" },
    { key: "field3", label: "Шинэ/хуучин", type: "select", required: true, options: ["Шинэ", "Хэрэглэсэн", "Засварласан"] },
    { key: "field4", label: "Баталгаат хугацаа", type: "text" }
  ],
  "gifts": [
    { key: "field", label: "Хэнд зориулсан", type: "select", options: ["Эмэгтэй", "Эрэгтэй", "Хүүхэд", "Хос"] },
    { key: "field2", label: "Баяр, тохиолдол", type: "select", options: ["Төрсөн өдөр", "Хурим", "Шинэ жил"] }
  ],
  "furniture": [
    { key: "field", label: "Хэмжээ (Ө×У×Ө см)", type: "text", required: true, hint: "3 хэмжээс" },
    { key: "material", label: "Материал", type: "select", options: ["Мод", "MDF", "Металл", "Даавуу", "Арьс"] },
    { key: "color", label: "Өнгө", type: "text" },
    { key: "field2", label: "Угсардаг эсэх", type: "boolean" },
    { key: "field3", label: "Шинэ/хуучин", type: "text", required: true }
  ],
  "appliances": [
    { key: "brand", label: "Брэнд", type: "select", required: true, options: ["LG", "Samsung", "Haier"] },
    { key: "model", label: "Загвар", type: "text" },
    { key: "storage", label: "Багтаамж", type: "text", options: ["л", "кг", "инч"], hint: "Хөргөгчид литр, угаалгынд кг, ТВ-д инч" },
    { key: "field", label: "Эрчим хүчний зэрэглэл", type: "text" },
    { key: "field2", label: "Шинэ/хуучин", type: "text", required: true },
    { key: "field3", label: "Баталгаат хугацаа", type: "text" }
  ],
  "auto-parts": [
    { key: "field", label: "Тохирох үйлдвэрлэгч", type: "text", required: true, hint: "Fitment — худал мэдээллийн гол эх үүсвэр тул заавал" },
    { key: "field2", label: "Тохирох загвар, он", type: "text", required: true },
    { key: "oem", label: "OEM/парт код", type: "text", hint: "Кодоор хайх боломж" },
    { key: "field3", label: "Шинэ/хуучин", type: "select", required: true, options: ["Шинэ", "Хуучин (оригинал)", "Хуучин"] }
  ],
  "books": [
    { key: "field", label: "Зохиолч", type: "text" },
    { key: "field2", label: "Хэл", type: "select", required: true, options: ["Монгол", "Англи", "Орос"] },
    { key: "field3", label: "Хэвлэгдсэн он", type: "number" },
    { key: "field4", label: "Шинэ/хуучин", type: "text", required: true }
  ],
  "construction": [
    { key: "field", label: "Нэгж", type: "select", required: true, options: ["ш", "м²", "м", "кг", "литр", "багц"], hint: "Үнэ нэгжтэй уялдана" },
    { key: "field2", label: "Тоо хэмжээ (нөөц)", type: "number" },
    { key: "field3", label: "Стандарт, сертификат", type: "text" },
    { key: "field4", label: "Үйлдвэрлэсэн улс", type: "text" }
  ],
  "travel": [
    { key: "field", label: "Хүний тоо (майхан г.м.)", type: "select", options: ["1", "2", "3", "4+"] },
    { key: "season", label: "Улирал", type: "select", options: ["Зун", "Дөрвөн улирал", "Өвөл"] },
    { key: "field2", label: "Шинэ/хуучин", type: "text", required: true }
  ],
  "sports": [
    { key: "field", label: "Төрөл (спортын)", type: "text", required: true },
    { key: "size", label: "Хэмжээ", type: "text" },
    { key: "brand", label: "Брэнд", type: "text" },
    { key: "field2", label: "Шинэ/хуучин", type: "text", required: true }
  ],
  "food": [
    { key: "expiryDate", label: "Хугацаа дуусах огноо", type: "text", required: true, hint: "Өнгөрсөн огноо хориглоно; ≤7 хоног бол анхааруулга" },
    { key: "field", label: "Жин, багтаамж", type: "text", required: true, options: ["кг", "л", "ш"] },
    { key: "field2", label: "Хадгалах нөхцөл", type: "select", options: ["Хөргөлттэй", "Хөлдөөсөн", "Энгийн"] },
    { key: "field3", label: "Гарал үүсэл", type: "text" },
    { key: "field4", label: "Сертификат", type: "text" }
  ],
  "esports": [
    { key: "field", label: "Платформ", type: "select", required: true, options: ["PC", "PS5", "PS4", "Xbox", "Nintendo"] },
    { key: "brand", label: "Брэнд", type: "text" },
    { key: "field2", label: "Шинэ/хуучин", type: "text", required: true }
  ],
  "pets-plants": [
    { key: "field", label: "Төрөл, үүлдэр", type: "text", required: true },
    { key: "field2", label: "Нас", type: "text", options: ["сар", "жил"], hint: "Амьтанд" },
    { key: "field3", label: "Вакцинтай эсэх", type: "boolean", hint: "Нохой, мууранд санал болгоно" },
    { key: "field4", label: "Хүйс", type: "select", options: ["Эр", "Эм"] }
  ],
  "digital": [
    { key: "field", label: "Хүчинтэй хугацаа", type: "text", required: true, options: ["1 сар", "1 жил", "Насан турш"] },
    { key: "field2", label: "Дамжуулах арга", type: "select", required: true, options: ["И-мэйл", "Данс шилжүүлэх", "Код"] },
    { key: "field3", label: "Албан ёсны эсэх", type: "boolean", hint: "Лицензийн нотолгоо шаардана" }
  ],
  "education-training": [
    { key: "field", label: "Хэлбэр", type: "select", required: true, options: ["Танхим", "Онлайн", "Холимог"] },
    { key: "field2", label: "Хугацаа", type: "text", required: true, options: ["7 хоног", "1 сар", "3 сар"] },
    { key: "field3", label: "Түвшин", type: "select", options: ["Анхан", "Дунд", "Ахисан"] },
    { key: "field4", label: "Гэрчилгээ олгох эсэх", type: "boolean" },
    { key: "schedule", label: "Хуваарь", type: "text" }
  ],
  "beauty-services": [
    { key: "field", label: "Үнэ тооцох арга", type: "select", required: true, options: ["Цагаар", "Ажлаар", "Гэрээгээр"] },
    { key: "field2", label: "Туршлага (жил)", type: "number", hint: "Бүхэл тоо" },
    { key: "field3", label: "Очиж үйлчлэх эсэх", type: "boolean", required: true },
    { key: "field4", label: "Ажлын хуваарь", type: "text" },
    { key: "field5", label: "Портфолио зураг", type: "text", hint: "Үйлчилгээний зарын чанарын оноонд тооцно" }
  ],
  "tech-it-services": [
    { key: "field", label: "Үнэ тооцох арга", type: "select", required: true, options: ["Цагаар", "Ажлаар", "Гэрээгээр"] },
    { key: "field2", label: "Туршлага (жил)", type: "number", hint: "Бүхэл тоо" },
    { key: "field3", label: "Очиж үйлчлэх эсэх", type: "boolean", required: true },
    { key: "field4", label: "Ажлын хуваарь", type: "text" },
    { key: "field5", label: "Портфолио зураг", type: "text", hint: "Үйлчилгээний зарын чанарын оноонд тооцно" }
  ],
  "professional-consulting": [
    { key: "field", label: "Үнэ тооцох арга", type: "select", required: true, options: ["Цагаар", "Ажлаар", "Гэрээгээр"] },
    { key: "field2", label: "Туршлага (жил)", type: "number", hint: "Бүхэл тоо" },
    { key: "field3", label: "Очиж үйлчлэх эсэх", type: "boolean", required: true },
    { key: "field4", label: "Ажлын хуваарь", type: "text" },
    { key: "field5", label: "Портфолио зураг", type: "text", hint: "Үйлчилгээний зарын чанарын оноонд тооцно" }
  ],
  "auto-services": [
    { key: "field", label: "Үнэ тооцох арга", type: "select", required: true, options: ["Цагаар", "Ажлаар", "Гэрээгээр"] },
    { key: "field2", label: "Туршлага (жил)", type: "number", hint: "Бүхэл тоо" },
    { key: "field3", label: "Очиж үйлчлэх эсэх", type: "boolean", required: true },
    { key: "field4", label: "Ажлын хуваарь", type: "text" },
    { key: "field5", label: "Портфолио зураг", type: "text", hint: "Үйлчилгээний зарын чанарын оноонд тооцно" }
  ],
  "repair-services": [
    { key: "field", label: "Үнэ тооцох арга", type: "select", required: true, options: ["Цагаар", "Ажлаар", "Гэрээгээр"] },
    { key: "field2", label: "Туршлага (жил)", type: "number", hint: "Бүхэл тоо" },
    { key: "field3", label: "Очиж үйлчлэх эсэх", type: "boolean", required: true },
    { key: "field4", label: "Ажлын хуваарь", type: "text" },
    { key: "field5", label: "Портфолио зураг", type: "text", hint: "Үйлчилгээний зарын чанарын оноонд тооцно" }
  ],
  "printing-services": [
    { key: "field", label: "Үнэ тооцох арга", type: "select", required: true, options: ["Цагаар", "Ажлаар", "Гэрээгээр"] },
    { key: "field2", label: "Туршлага (жил)", type: "number", hint: "Бүхэл тоо" },
    { key: "field3", label: "Очиж үйлчлэх эсэх", type: "boolean", required: true },
    { key: "field4", label: "Ажлын хуваарь", type: "text" },
    { key: "field5", label: "Портфолио зураг", type: "text", hint: "Үйлчилгээний зарын чанарын оноонд тооцно" }
  ],
  "manufacturing-custom": [
    { key: "field", label: "Үнэ тооцох арга", type: "select", required: true, options: ["Цагаар", "Ажлаар", "Гэрээгээр"] },
    { key: "field2", label: "Туршлага (жил)", type: "number", hint: "Бүхэл тоо" },
    { key: "field3", label: "Очиж үйлчлэх эсэх", type: "boolean", required: true },
    { key: "field4", label: "Ажлын хуваарь", type: "text" },
    { key: "field5", label: "Портфолио зураг", type: "text", hint: "Үйлчилгээний зарын чанарын оноонд тооцно" }
  ],
  "photo-video": [
    { key: "field", label: "Үнэ тооцох арга", type: "select", required: true, options: ["Цагаар", "Ажлаар", "Гэрээгээр"] },
    { key: "field2", label: "Туршлага (жил)", type: "number", hint: "Бүхэл тоо" },
    { key: "field3", label: "Очиж үйлчлэх эсэх", type: "boolean", required: true },
    { key: "field4", label: "Ажлын хуваарь", type: "text" },
    { key: "field5", label: "Портфолио зураг", type: "text", hint: "Үйлчилгээний зарын чанарын оноонд тооцно" }
  ],
  "design-creative": [
    { key: "field", label: "Үнэ тооцох арга", type: "select", required: true, options: ["Цагаар", "Ажлаар", "Гэрээгээр"] },
    { key: "field2", label: "Туршлага (жил)", type: "number", hint: "Бүхэл тоо" },
    { key: "field3", label: "Очиж үйлчлэх эсэх", type: "boolean", required: true },
    { key: "field4", label: "Ажлын хуваарь", type: "text" },
    { key: "field5", label: "Портфолио зураг", type: "text", hint: "Үйлчилгээний зарын чанарын оноонд тооцно" }
  ],
};

export function generatedFieldsForCategoryKey(key: string): ListingMetadataField[] {
  return GENERATED_CATEGORY_ATTRIBUTES[key] || [];
}

