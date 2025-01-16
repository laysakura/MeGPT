# MeGPT

システムプロンプトを自由に設定してOpenAIモデルとチャットできるブラウザツール。

## サーバーの起動方法

以下のコマンドを使用して、サーバーを起動します。

```bash
uv venv ; source venv/bin/activate
uv sync

uv run uvicorn src.megpt.main:app --host 127.0.0.1 --port 12345
```

このコマンドを実行すると、サーバーが`localhost:12345`で起動します。

## システムプロンプト集

- [プロンプトエンジニアリングアドバイザー](./prompts/promptEngineering/)
