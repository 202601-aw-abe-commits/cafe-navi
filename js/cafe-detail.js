document.addEventListener("DOMContentLoaded", () => {
  const cafeData = {
    "cafe-1": { name: "スターバックス渋谷ツタヤ店", rating: "4.5 (328)", area: "渋谷 ・ 0.5km", desc: "渋谷の中心にある人気店。広めの席と安定したWi-Fiで、課題やPC作業に使いやすい店舗です。", tags: ["Wi-Fi", "電源", "長時間OK"], price: "価格帯: ¥¥¥", hours: "7:00 - 23:00", lat: 35.6595, lng: 139.7005 },
    "cafe-2": { name: "ブルーボトルコーヒー六本木", rating: "4.7 (215)", area: "六本木 ・ 1.2km", desc: "落ち着いた雰囲気で集中しやすく、短時間の学習から長めの作業まで使える環境です。", tags: ["Wi-Fi", "電源", "静か", "長時間OK"], price: "価格帯: ¥¥¥¥", hours: "8:00 - 20:00", lat: 35.6627, lng: 139.7311 },
    "cafe-3": { name: "カフェ・ルミエール池袋", rating: "4.3 (198)", area: "池袋 ・ 0.9km", desc: "席間が広く、コンセント席も多め。集中して作業しやすいカフェです。", tags: ["Wi-Fi", "電源", "長時間OK"], price: "価格帯: ¥¥", hours: "9:00 - 22:00", lat: 35.7295, lng: 139.7109 },
    "cafe-4": { name: "コーヒースタンド神保町", rating: "4.2 (143)", area: "神保町 ・ 1.1km", desc: "静かなBGMと落ち着いた空間で、読書やレポート作成にも向いています。", tags: ["Wi-Fi", "静か"], price: "価格帯: ¥¥", hours: "8:30 - 21:00", lat: 35.695, lng: 139.7586 },
    "cafe-5": { name: "ノマドベース新宿南口", rating: "4.6 (264)", area: "新宿 ・ 1.6km", desc: "作業向け席が豊富で、充電しながら長時間利用しやすい店舗です。", tags: ["Wi-Fi", "電源", "長時間OK"], price: "価格帯: ¥¥¥", hours: "7:30 - 23:00", lat: 35.6874, lng: 139.7012 },
    "cafe-6": { name: "ミドリカフェ秋葉原", rating: "4.1 (176)", area: "秋葉原 ・ 0.8km", desc: "駅から近く、短時間の作業にも使いやすいアクセス重視のカフェです。", tags: ["Wi-Fi", "駅近"], price: "価格帯: ¥¥", hours: "10:00 - 21:30", lat: 35.6984, lng: 139.773 },
    "cafe-7": { name: "ワークカフェ品川", rating: "4.8 (312)", area: "品川 ・ 2.0km", desc: "明るい店内と広いテーブルで、チーム作業から個人学習まで対応可能です。", tags: ["Wi-Fi", "電源", "静か"], price: "価格帯: ¥¥¥", hours: "7:00 - 22:30", lat: 35.6285, lng: 139.7387 },
    "cafe-8": { name: "サニーコーヒー中野", rating: "4.0 (121)", area: "中野 ・ 2.4km", desc: "カジュアルな雰囲気で入りやすく、気軽にPC作業できる店舗です。", tags: ["Wi-Fi", "禁煙"], price: "価格帯: ¥", hours: "9:00 - 20:00", lat: 35.7059, lng: 139.6657 },
    "cafe-9": { name: "ブリーズカフェ恵比寿", rating: "4.4 (209)", area: "恵比寿 ・ 1.9km", desc: "窓際席が人気で、明るい時間帯に集中して作業したい人におすすめです。", tags: ["Wi-Fi", "電源"], price: "価格帯: ¥¥¥", hours: "8:00 - 21:30", lat: 35.6467, lng: 139.7101 },
    "cafe-10": { name: "モーニングロースト目黒", rating: "4.3 (167)", area: "目黒 ・ 2.1km", desc: "朝早くから営業しており、通学前の作業時間を確保しやすい店舗です。", tags: ["Wi-Fi", "長時間OK"], price: "価格帯: ¥¥", hours: "6:30 - 19:30", lat: 35.6339, lng: 139.7155 },
    "cafe-11": { name: "クラフトビーンズ吉祥寺", rating: "4.5 (241)", area: "吉祥寺 ・ 3.2km", desc: "席の種類が豊富で、1人作業にも打ち合わせにも使いやすいカフェです。", tags: ["Wi-Fi", "電源", "静か"], price: "価格帯: ¥¥¥", hours: "8:00 - 22:00", lat: 35.7033, lng: 139.5796 }
  };

  const id = new URLSearchParams(window.location.search).get("id") || "cafe-1";
  const cafe = cafeData[id] || cafeData["cafe-1"];

  document.getElementById("cafe-name").textContent = cafe.name;
  document.getElementById("cafe-rating").textContent = `★ ${cafe.rating}`;
  document.getElementById("cafe-meta").textContent = cafe.area;
  document.getElementById("cafe-desc").textContent = cafe.desc;
  document.getElementById("cafe-price").textContent = cafe.price;
  document.getElementById("cafe-hours").textContent = cafe.hours;

  const tags = document.getElementById("cafe-tags");
  tags.innerHTML = cafe.tags.map((tag) => `<span>${tag}</span>`).join("");

  if (typeof L === "undefined") {
    return;
  }

  const map = L.map("detail-map").setView([cafe.lat, cafe.lng], 15);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  L.marker([cafe.lat, cafe.lng]).addTo(map).bindPopup(`<strong>${cafe.name}</strong><br>${cafe.area}`).openPopup();
});
