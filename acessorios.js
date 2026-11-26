/* ============================================================
   ACESSÓRIOS DAS COBRAS — catálogo modular (2D / Canvas)
   Usado pelo servidor (valida índices) e pelo navegador (desenha).

   COMO ADICIONAR UM ITEM NOVO
   1) Escolha o slot em ITENS (pe, ht, fa, pc, cs).
   2) Acrescente NO FIM da lista:  {n:'Nome', d:function(){ ...desenho... }}
      (nunca no meio: o índice do item é a posição na lista e vai salvo
       no perfil dos jogadores e no mural).
   3) Pronto: editor, sorteio, validação do servidor e bots já usam.

   COORDENADAS DO DESENHO (1 unidade = raio da cabeça da cobra)
   - pe  (peruca): origem = centro da cabeça. Y negativo = para cima.
   - ht  (chapéu): origem = base do chapéu. Y negativo = para cima.
                   'h' = altura (para posicionar o nome da cobra).
   - fa  (rosto):  gira junto com a cabeça. +X = frente, Y = lados.
   - pc  (pescoço) e cs (costas): giram junto com a cabeça, +X = frente,
                   atrás da cabeça = X negativo.
   Helpers: C(x,y,r,cor) E(x,y,rx,ry,cor,rot) Rc(x,y,w,h,cor)
            Po([x,y,...],cor) Co(x,y,tam,cor) Ln(x1,y1,x2,y2,larg,cor)
            Ar(x,y,r,a0,a1,larg,cor)
   O desenho de cada item é feito UMA vez num canvas de cache; depois
   o jogo só faz drawImage (barato para PCs modestos).
   ============================================================ */
(function(root){
var G;
function C(x,y,r,c){G.fillStyle=c;G.beginPath();G.arc(x,y,r,0,6.2832);G.fill()}
function E(x,y,rx,ry,c,rot){G.fillStyle=c;G.beginPath();G.ellipse(x,y,rx,ry,rot||0,0,6.2832);G.fill()}
function Rc(x,y,w,h,c){G.fillStyle=c;G.fillRect(x,y,w,h)}
function Po(p,c){G.fillStyle=c;G.beginPath();G.moveTo(p[0],p[1]);for(var i=2;i<p.length;i+=2)G.lineTo(p[i],p[i+1]);G.closePath();G.fill()}
function Co(x,y,s,c){C(x-s*.25,y-s*.15,s*.3,c);C(x+s*.25,y-s*.15,s*.3,c);Po([x-s*.52,y,x+s*.52,y,x,y+s*.62],c)}
function Ln(x1,y1,x2,y2,w,c){G.strokeStyle=c;G.lineWidth=w;G.lineCap='round';G.beginPath();G.moveTo(x1,y1);G.lineTo(x2,y2);G.stroke()}
function Ar(x,y,r,a0,a1,w,c){G.strokeStyle=c;G.lineWidth=w;G.beginPath();G.arc(x,y,r,a0,a1);G.stroke()}

/* slots: id usado no perfil/rede, k = posição no vetor K da cobra */
var SLOTS=[
  {id:'pe',k:3,nome:'Peruca'},
  {id:'ht',k:4,nome:'Chapéu'},
  {id:'fa',k:5,nome:'Rosto'},
  {id:'pc',k:6,nome:'Pescoço'},
  {id:'cs',k:7,nome:'Costas'}
];

var ITENS={
pe:[
  {n:'Sem peruca'},
  {n:'Afro preto',top:1.8,d:function(){C(0,-.55,1.25,'#2b1b17')}},
  {n:'Loira longa',top:1.6,d:function(){C(0,-.5,1.1,'#f4d35e');Rc(-1.15,-.5,.55,1.9,'#f4d35e');Rc(.6,-.5,.55,1.9,'#f4d35e')}},
  {n:'Rosa choque',top:1.8,d:function(){C(0,-.55,1.25,'#ff3fa4')}},
  {n:'Palhaço',top:1.4,d:function(){C(-1,-.35,.6,'#e63946');C(1,-.35,.6,'#e63946');C(0,-.7,.7,'#e63946')}},
  {n:'Arco-íris',top:1.9,d:function(){C(0,-.55,1.35,'#e63946');C(0,-.55,1.05,'#f4d35e');C(0,-.55,.75,'#2a9d8f');C(0,-.55,.45,'#4361ee')}},
  {n:'Topete',top:1.55,d:function(){C(0,-.45,.85,'#1b1b1b');E(.2,-1,.9,.55,'#1b1b1b',-.25)}},
  {n:'Moicano',top:2.0,d:function(){
    E(0,-.3,.85,.4,'#1fa855');
    Po([-.75,-.25,-.5,-1.5,-.2,-.4],'#2fd36b');Po([-.3,-.4,0,-2,.3,-.4],'#2fd36b');Po([.2,-.4,.5,-1.5,.75,-.25],'#2fd36b')}},
  {n:'Cacheado azul',top:1.6,d:function(){
    C(0,-.55,.95,'#2f6fe0');C(-.85,-.45,.5,'#3a86ff');C(.85,-.45,.5,'#3a86ff');C(-.45,-1,.5,'#5a9bff');C(.45,-1,.5,'#5a9bff');C(0,-1.1,.45,'#3a86ff')}}
],
ht:[
  {n:'Sem chapéu'},
  {n:'Cartola',h:1.2,d:function(){Rc(-.95,-.1,1.9,.2,'#111');Rc(-.55,-1.2,1.1,1.1,'#111');Rc(-.55,-.4,1.1,.18,'#e63946')}},
  {n:'Coroa',h:1.0,d:function(){Po([-.7,0,-.8,-.9,-.4,-.45,0,-1,.4,-.45,.8,-.9,.7,0],'#ffd400');C(0,-.2,.1,'#e63946');C(-.4,-.15,.09,'#4361ee');C(.4,-.15,.09,'#2a9d8f')}},
  {n:'Chapéu de festa',h:1.5,d:function(){Po([-.55,0,0,-1.5,.55,0],'#ff4fb0');Po([-.3,-.55,0,-1.5,.3,-.55],'#4cc9f0');C(0,-1.5,.18,'#ffd400')}},
  {n:'Cowboy',h:.75,d:function(){E(0,0,1.25,.28,'#8d5524');Rc(-.5,-.75,1,.75,'#8d5524');Rc(-.5,-.3,1,.14,'#ffd400')}},
  {n:'Bruxa',h:1.6,d:function(){E(0,0,1.1,.25,'#2d1b4e');Po([-.6,0,.15,-1.6,.6,0],'#2d1b4e');Rc(-.6,-.28,1.2,.16,'#f4d35e')}},
  {n:'Sombreiro',h:.85,d:function(){E(0,0,1.9,.45,'#f4a261');E(0,-.35,.6,.5,'#e76f51');C(-1.4,0,.12,'#ffd400');C(1.4,0,.12,'#ffd400');C(0,.2,.1,'#ffd400')}},
  {n:'Gorro de Natal',h:1.1,d:function(){Po([-.7,0,.1,-1.1,.7,0],'#d62828');Rc(-.8,-.15,1.6,.25,'#fff');C(.1,-1.1,.18,'#fff')}},
  {n:'Boné',h:.8,d:function(){
    G.fillStyle='#1d4ed8';G.beginPath();G.arc(0,0,.75,Math.PI,6.2832);G.closePath();G.fill();
    Rc(-.75,-.12,1.5,.12,'#fff');E(.6,0,.6,.14,'#1e3a8a');C(0,-.75,.08,'#fff')}},
  {n:'Chef',h:1.3,d:function(){
    Rc(-.55,-.25,1.1,.25,'#e5e7eb');C(-.4,-.6,.4,'#fff');C(.4,-.6,.4,'#fff');C(0,-.85,.45,'#fff')}},
  {n:'Tiara',h:.6,d:function(){
    Po([-.7,0,-.6,-.35,-.3,-.15,0,-.6,.3,-.15,.6,-.35,.7,0],'#f9a8d4');C(0,-.5,.1,'#60a5fa');C(-.45,-.25,.06,'#fff');C(.45,-.25,.06,'#fff')}}
],
fa:[
  {n:'Sem rosto'},
  {n:'Óculos escuros',d:function(){E(.5,-.5,.45,.42,'#111');E(.5,.5,.45,.42,'#111');Rc(.4,-.15,.2,.3,'#111')}},
  {n:'Bigodão',d:function(){E(.95,-.26,.34,.13,'#5c3317',.5);E(.95,.26,.34,.13,'#5c3317',-.5);E(.95,0,.12,.2,'#5c3317')}},
  {n:'Óculos coração',d:function(){Co(.5,-.5,.9,'#ff2e63');Co(.5,.5,.9,'#ff2e63')}},
  {n:'Nariz de palhaço',d:function(){C(1,0,.32,'#e63946');C(.92,-.1,.09,'#fff')}},
  {n:'Beijo',d:function(){E(1,0,.26,.4,'#d90429');Rc(.85,-.03,.3,.06,'#5a0010')}},
  {n:'Tapa-olho',d:function(){E(.5,.5,.45,.42,'#111');Ln(.2,.9,-.2,-.9,.08,'#111')}},
  {n:'Máscara de herói',d:function(){
    E(.55,0,.5,.95,'#3b4cca');
    C(.45,-.5,.3,'#fff');C(.45,.5,.3,'#fff');C(.57,-.5,.17,'#10202b');C(.57,.5,.17,'#10202b')}},
  {n:'Óculos redondos',d:function(){
    Ar(.5,-.5,.42,0,6.2832,.1,'#222');Ar(.5,.5,.42,0,6.2832,.1,'#222');Rc(.43,-.1,.14,.2,'#222')}}
],
pc:[
  {n:'Sem colar'},
  {n:'Corrente de ouro',d:function(){
    Ar(0,0,1.02,2.15,4.13,.24,'#8a5a0b');Ar(0,0,1.02,2.15,4.13,.14,'#ffd400');
    C(-1.12,0,.24,'#8a5a0b');C(-1.12,0,.18,'#ffd400');C(-1.12,0,.08,'#e63946')}},
  {n:'Colar de pérolas',d:function(){
    for(var i=0;i<9;i++){var an=2.2+i*.2;C(Math.cos(an)*1.02,Math.sin(an)*1.02,.15,'#e8e6d9');C(Math.cos(an)*1.02-.04,Math.sin(an)*1.02-.04,.05,'#fff')}}},
  {n:'Gravata borboleta',d:function(){
    Po([-1,0,-1.6,-.5,-1.6,.5],'#e63946');Po([-1,0,-.4,-.5,-.4,.5],'#e63946');C(-1,0,.17,'#9d0208')}}
],
cs:[
  {n:'Sem costas'},
  {n:'Mochila',d:function(){
    Rc(-2.1,-.8,1.4,1.6,'#2f855a');Rc(-2.1,-.8,.5,1.6,'#276749');Ln(-1.4,-.8,-1.4,.8,.08,'#1c4532');
    Rc(-.95,-.75,.75,.18,'#14532d');Rc(-.95,.57,.75,.18,'#14532d');C(-1.2,0,.1,'#f2b950')}},
  {n:'Capa de herói',d:function(){
    Po([-.5,-.95,-2.9,-1.5,-2.4,0,-2.9,1.5,-.5,.95],'#d62828');
    Po([-.5,-.6,-2.3,-1,-1.9,0,-2.3,1,-.5,.6],'#ff6b5a')}},
  {n:'Asas de anjo',d:function(){
    E(-1.5,-1.35,1.25,.45,'#ffffff',.8);E(-1.5,1.35,1.25,.45,'#ffffff',-.8);
    E(-1.45,-1.25,.75,.24,'#dbeafe',.8);E(-1.45,1.25,.75,.24,'#dbeafe',-.8)}}
]
};
var OLHOS={d:function(){C(.45,-.5,.38,'#fff');C(.45,.5,.38,'#fff');C(.59,-.5,.2,'#10202b');C(.59,.5,.2,'#10202b')}};

var N={};SLOTS.forEach(function(s){N[s.id]=ITENS[s.id].length});

function nomes(id){return ITENS[id].map(function(x){return x.n})}

/* altura (em raios) até o topo do que está sobre a cabeça — posiciona o nome */
function topo(K){
  var t=1,w=ITENS.pe[K[3]|0],h=ITENS.ht[K[4]|0];
  if(w&&w.top)t=w.top;
  if(h&&h.h)t=Math.max(t,(w&&w.top?1.45:.8)+h.h);
  return t>1?t+.3:1;
}

/* ---- cache de sprites (só no navegador) ---- */
var CACHE={};
function spr(slot,i,tier){
  var key=slot+'|'+i+'|'+tier,c=CACHE[key];
  if(c)return c;
  var item=slot=='olhos'?OLHOS:ITENS[slot][i],ppu=tier?44:22,sz=ppu*6;
  c=document.createElement('canvas');c.width=c.height=sz;
  G=c.getContext('2d');G.translate(sz/2,sz/2);G.scale(ppu,ppu);
  item.d();
  return (CACHE[key]=c);
}
function blit(ctx,slot,i,tier){ctx.drawImage(spr(slot,i,tier),-3,-3,6,6)}
function tem(slot,i){return i>0&&ITENS[slot][i]&&ITENS[slot][i].d}

/* Desenha a cabeça + acessórios em (x,y), raio r, direção a (rad).
   - costas/pescoço/rosto giram com a cabeça;
   - peruca/chapéu acompanham a cabeça inclinando conforme a direção
     (ficam legíveis, nunca de cabeça para baixo). */
function cabeca(ctx,x,y,r,a,K){
  var t=r>=11?1:0,pe=K[3]|0,ht=K[4]|0,fa=K[5]|0,pc=K[6]|0,cs=K[7]|0,tilt=Math.sin(a)*.45;
  ctx.save();ctx.translate(x,y);ctx.scale(r,r);
  ctx.rotate(a);
  if(tem('cs',cs))blit(ctx,'cs',cs,t);
  if(tem('pc',pc))blit(ctx,'pc',pc,t);
  ctx.rotate(-a);
  if(tem('pe',pe)){ctx.rotate(tilt);blit(ctx,'pe',pe,t);ctx.rotate(-tilt)}
  ctx.rotate(a);
  blit(ctx,'olhos',0,t);
  if(tem('fa',fa))blit(ctx,'fa',fa,t);
  ctx.rotate(-a);
  if(tem('ht',ht)){ctx.translate(0,tem('pe',pe)?-1.45:-.8);ctx.rotate(tilt);blit(ctx,'ht',ht,t)}
  ctx.restore();
}

var A={SLOTS:SLOTS,ITENS:ITENS,N:N,nomes:nomes,topo:topo,cabeca:cabeca};
if(typeof module!='undefined'&&module.exports)module.exports=A;else root.Ac=A;
})(typeof window!='undefined'?window:this);
