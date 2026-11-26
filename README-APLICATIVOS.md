# Cobras da Lagoa — preparação para instalação

## O que já está pronto nesta versão
- PWA: manifest, ícones e service worker.
- Servidor Node: entrega os arquivos do PWA.
- Interface: removeu a tela obrigatória de rotação; acompanha retrato ou paisagem.
- Multiplayer: continua usando o WebSocket do servidor existente.

## Publicar a atualização
1. Substitua os arquivos do repositório pelos arquivos desta pasta, mantendo `mural.json`.
2. Envie para o GitHub (commit/push).
3. O Render fará novo deploy.
4. Abra a URL HTTPS do jogo no Chrome e use o botão **Instalar jogo** quando aparecer, ou o menu do navegador > Instalar aplicativo.

## APK e EXE
O PWA é a primeira etapa e já pode ser instalado no Android e no Windows por navegadores compatíveis. Para gerar APK e EXE nativos, precisamos apontar os empacotadores para a URL pública HTTPS definitiva do Render. Isso evita criar uma cópia local desatualizada e mantém todos conectados à mesma partida online.
