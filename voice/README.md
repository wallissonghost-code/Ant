# ANT Voice Lab

Módulo experimental de voz, isolado do Hand/XR runtime.

## v0.1
- captura explícita do microfone;
- áudio sem processamento remoto pelo Voice Lab;
- amostras mantidas em memória durante a sessão;
- labels definidos pelo usuário;
- reprodução/remoção local;
- exportação manual em `ANT-VOICE-DATASET v1`.

## Isolamento
O módulo vive em `/voice/` e não importa, altera ou inicializa `app/web/ant.js`. O Hand Lab continua sendo servido pela raiz.

## Próxima etapa
Extrair features acústicas localmente (frames, energia, espectro/Mel) e implementar o primeiro classificador treinado com o dataset próprio. Nenhuma API de STT/LLM/TTS faz parte da v0.1.
