#!/bin/bash
# ================================================
#   TCV LUXURY — かんたん起動スクリプト
#   このファイルをダブルクリックするだけで起動できます
# ================================================

cd "$(dirname "$0")"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║    🚗  TCV LUXURY  起動中...          ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Node.jsの確認
if ! command -v node &> /dev/null; then
  echo "❌ Node.jsがインストールされていません。"
  echo "   https://nodejs.org からインストールしてください。"
  read -p "Enterキーで閉じる..."
  exit 1
fi

# パッケージ確認（初回のみ自動インストール）
if [ ! -d "node_modules" ]; then
  echo "📦 初回セットアップ中（1回だけ実行されます）..."
  npm install
  echo ""
fi

# すでにポート3000が使われている場合は終了させる
EXISTING=$(lsof -ti :3000 2>/dev/null)
if [ -n "$EXISTING" ]; then
  echo "⚠️  既存のサーバーを停止しています..."
  kill -9 $EXISTING 2>/dev/null
  sleep 1
fi

echo "✅ サーバーを起動しています..."
echo ""

# サーバーをバックグラウンドで起動
node server.js &
SERVER_PID=$!

# サーバーの起動を待つ（最大10秒）
echo "🔄 起動待機中..."
for i in $(seq 1 10); do
  sleep 1
  if curl -s http://localhost:3000/api/status > /dev/null 2>&1; then
    break
  fi
done

echo ""
echo "📱 ブラウザで開きます："
echo "   👉  http://localhost:3000"
echo ""
echo "（初回スクレイピングに1〜2分かかります）"
echo "（終了するにはこのウィンドウを閉じてください）"
echo ""

# ブラウザを開く（サーバー起動確認後）
open http://localhost:3000

# サーバーが終了するまで待機
wait $SERVER_PID
