#!/usr/bin/env python3
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
from typing import Optional
from datetime import datetime, timedelta, timezone
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

BASE_DIR = Path(__file__).resolve().parent
DB_DIR = BASE_DIR / "db"
DB_PATH = DB_DIR / "cafe_navi.sqlite3"
SESSION_COOKIE = "cafe_navi_session"
SESSION_TTL_DAYS = 14


def utc_now_iso() -> str:
  return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def hash_password(password: str, salt: Optional[str] = None) -> str:
  if salt is None:
    salt = secrets.token_hex(16)
  digest = hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()
  return f"{salt}${digest}"


def verify_password(password: str, password_hash: str) -> bool:
  parts = password_hash.split("$", 1)
  if len(parts) != 2:
    return False
  salt, stored_digest = parts
  calc = hash_password(password, salt).split("$", 1)[1]
  return hmac.compare_digest(calc, stored_digest)


def get_connection() -> sqlite3.Connection:
  conn = sqlite3.connect(DB_PATH)
  conn.row_factory = sqlite3.Row
  conn.execute("PRAGMA foreign_keys = ON")
  return conn


def init_db() -> None:
  DB_DIR.mkdir(parents=True, exist_ok=True)
  conn = get_connection()
  try:
    conn.executescript(
      """
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        last_login_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cafes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        external_code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        area TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        cafe_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(user_id, cafe_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (cafe_id) REFERENCES cafes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_token TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      """
    )

    now = utc_now_iso()
    seed_cafes = [
      ("cafe-1", "スターバックス渋谷ツタヤ店", "渋谷"),
      ("cafe-2", "ブルーボトルコーヒー六本木", "六本木"),
      ("cafe-3", "カフェ・ルミエール池袋", "池袋"),
      ("cafe-4", "コーヒースタンド神保町", "神保町"),
      ("cafe-5", "ノマドベース新宿南口", "新宿"),
      ("cafe-6", "ミドリカフェ秋葉原", "秋葉原"),
      ("cafe-7", "ワークカフェ品川", "品川"),
      ("cafe-8", "サニーコーヒー中野", "中野"),
      ("cafe-9", "ブリーズカフェ恵比寿", "恵比寿"),
      ("cafe-10", "モーニングロースト目黒", "目黒"),
      ("cafe-11", "クラフトビーンズ吉祥寺", "吉祥寺"),
    ]

    for code, name, area in seed_cafes:
      conn.execute(
        """
        INSERT INTO cafes(external_code, name, area, created_at, updated_at)
        VALUES(?, ?, ?, ?, ?)
        ON CONFLICT(external_code) DO UPDATE SET name=excluded.name, area=excluded.area, updated_at=excluded.updated_at
        """,
        (code, name, area, now, now),
      )

    conn.commit()
  finally:
    conn.close()


class ApiHandler(SimpleHTTPRequestHandler):
  def _apply_cors_headers(self) -> None:
    origin = self.headers.get("Origin")
    if origin:
      self.send_header("Access-Control-Allow-Origin", origin)
      self.send_header("Vary", "Origin")
    else:
      self.send_header("Access-Control-Allow-Origin", "*")
    self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
    self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")

  def _send_json(self, status: int, payload: dict, set_cookie: Optional[str] = None, clear_cookie: bool = False) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    self.send_response(status)
    self._apply_cors_headers()
    self.send_header("Content-Type", "application/json; charset=utf-8")
    self.send_header("Content-Length", str(len(body)))
    if set_cookie:
      self.send_header("Set-Cookie", set_cookie)
    elif clear_cookie:
      self.send_header("Set-Cookie", f"{SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax")
    self.end_headers()
    self.wfile.write(body)

  def do_OPTIONS(self):
    self.send_response(HTTPStatus.NO_CONTENT)
    self._apply_cors_headers()
    self.end_headers()

  def _read_json(self) -> dict:
    length = int(self.headers.get("Content-Length", "0"))
    if length <= 0:
      return {}
    raw = self.rfile.read(length)
    if not raw:
      return {}
    return json.loads(raw.decode("utf-8"))

  def _session_token(self) -> Optional[str]:
    auth_header = self.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
      return auth_header.replace("Bearer ", "", 1).strip()

    cookie_header = self.headers.get("Cookie")
    if not cookie_header:
      return None
    cookie = SimpleCookie()
    cookie.load(cookie_header)
    morsel = cookie.get(SESSION_COOKIE)
    return morsel.value if morsel else None

  def _current_user(self, conn: sqlite3.Connection):
    token = self._session_token()
    if not token:
      return None

    row = conn.execute(
      """
      SELECT u.id, u.user_name, u.email
      FROM user_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.session_token = ? AND s.expires_at > ?
      """,
      (token, utc_now_iso()),
    ).fetchone()
    return row

  def _require_user(self, conn: sqlite3.Connection):
    user = self._current_user(conn)
    if user is None:
      self._send_json(HTTPStatus.UNAUTHORIZED, {"error": "ログインが必要です"})
      return None
    return user

  def do_GET(self):
    parsed = urlparse(self.path)
    if parsed.path == "/api/me":
      conn = get_connection()
      try:
        user = self._current_user(conn)
        if user is None:
          self._send_json(HTTPStatus.UNAUTHORIZED, {"error": "未ログイン"})
          return
        self._send_json(HTTPStatus.OK, {"user": {"id": user["id"], "userName": user["user_name"], "email": user["email"]}})
      finally:
        conn.close()
      return

    if parsed.path == "/api/favorites":
      conn = get_connection()
      try:
        user = self._require_user(conn)
        if user is None:
          return
        rows = conn.execute(
          """
          SELECT c.external_code AS cafeCode
          FROM favorites f
          JOIN cafes c ON c.id = f.cafe_id
          WHERE f.user_id = ?
          ORDER BY f.created_at DESC
          """,
          (user["id"],),
        ).fetchall()
        self._send_json(HTTPStatus.OK, {"favorites": [r["cafeCode"] for r in rows]})
      finally:
        conn.close()
      return

    return super().do_GET()

  def do_POST(self):
    parsed = urlparse(self.path)

    if parsed.path == "/api/signup":
      payload = self._read_json()
      user_name = str(payload.get("userName", "")).strip()
      email = str(payload.get("email", "")).strip().lower()
      password = str(payload.get("password", ""))

      if len(user_name) < 2 or "@" not in email or len(password) < 6:
        self._send_json(HTTPStatus.BAD_REQUEST, {"error": "入力内容を確認してください"})
        return

      now = utc_now_iso()
      conn = get_connection()
      try:
        try:
          conn.execute(
            "INSERT INTO users(user_name, email, password_hash, created_at, updated_at) VALUES(?, ?, ?, ?, ?)",
            (user_name, email, hash_password(password), now, now),
          )
          conn.commit()
        except sqlite3.IntegrityError:
          self._send_json(HTTPStatus.CONFLICT, {"error": "このメールアドレスは既に登録されています"})
          return
      finally:
        conn.close()

      self._send_json(HTTPStatus.CREATED, {"message": "登録が完了しました"})
      return

    if parsed.path == "/api/login":
      payload = self._read_json()
      email = str(payload.get("email", "")).strip().lower()
      password = str(payload.get("password", ""))

      conn = get_connection()
      try:
        user = conn.execute("SELECT id, user_name, email, password_hash FROM users WHERE email = ? AND is_active = 1", (email,)).fetchone()
        if user is None or not verify_password(password, user["password_hash"]):
          self._send_json(HTTPStatus.UNAUTHORIZED, {"error": "メールアドレスまたはパスワードが違います"})
          return

        token = secrets.token_hex(32)
        now = datetime.now(timezone.utc)
        expires = now + timedelta(days=SESSION_TTL_DAYS)

        conn.execute("UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?", (now.strftime("%Y-%m-%d %H:%M:%S"), now.strftime("%Y-%m-%d %H:%M:%S"), user["id"]))
        conn.execute(
          "INSERT INTO user_sessions(user_id, session_token, expires_at, created_at) VALUES(?, ?, ?, ?)",
          (user["id"], token, expires.strftime("%Y-%m-%d %H:%M:%S"), now.strftime("%Y-%m-%d %H:%M:%S")),
        )
        conn.commit()

        cookie = f"{SESSION_COOKIE}={token}; Path=/; Max-Age={SESSION_TTL_DAYS * 86400}; HttpOnly; SameSite=Lax"
        self._send_json(
          HTTPStatus.OK,
          {
            "message": "ログインしました",
            "sessionToken": token,
            "user": {"id": user["id"], "userName": user["user_name"], "email": user["email"]}
          },
          set_cookie=cookie,
        )
      finally:
        conn.close()
      return

    if parsed.path == "/api/logout":
      token = self._session_token()
      conn = get_connection()
      try:
        if token:
          conn.execute("DELETE FROM user_sessions WHERE session_token = ?", (token,))
          conn.commit()
      finally:
        conn.close()
      self._send_json(HTTPStatus.OK, {"message": "ログアウトしました"}, clear_cookie=True)
      return

    if parsed.path == "/api/favorites":
      payload = self._read_json()
      cafe_code = str(payload.get("cafeCode", "")).strip()
      cafe_name = str(payload.get("cafeName", "")).strip() or cafe_code
      area = str(payload.get("area", "")).strip()

      if not cafe_code:
        self._send_json(HTTPStatus.BAD_REQUEST, {"error": "cafeCodeは必須です"})
        return

      conn = get_connection()
      try:
        user = self._require_user(conn)
        if user is None:
          return

        now = utc_now_iso()
        conn.execute(
          """
          INSERT INTO cafes(external_code, name, area, created_at, updated_at)
          VALUES(?, ?, ?, ?, ?)
          ON CONFLICT(external_code) DO UPDATE SET name=excluded.name, area=excluded.area, updated_at=excluded.updated_at
          """,
          (cafe_code, cafe_name, area, now, now),
        )

        cafe = conn.execute("SELECT id FROM cafes WHERE external_code = ?", (cafe_code,)).fetchone()
        if cafe is None:
          self._send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "カフェ情報の保存に失敗しました"})
          return

        conn.execute(
          "INSERT OR IGNORE INTO favorites(user_id, cafe_id, created_at) VALUES(?, ?, ?)",
          (user["id"], cafe["id"], now),
        )
        conn.commit()
      finally:
        conn.close()

      self._send_json(HTTPStatus.CREATED, {"message": "お気に入りに追加しました"})
      return

    self._send_json(HTTPStatus.NOT_FOUND, {"error": "Not Found"})

  def do_DELETE(self):
    parsed = urlparse(self.path)
    if not parsed.path.startswith("/api/favorites/"):
      self._send_json(HTTPStatus.NOT_FOUND, {"error": "Not Found"})
      return

    cafe_code = parsed.path.replace("/api/favorites/", "", 1).strip()
    if not cafe_code:
      self._send_json(HTTPStatus.BAD_REQUEST, {"error": "cafeCodeは必須です"})
      return

    conn = get_connection()
    try:
      user = self._require_user(conn)
      if user is None:
        return

      conn.execute(
        """
        DELETE FROM favorites
        WHERE user_id = ?
          AND cafe_id IN (SELECT id FROM cafes WHERE external_code = ?)
        """,
        (user["id"], cafe_code),
      )
      conn.commit()
    finally:
      conn.close()

    self._send_json(HTTPStatus.OK, {"message": "お気に入りを解除しました"})


if __name__ == "__main__":
  init_db()
  port = int(os.environ.get("PORT", "8000"))
  server = ThreadingHTTPServer(("0.0.0.0", port), ApiHandler)
  print(f"Cafe Navi server running at http://localhost:{port}")
  server.serve_forever()
