const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// Configurações
const GRUPO_TORRE_ESCARLATE = '120363030760041273@g.us';
const DATA_FILE = 'torre_data.json';

// Inicializar dados
let torreData = {
  participantes: [],
  ultimosJutsus: {},
  dataAtual: new Date().toLocaleDateString('pt-BR')
};

// Carregar dados salvos
function carregarDados() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      torreData = JSON.parse(data);
      
      // Verificar se mudou o dia para resetar jutsus diários
      const hoje = new Date().toLocaleDateString('pt-BR');
      if (torreData.dataAtual !== hoje) {
        torreData.ultimosJutsus = {};
        torreData.dataAtual = hoje;
        salvarDados();
      }
    }
  } catch (error) {
    console.log('Erro ao carregar dados:', error);
  }
}

// Salvar dados
function salvarDados() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(torreData, null, 2));
  } catch (error) {
    console.log('Erro ao salvar dados:', error);
  }
}

// Inicializar participantes padrão
function inicializarParticipantes() {
  const participantesPadrao = [
    "Bryan Nara ♣️",
    "Kotogami Hoshigaki ⛎",
    "Nex Hoshigaki ⛎", 
    "Isabella Shin 👁️‍🗨️",
    "Usagi Kyūsuke 🗯️",
    "Nico Robin Pain ☦️",
    "Sunight Hōki 💮",
    "Dante Haruno 🌸",
    "Ravi Yakushi ♉",
    "Miaw Render 🈚",
    "Rimuru Render 🈚",
    "Alex Kyusuke 🗯️",
    "Saturno Yuki ❄️",
    "Alice Hoshigaki ⛎",
    "Yukki Akasuna 🎭",
    "Bruna Garasu ⚪",
    "Tendo Inuzuka 🐾",
    "Prodígio Karatachi ⚕️",
    "Akira Hougan ㊙️",
    "Thais Kami ⚜️",
    "Samuel Seo Jūgo ⚛️",
    "Felipe Namikaze 〽️",
    "Gui Kyūsuke 🗯️",
    "Sono Jūgo ⚛️",
    "Kidson Sozo ♦️"
  ];

  if (torreData.participantes.length === 0) {
    participantesPadrao.forEach(nome => {
      torreData.participantes.push({
        nome: nome,
        estrelas: 0,
        andar: 1,
        usuario: null,
        numero: null
      });
    });
    salvarDados();
  }
}

// Encontrar participante por usuário
function encontrarParticipantePorUsuario(usuario) {
  return torreData.participantes.find(p => 
    p.usuario && (p.usuario === usuario || p.numero === usuario)
  );
}

// Encontrar participante por nome
function encontrarParticipantePorNome(nome) {
  return torreData.participantes.find(p => 
    p.nome.toLowerCase().includes(nome.toLowerCase())
  );
}

// Encontrar participante por número
function encontrarParticipantePorNumero(numero) {
  return torreData.participantes.find(p => p.numero === numero);
}

// Formatar lista
function formatarLista() {
  const participantesPorAndar = {};
  
  torreData.participantes.forEach(participante => {
    if (!participantesPorAndar[participante.andar]) {
      participantesPorAndar[participante.andar] = [];
    }
    participantesPorAndar[participante.andar].push(participante);
  });

  // Ordenar andares
  const andaresOrdenados = Object.keys(participantesPorAndar)
    .map(Number)
    .sort((a, b) => b - a);

  let lista = `*❕❮•🏯❝Torre Escarlate❞🏯•❯❕*\n${new Date().toLocaleDateString('pt-BR')}\n\n`;

  andaresOrdenados.forEach(andar => {
    // Ordenar participantes do mesmo andar por estrelas (decrescente)
    participantesPorAndar[andar].sort((a, b) => b.estrelas - a.estrelas);
    
    participantesPorAndar[andar].forEach(participante => {
      lista += `${andar} • ${participante.nome} [${participante.estrelas}⭐]\n`;
    });
    lista += '\n';
  });

  return lista.trim();
}

// Extrair número do JID
function extrairNumero(jid) {
  return jid.replace('@s.whatsapp.net', '').replace('@c.us', '');
}

// Verificar se é o grupo correto
function ehGrupoTorre(jid) {
  return jid === GRUPO_TORRE_ESCARLATE;
}

// Iniciar bot
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  
  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    logger: {
      level: 'silent'
    }
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, qr } = update;
    
    if (qr) {
      qrcode.generate(qr, { small: true });
    }
    
    if (connection === 'open') {
      console.log('Bot conectado à Torre Escarlate!');
    }
    
    if (connection === 'close') {
      console.log('Conexão fechada, reconectando...');
      startBot();
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    
    if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;

    const messageText = msg.message.conversation || 
                       msg.message.extendedTextMessage?.text || 
                       msg.message.imageMessage?.caption || '';

    const sender = msg.key.remoteJid;
    const isGroup = sender.endsWith('@g.us');

    // Verificar se é o grupo da Torre Escarlate
    if (!ehGrupoTorre(sender)) {
      if (!isGroup) {
        // Se for mensagem privada, informar sobre o grupo
        await sock.sendMessage(sender, { 
          text: '🏯 *BOT DA TORRE ESCARLATE* 🏯\n\nEste bot funciona apenas no grupo:\n*❮•🏯❝Torre Escarlate❞🏯•❯*\n\nEntre no grupo para usar os comandos!' 
        });
      }
      return;
    }

    const usuarioNumero = extrairNumero(msg.key.participant || sender);

    // Comando !cadastrar
    if (messageText.startsWith('!cadastrar')) {
      try {
        let nomeParticipante = messageText.replace('!cadastrar', '').trim();
        
        if (!nomeParticipante) {
          await sock.sendMessage(sender, { 
            text: '❌ *Uso correto:* !cadastrar [Nome do Personagem]\n*Exemplo:* !cadastrar Kidson Sozo ♦️' 
          }, { quoted: msg });
          return;
        }

        // Verificar se usuário já está cadastrado
        const jaCadastrado = encontrarParticipantePorNumero(usuarioNumero);
        if (jaCadastrado) {
          await sock.sendMessage(sender, { 
            text: `❌ Você já está cadastrado como: ${jaCadastrado.nome}` 
          }, { quoted: msg });
          return;
        }

        // Encontrar participante pelo nome
        const participante = encontrarParticipantePorNome(nomeParticipante);
        if (!participante) {
          await sock.sendMessage(sender, { 
            text: `❌ Participante "${nomeParticipante}" não encontrado na lista! Use !lista para ver os nomes disponíveis.` 
          }, { quoted: msg });
          return;
        }

        // Verificar se participante já tem dono
        if (participante.usuario) {
          await sock.sendMessage(sender, { 
            text: `❌ ${participante.nome} já está cadastrado por outro usuário!` 
          }, { quoted: msg });
          return;
        }

        // Cadastrar usuário
        participante.usuario = usuarioNumero;
        participante.numero = usuarioNumero;
        salvarDados();

        await sock.sendMessage(sender, { 
          text: `✅ *CADASTRO REALIZADO COM SUCESSO!*\n\n👤 *Personagem:* ${participante.nome}\n📱 *Usuário:* ${usuarioNumero}\n🏯 *Andar Inicial:* 1\n⭐ *Estrelas:* 0\n\nPara acumular estrelas, use o comando *!jutsu* uma vez por dia!` 
        }, { quoted: msg });

      } catch (error) {
        console.log('Erro no cadastro:', error);
        await sock.sendMessage(sender, { 
          text: '❌ Erro ao realizar cadastro. Tente novamente.' 
        }, { quoted: msg });
      }
    }

    // Comando !jutsu
    if (messageText === '!jutsu') {
      try {
        const participante = encontrarParticipantePorNumero(usuarioNumero);
        
        if (!participante) {
          await sock.sendMessage(sender, { 
            text: '❌ Você não está cadastrado! Use !cadastrar [SeuPersonagem] primeiro.' 
          }, { quoted: msg });
          return;
        }

        const hoje = new Date().toLocaleDateString('pt-BR');
        const ultimoJutsu = torreData.ultimosJutsus[usuarioNumero];

        if (ultimoJutsu === hoje) {
          await sock.sendMessage(sender, { 
            text: '⏳ *Você já usou seu jutsu hoje!*\nDisponível novamente após meia-noite. ⏳' 
          }, { quoted: msg });
          return;
        }

        // Adicionar estrela
        participante.estrelas += 1;
        torreData.ultimosJutsus[usuarioNumero] = hoje;
        
        // Verificar promoção de andar
        let mensagemPromocao = '';
        if (participante.estrelas >= 10 && participante.andar === 1) {
          participante.andar = 2;
          mensagemPromocao = `\n\n🎉 *PARABÉNS! ${participante.nome} SUBIU PARA O ANDAR 2!* 🎉`;
        }

        salvarDados();

        await sock.sendMessage(sender, { 
          text: `✅ *JUTSU EXECUTADO COM SUCESSO!*\n\n👤 ${participante.nome}\n⭐ +1 estrela adicionada!\n📊 *Total:* ${participante.estrelas} estrelas\n🏯 *Andar:* ${participante.andar}${mensagemPromocao}\n\nUse *!estrela* para ver seu progresso completo.` 
        }, { quoted: msg });

      } catch (error) {
        console.log('Erro no jutsu:', error);
        await sock.sendMessage(sender, { 
          text: '❌ Erro ao processar jutsu. Tente novamente.' 
        }, { quoted: msg });
      }
    }

    // Comando !estrela
    if (messageText === '!estrela') {
      try {
        const participante = encontrarParticipantePorNumero(usuarioNumero);
        
        if (!participante) {
          await sock.sendMessage(sender, { 
            text: '❌ Você não está cadastrado! Use !cadastrar [SeuPersonagem] primeiro.' 
          }, { quoted: msg });
          return;
        }

        const estrelasParaSubir = Math.max(0, 10 - participante.estrelas);
        
        await sock.sendMessage(sender, { 
          text: `📊 *PROGRESSO DE ${participante.nome.toUpperCase()}*\n\n⭐ *Estrelas:* ${participante.estrelas}\n🏯 *Andar:* ${participante.andar}\n🎯 *Próximo Andar:* ${estrelasParaSubir} estrelas\n\nContinue treinando! 💪` 
        }, { quoted: msg });

      } catch (error) {
        console.log('Erro ao ver estrelas:', error);
      }
    }

    // Comando !lista
    if (messageText === '!lista') {
      try {
        const lista = formatarLista();
        await sock.sendMessage(sender, { text: lista });
      } catch (error) {
        console.log('Erro ao gerar lista:', error);
        await sock.sendMessage(sender, { 
          text: '❌ Erro ao gerar lista. Tente novamente.' 
        }, { quoted: msg });
      }
    }

    // Comando !ajuda
    if (messageText === '!ajuda' || messageText === '!comandos') {
      const ajudaText = `🎯 *COMANDOS DA TORRE ESCARLATE* 🎯

📝 *!cadastrar* [Nome] - Vincula seu número a um personagem
⚡ *!jutsu* - Executa jutsu diário (+1 estrela)
⭐ *!estrela* - Mostra seu progresso individual
📋 *!lista* - Mostra ranking completo da torre
🆘 *!ajuda* - Mostra esta mensagem

*Regras da Torre:*
• 1 jutsu por dia por personagem
• 10 estrelas = sobe para Andar 2
• Respeite o limite diário
• Comandos só funcionam neste grupo

*Bons desenhos, ninja!* 🏯`;

      await sock.sendMessage(sender, { text: ajudaText });
    }
  });
}

// Inicializar
carregarDados();
inicializarParticipantes();
startBot().catch(console.error);