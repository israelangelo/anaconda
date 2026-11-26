const http=require('http'),fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto');
const PORT=+process.env.PORT||3000,RMAX=2600,RMIN=450,NB=10,NF=750,VIEW=1700;
const Ac=require('./acessorios.js'),PASSO=+process.env.PASSO||120,VELF=.7;
const DUR=+process.env.DUR||300,PAUSA=+process.env.PAUSA||15,INI=Math.min(20,DUR*.1);
const NOMES=['Jade','Naga','Ouro','Brisa','Maré','Coral','Pérola','Onda','Raio','Névoa'];
const CORES=['#ff6b5a','#f2b950','#4fd1c5','#2b8a9c','#b794f4','#7f5af0','#68d391','#2f855a','#f687b3','#d53f8c','#63b3ed','#3182ce','#ed8936','#ffffff'];
let snakes=[],food=[],clients=new Set(),nid=1,rk=[],raio=RMAX,fase='jogo',t0=Date.now(),tFim=0,mural=[];
let mortesH=0,alvoR=RMAX,lider=null;const elim=new Set();
try{mural=JSON.parse(fs.readFileSync(path.join(process.env.DATA_DIR||__dirname,'mural.json'),'utf8'))}catch(e){}

const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=n=>Math.floor(Math.random()*n);
const rad=s=>Math.min(24,7+Math.sqrt(s.mass)*.95);
const nseg=s=>Math.min(320,10+Math.floor(s.mass*.8));
function adiff(a,b){let d=a-b;while(d>Math.PI)d-=6.2832;while(d<-Math.PI)d+=6.2832;return d}
const hexOk=v=>typeof v=='string'&&/^#[0-9a-f]{6}$/i.test(v);
const lim=(v,n)=>Math.max(0,Math.min(n,v|0));
function perfilOk(m){const k=[lim(m.p,3),hexOk(m.c1)?m.c1:'#ff6b5a',hexOk(m.c2)?m.c2:'#f2b950'];for(const s of Ac.SLOTS)k[s.k]=lim(m[s.id],Ac.N[s.id]-1);return k}
const PBOT={pe:.7,ht:.8,fa:.7,pc:.3,cs:.3};
function kitBot(){const k=[ri(4),CORES[ri(CORES.length)],CORES[ri(CORES.length)]];for(const s of Ac.SLOTS)k[s.k]=Math.random()<PBOT[s.id]?1+ri(Ac.N[s.id]-1):0;return k}

function addFood(){
  const p=rnd(0,6.2832),d=Math.sqrt(Math.random())*(raio-70),v=rnd(1,2.2);
  food.push({x:Math.cos(p)*d,y:Math.sin(p)*d,v:v,r:2.5+v*1.8,ci:ri(8)});
}
function nasce(bot,nome,k){
  const L=Math.max(80,raio-(bot?300:250)),p=rnd(0,6.2832),d=Math.sqrt(Math.random())*L,x=Math.cos(p)*d,y=Math.sin(p)*d,a=rnd(0,6.2832);
  const s={id:nid++,bot:bot,nome:nome,x:x,y:y,a:a,ta:a,wt:a,mass:bot?rnd(10,45):10,seg:[],boost:false,vivo:true,k:k||kitBot(),ai:0,drop:0,resp:0,c:null,agr:rnd(.35,1),alvo:0,fd:null,nasc:Date.now()};
  for(let i=0;i<nseg(s);i++)s.seg.push({x:x-Math.cos(a)*i*5,y:y-Math.sin(a)*i*5});
  return s;
}
function mover(s,dt){
  const r=rad(s),sp=r*.62,max=.22*dt/(1+r/60);
  s.a+=Math.max(-max,Math.min(max,adiff(s.ta,s.a)));
  const b=s.boost&&s.mass>11,v=(b?4.6:2.6)*dt;
  if(b){
    s.mass-=.045*dt;s.drop+=dt;
    if(s.drop>9){s.drop=0;const t=s.seg[s.seg.length-1];food.push({x:t.x,y:t.y,v:.5,r:3.2,ci:ri(8)})}
  }
  s.x+=Math.cos(s.a)*v;s.y+=Math.sin(s.a)*v;
  s.seg[0].x=s.x;s.seg[0].y=s.y;
  const n=nseg(s);
  while(s.seg.length<n){const l=s.seg[s.seg.length-1];s.seg.push({x:l.x,y:l.y})}
  while(s.seg.length>n)s.seg.pop();
  for(let i=1;i<n;i++){
    const p=s.seg[i-1],q=s.seg[i],dx=p.x-q.x,dy=p.y-q.y,d=Math.hypot(dx,dy);
    if(d>sp){const k=(d-sp)/d;q.x+=dx*k;q.y+=dy*k}
  }
}
// IA dos bots: zona, perigo, fuga, caça (corta a frente da vítima) e comida
function ia(s){
  const d=Math.hypot(s.x,s.y),r=rad(s);
  if(d>raio-230-r*2){s.ta=Math.atan2(-s.y,-s.x)+rnd(-.25,.25);s.boost=d>raio-60&&s.mass>14;return}
  const look=75+r*3.5;let perigo=0,fugir=null;
  for(const B of snakes){
    if(B===s||!B.vivo)continue;
    const dh=Math.hypot(B.x-s.x,B.y-s.y);
    if(dh<320&&B.mass>s.mass*1.3&&(!fugir||dh<fugir.dh))fugir={x:B.x,y:B.y,dh:dh};
    for(let j=(B.id===s.alvo?6:0);j<B.seg.length;j+=2){
      const dx=B.seg[j].x-s.x,dy=B.seg[j].y-s.y;
      if(dx*dx+dy*dy<look*look){
        const rel=adiff(Math.atan2(dy,dx),s.a);
        if(Math.abs(rel)<1){perigo=rel>=0?-1:1;break}
      }
    }
    if(perigo)break;
  }
  if(perigo){s.ta=s.a+perigo*1.7;s.boost=false;return}
  if(fugir){s.ta=Math.atan2(s.y-fugir.y,s.x-fugir.x);s.boost=s.mass>20&&fugir.dh<200;return}
  let al=null;
  if(s.alvo){al=snakes.find(x=>x.id===s.alvo&&x.vivo);if(al&&Math.hypot(al.x-s.x,al.y-s.y)>1100)al=null;if(!al)s.alvo=0}
  if(--s.ai<=0){
    s.ai=10+Math.random()*10;
    if(!al&&Math.random()<s.agr){
      let best=0;
      for(const B of snakes){
        if(B===s||!B.vivo||B.mass>s.mass*1.6)continue;
        const dh=Math.hypot(B.x-s.x,B.y-s.y);if(dh>900)continue;
        const sc=(B.bot?1:1.5)*(1-dh/900)+(B.mass<s.mass?.3:0);
        if(sc>best){best=sc;al=B}
      }
      s.alvo=al?al.id:0;
    }
    let bd=0;s.fd=null;
    for(const f of food){
      const dx=f.x-s.x,dy=f.y-s.y,dd=dx*dx+dy*dy;if(dd>640000)continue;
      const sc=f.v/(40+Math.sqrt(dd));if(sc>bd){bd=sc;s.fd=f}
    }
    if(!s.fd)s.wt=s.a+rnd(-1,1);
  }
  if(al){
    const dx=al.x-s.x,dy=al.y-s.y,dh=Math.hypot(dx,dy),lead=Math.min(dh*.8,260)+60;
    let px=al.x+Math.cos(al.a)*lead,py=al.y+Math.sin(al.a)*lead;
    const pd=Math.hypot(px,py);if(pd>raio-150){px*=(raio-150)/pd;py*=(raio-150)/pd}
    s.ta=Math.atan2(py-s.y,px-s.x);
    if(dh<90&&Math.abs(adiff(Math.atan2(dy,dx),s.a))<.5)s.ta=s.a+.9;
    s.boost=s.mass>18&&dh<520&&dh>110;return;
  }
  s.boost=false;
  s.ta=s.fd?Math.atan2(s.fd.y-s.y,s.fd.x-s.x):s.wt;
}
function morrer(s,nc){
  if(!s.vivo)return;
  s.vivo=false;
  const n=s.seg.length,v=Math.max(1,s.mass*.6/(n/2));
  for(let i=0;i<n;i+=2)food.push({x:s.seg[i].x+rnd(-6,6),y:s.seg[i].y+rnd(-6,6),v:v,r:Math.min(9,2.5+v*1.8),ci:ri(8)});
  s.resp=240;
  if(!s.bot&&fase=='jogo'&&!nc)mortesH++;
  if(s.c){s.c.eliminado=true;if(s.c.tok)elim.add(s.c.tok);enviar(s.c,JSON.stringify({t:'d',m:Math.floor(s.mass),tv:Math.round((Date.now()-s.nasc)/1000)}))}
}
function upd(dt){
  for(let i=0;i<snakes.length;i++){
    const s=snakes[i];
    if(!s.vivo){if(s.bot&&--s.resp<=0)snakes[i]=nasce(true,s.nome);continue}
    if(s.bot)ia(s);
    mover(s,dt);
    const rr=rad(s)+14;
    for(let j=food.length-1;j>=0;j--){
      const f=food[j],dx=f.x-s.x,dy=f.y-s.y,l=rr+f.r;
      if(dx*dx+dy*dy<l*l){s.mass+=f.v;food[j]=food[food.length-1];food.pop()}
    }
  }
  const mortos=[];
  for(const A of snakes){
    if(!A.vivo)continue;
    if(Math.hypot(A.x,A.y)>raio){mortos.push(A);continue}
    let hit=false;
    for(const B of snakes){
      if(B===A||!B.vivo||hit)continue;
      const l=(rad(A)+rad(B))*.8,l2=l*l;
      for(const q of B.seg){const dx=q.x-A.x,dy=q.y-A.y;if(dx*dx+dy*dy<l2){hit=true;break}}
    }
    if(hit)mortos.push(A);
  }
  mortos.forEach(morrer);
  const nf=Math.max(150,Math.floor(NF*raio*raio/(RMAX*RMAX)));
  while(food.length<nf)addFood();
}
function encerrar(){
  fase='fim';tFim=Date.now()+PAUSA*1000;
  const top=snakes.filter(s=>s.vivo).sort((a,b)=>b.mass-a.mass).slice(0,3),w=top[0];
  if(w){
    mural.unshift({n:w.nome,m:Math.floor(w.mass),k:w.k,d:new Date().toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})});
    mural=mural.slice(0,8);
    try{fs.writeFileSync(path.join(process.env.DATA_DIR||__dirname,'mural.json'),JSON.stringify(mural))}catch(e){}
  }
  const msg=JSON.stringify({t:'r',pod:top.map(s=>({n:s.nome,m:Math.floor(s.mass),k:s.k})),mural:mural,seg:PAUSA});
  for(const c of clients)enviar(c,msg);
}
function novaRodada(){
  fase='jogo';t0=Date.now();raio=RMAX;alvoR=RMAX;mortesH=0;elim.clear();food=[];snakes=[];
  for(let i=0;i<NB;i++)snakes.push(nasce(true,NOMES[i%NOMES.length]));
  while(food.length<NF)addFood();
  for(const c of clients){
    c.snake=null;c.eliminado=false;enviar(c,JSON.stringify({t:'n'}));
    if(c.perfil){c.snake=nasce(false,c.perfil.n,c.perfil.k);c.snake.c=c;snakes.push(c.snake);enviar(c,JSON.stringify({t:'ok'}))}
  }
}

function enviar(c,str){
  if(!c.sock.writable||c.sock.writableLength>300000)return;
  const p=Buffer.from(str),n=p.length;let h;
  if(n<126)h=Buffer.from([0x81,n]);
  else if(n<65536){h=Buffer.alloc(4);h[0]=0x81;h[1]=126;h.writeUInt16BE(n,2)}
  else{h=Buffer.alloc(10);h[0]=0x81;h[1]=127;h.writeBigUInt64BE(BigInt(n),2)}
  c.sock.write(Buffer.concat([h,p]));
}
function tratar(c,txt){
  let m;try{m=JSON.parse(txt)}catch(e){return}
  if(m.t=='j'){
    if(c.snake&&c.snake.vivo)return;
    const nome=String(m.n||'Você').replace(/[<>&"']/g,'').trim().slice(0,12)||'Você';
    c.perfil={n:nome,k:perfilOk(m)};
    if(typeof m.id=='string'&&/^[\w-]{6,40}$/.test(m.id))c.tok=m.id;
    const novo=!c.eliminado&&c.tok&&elim.has(c.tok);
    if(novo)c.eliminado=true;
    if(c.eliminado){if(novo)enviar(c,JSON.stringify({t:'d',m:0,tv:0,w:1}));return}
    if(fase!='jogo')return;
    c.snake=nasce(false,nome,c.perfil.k);c.snake.c=c;snakes.push(c.snake);
    enviar(c,JSON.stringify({t:'ok'}));
  }else if(m.t=='i'&&c.snake&&c.snake.vivo){
    if(typeof m.a=='number'&&isFinite(m.a))c.snake.ta=m.a;
    c.snake.boost=!!m.b;
  }
}
function lerFrames(c){
  for(;;){
    const b=c.buf;if(b.length<2)return;
    const op=b[0]&15;let len=b[1]&127,off=2;
    if(len==126){if(b.length<4)return;len=b.readUInt16BE(2);off=4}
    else if(len==127){c.sock.destroy();return}
    const masked=b[1]&128,mk=masked?4:0;
    if(b.length<off+mk+len)return;
    const p=Buffer.from(b.subarray(off+mk,off+mk+len));
    if(masked){const m=b.subarray(off,off+4);for(let i=0;i<p.length;i++)p[i]^=m[i&3]}
    c.buf=b.subarray(off+mk+len);
    if(op==8){c.sock.end();return}
    if(op==1)tratar(c,p.toString());
  }
}
function sai(c){
  if(!clients.has(c))return;
  clients.delete(c);
  if(c.snake&&c.snake.vivo){c.snake.c=null;if(c.tok&&fase=='jogo')elim.add(c.tok);morrer(c.snake,true)}
}

const srv=http.createServer((req,res)=>{
  if(req.url=='/'||req.url.startsWith('/?')||req.url=='/index.html'){
    fs.readFile(path.join(__dirname,'index.html'),(e,d)=>{
      if(e){res.writeHead(500);res.end('index.html nao encontrado');return}
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(d);
    });
  }else if(req.url.split('?')[0]=='/acessorios.js'){
    fs.readFile(path.join(__dirname,'acessorios.js'),(e,d)=>{
      if(e){res.writeHead(500);res.end();return}
      res.writeHead(200,{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-cache'});res.end(d);
    });
  }else if(['/manifest.webmanifest','/service-worker.js','/icons/icon-192.png','/icons/icon-512.png'].includes(req.url.split('?')[0])){
    const rel=decodeURIComponent(req.url.split('?')[0]).replace(/^\//,'');
    const file=path.join(__dirname,rel);
    if(!file.startsWith(__dirname+path.sep)){res.writeHead(403);res.end();return}
    const types={'.webmanifest':'application/manifest+json','.js':'application/javascript','.png':'image/png'};
    fs.readFile(file,(e,d)=>{if(e){res.writeHead(404);res.end();return}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':rel==='service-worker.js'?'no-cache':'public, max-age=3600'});res.end(d)});
  }else{res.writeHead(404);res.end()}
});
srv.on('upgrade',(req,sock)=>{
  const key=req.headers['sec-websocket-key'];
  if(!key){sock.destroy();return}
  const acc=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+acc+'\r\n\r\n');
  sock.setNoDelay(true);
  const c={sock:sock,snake:null,perfil:null,buf:Buffer.alloc(0)};
  clients.add(c);
  enviar(c,JSON.stringify({t:'m',mural:mural}));
  sock.on('data',d=>{c.buf=Buffer.concat([c.buf,d]);lerFrames(c)});
  sock.on('close',()=>sai(c));
  sock.on('error',()=>sai(c));
});

for(let i=0;i<NB;i++)snakes.push(nasce(true,NOMES[i%NOMES.length]));
while(food.length<NF)addFood();

let ult=Date.now(),tk=0;
setInterval(()=>{
  const n=Date.now(),dt=Math.min(2.5,(n-ult)/16.667);ult=n;tk++;
  if(fase=='jogo'){
    const t=(n-t0)/1000;
    const rT=RMAX-(RMAX-RMIN)*Math.max(0,Math.min(1,(t-INI)/(DUR-INI)));
    alvoR=Math.max(RMIN,Math.min(rT,RMAX-mortesH*PASSO));
    if(raio>alvoR)raio=Math.max(alvoR,raio-VELF*dt);
    upd(dt);
    snakes=snakes.filter(s=>s.bot||s.vivo);
    if(tk%30==0)food=food.filter(f=>Math.hypot(f.x,f.y)<raio-20);
    if(t>=DUR)encerrar();
  }else if(n>=tFim)novaRodada();
  if(tk%15==0){const vv=snakes.filter(s=>s.vivo).sort((a,b)=>b.mass-a.mass);lider=vv[0]||null;rk=vv.slice(0,8).map(s=>[s.nome,Math.floor(s.mass),s.id])}
  for(const s of snakes){
    if(!s.vivo)continue;
    const a=new Array(s.seg.length*2);
    for(let i=0;i<s.seg.length;i++){a[i*2]=Math.round(s.seg[i].x);a[i*2+1]=Math.round(s.seg[i].y)}
    s.out={i:s.id,n:s.nome,k:s.k,m:Math.floor(s.mass),a:Math.round(s.a*100)/100,b:(s.boost&&s.mass>11)?1:0,s:a};
  }
  const tr=fase=='jogo'?Math.max(0,Math.ceil(DUR-(n-t0)/1000)):0;
  for(const c of clients){
    const me=(c.snake&&c.snake.vivo)?c.snake:null,foco=me||(lider&&lider.vivo?lider:(snakes.find(s=>s.vivo)||snakes[0]));
    const fx=foco.x,fy=foco.y,sn=[],f=[];
    for(const s of snakes){
      if(!s.vivo)continue;
      let vis=false;
      for(let i=0;i<s.seg.length;i+=3){
        if(Math.abs(s.seg[i].x-fx)<VIEW&&Math.abs(s.seg[i].y-fy)<VIEW){vis=true;break}
      }
      if(vis)sn.push(s.out);
    }
    for(const o of food){
      if(Math.abs(o.x-fx)<VIEW&&Math.abs(o.y-fy)<VIEW)f.push(Math.round(o.x),Math.round(o.y),Math.round(o.r),o.ci);
    }
    enviar(c,JSON.stringify({t:'s',me:me?me.id:-1,x:Math.round(fx),y:Math.round(fy),fm:Math.floor(foco.mass),tr:tr,ra:Math.round(raio),al:Math.round(alvoR),mt:mortesH,sn:sn,f:f,rk:rk}));
  }
},16);

srv.listen(PORT,'0.0.0.0',()=>{
  console.log('\n=== Cobras da Lagoa (multiplayer) ===');
  console.log('No seu PC abra:   http://localhost:'+PORT);
  console.log('No celular (mesmo Wi-Fi) abra:');
  for(const l of Object.values(os.networkInterfaces()))for(const i of l)
    if((i.family==='IPv4'||i.family===4)&&!i.internal)console.log('   http://'+i.address+':'+PORT);
  console.log('\nPartida de '+Math.round(DUR/60)+' min. Deixe esta janela aberta durante o jogo. Ctrl+C para parar.\n');
});
