USE cafe_navi;

INSERT INTO cafes (external_code, name, area)
VALUES
  ('cafe-1', 'スターバックス渋谷ツタヤ店', '渋谷'),
  ('cafe-2', 'ブルーボトルコーヒー六本木', '六本木'),
  ('cafe-3', 'カフェ・ルミエール池袋', '池袋')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  area = VALUES(area);
