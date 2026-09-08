const DEFAULT_DATA={
  settings:{brandName:"Jungfru Maria Kyrkan",brandSub:"Livestreamhjälp",heroTitle:"Vad behöver du hjälp med?",heroText:"Välj det du vill göra. Guiden visar det viktigaste steg för steg."},
  pages:{
    start:{group:"main",icon:"▶",kicker:"Startguide",title:"Starta livestream",summary:"Facebook, YouTube, bild, ljud, inspelning och stream.",intro:"Följ stegen i ordning. Kontrollera alltid bild och ljud innan själva sändningen startas.",steps:[{title:"Öppna Facebook Live Producer",text:"Använd Facebook-knappen på Stream Deck och kontrollera att rätt kyrksida och sändning är vald."},{title:"Öppna YouTube Studio",text:"Använd YouTube-knappen på Stream Deck och kontrollera att rätt livestream är vald."},{title:"Kontrollera bild",text:"Se att TriCaster visar en fungerande kamerabild och att Program/Preview ser normalt ut."},{title:"Kontrollera ljud",text:"Ljudmätarna ska röra sig och huvudljudet ska inte vara mutat."},{title:"Visa Mässan börjar snart",text:"Lägg ut startbilden innan gudstjänsten börjar."},{title:"Starta inspelning",text:"Starta RECORD i TriCaster och kontrollera att inspelningen är aktiv."},{title:"Starta stream",text:"Starta sändningen och verifiera att både Facebook och YouTube får inkommande signal."}],note:"Starta inte på chans. Om bild eller ljud saknas, använd felsökningssidorna först.",noteType:"warn"},
    stop:{group:"main",icon:"■",kicker:"Avslutningsguide",title:"Avsluta livestream",summary:"Outro, stoppa stream, stoppa inspelning och kontroll.",intro:"Avsluta i rätt ordning så tittarna får ett snyggt slut och inspelningen sparas.",steps:[{title:"Visa outro / tackbild",text:"Lägg ut avslutningsbilden när mässan är helt slut."},{title:"Vänta 5–10 sekunder",text:"Låt tittarna hinna se avslutningen."},{title:"Stoppa stream",text:"Stoppa själva livestreamen i TriCaster."},{title:"Stoppa inspelningen",text:"Stoppa RECORD när du är säker på att allt är färdigt."},{title:"Kontrollera Facebook och YouTube",text:"Verifiera att båda plattformarna visar att sändningen är avslutad."}],note:"STOP STREAM bör inte ligga bredvid START STREAM på Stream Deck.",noteType:"danger"},
    video:{group:"trouble",icon:"▣",kicker:"Bild",title:"Ingen bild",summary:"Svart bild, fel kamera eller ingen signal.",intro:"Börja med det enklaste och ändra inte flera saker samtidigt.",steps:[{title:"Kontrollera Program",text:"Se om rätt källa ligger i Program på TriCaster."},{title:"Testa en annan kamera",text:"Välj en kamera som du vet brukar fungera."},{title:"Kontrollera kamerans signal",text:"Se att kameran är på och att TriCaster får signal från den."},{title:"Använd bred altarbild",text:"Om du är osäker, använd en stabil bred bild tills felet är löst."}],note:"Om TriCaster har bild men Facebook/YouTube är svart, gå vidare till Stream / internet.",noteType:"info"},
    audio:{group:"trouble",icon:"♪",kicker:"Ljud",title:"Inget ljud",summary:"Mute, ljudmätare eller fel ljudkälla.",intro:"Titta på ljudmätarna innan du börjar ändra nivåer.",steps:[{title:"Rör sig ljudmätarna?",text:"Om ja finns signal i TriCaster. Om nej ligger felet tidigare i ljudkedjan."},{title:"Kontrollera mute",text:"Se att huvudljudet och relevant ingång inte är mutade."},{title:"Kontrollera rätt ljudkälla",text:"Verifiera att den ingång ni normalt använder fortfarande är vald."},{title:"Lyssna i hörlurar",text:"Om möjligt, verifiera ljudet lokalt innan du ändrar fler inställningar."}],note:"Ändra inte gain och nivåer i panik innan du vet var signalen försvinner.",noteType:"warn"},
    camera:{group:"trouble",icon:"●",kicker:"PTZ / AW-RP50",title:"Kameraproblem",summary:"PTZ-kamera reagerar inte eller står fel.",intro:"AW-RP50 används för PTZ-styrning. TriCaster-panelen används för bildväxling.",steps:[{title:"Kontrollera vald kamera",text:"På AW-RP50: kontrollera att rätt kamera är vald innan du styr."},{title:"Testa en känd preset",text:"Om preset fungerar vet du att kontakten med kameran finns."},{title:"Använd annan kamera tillfälligt",text:"Håll sändningen stabil med en fungerande kamera medan problemet felsöks."}],note:"Om du behöver en säker bild nu: gå till en bred altarbild och låt den ligga stabilt.",noteType:"good"},
    stream:{group:"trouble",icon:"↗",kicker:"Nätverk & plattformar",title:"Stream / internet",summary:"Facebook eller YouTube får ingen signal.",intro:"Använd den här guiden om plattformarna visar offline, ingen signal eller väntar på stream.",steps:[{title:"Kontrollera TriCaster",text:"Är streamen verkligen startad?"},{title:"Kontrollera internet",text:"Öppna en vanlig webbsida på datorn. Om den inte laddar är problemet sannolikt nätverket."},{title:"Kontrollera Facebook",text:"Se om Live Producer visar inkommande signal eller ett felmeddelande."},{title:"Kontrollera YouTube",text:"Se om YouTube Studio visar inkommande signal eller varning."}],note:"Program-bild i TriCaster betyder inte automatiskt att livestreamen är aktiv.",noteType:"info"},
    graphics:{group:"other",icon:"T",kicker:"Grafik",title:"Grafik & overlays",summary:"Logo, namn, lower thirds och titlar.",intro:"Använd den här sidan om grafik ligger kvar, saknas eller behöver återställas.",steps:[{title:"Ta bort all grafik",text:"Återgå till en ren kamerabild utan titlar, logo eller overlay som täcker bilden."},{title:"Lower third / namn",text:"Visa namngrafiken när personen börjar tala och ta bort den efter några sekunder."},{title:"Logo",text:"Ha en tydlig funktion för LOGO PÅ och LOGO AV."}],note:"För en ny operatör är GRAFIK AV tydligare än ALL GFX OFF.",noteType:"info"},
    media:{group:"other",icon:"▶︎",kicker:"Media",title:"Media & video",summary:"Starting Soon, intro, outro och DDR.",intro:"Förberedda bilder och videoklipp ska vara enkla att starta och stoppa.",steps:[{title:"Mässan börjar snart",text:"Visa den före mässan när streamen är ansluten men gudstjänsten inte har börjat."},{title:"Intro / video",text:"Kontrollera att rätt klipp är laddat och att medieljudet ligger på rätt nivå."},{title:"Stoppa media",text:"Om ett klipp fastnar: gå först till en säker kamerabild och stoppa sedan mediet."}],note:"Gå till en säker kamerabild innan du felsöker ett klipp som ligger i Program.",noteType:"warn"},
    equipment:{group:"other",icon:"⚙",kicker:"Översikt",title:"Utrustningen",summary:"Vad TriCaster, AW-RP50 och Stream Deck används till.",intro:"En enkel ansvarsfördelning för en ny operatör.",steps:[{title:"TriCaster 8000",text:"Program/Preview, bildväxling, grafik, media, inspelning och streaming."},{title:"TriCaster kontrollpanel",text:"Fysisk bildväxling, Preview/Program och transitions."},{title:"Panasonic AW-RP50",text:"PTZ-kameror, presets, pan/tilt/zoom och fokus."},{title:"Stream Deck XL",text:"Genvägar, webbsidor, hjälpguide och förenklade arbetsflöden."}],note:"Stream Deck ska förenkla arbetsflödet, inte duplicera alla fysiska kontroller.",noteType:"good"},
    contact:{group:"other",icon:"☎",kicker:"Hjälp",title:"Kontakt",summary:"Om problemet inte går att lösa.",intro:"Här kan du lägga in kontaktuppgifter och instruktioner för när någon behöver hjälp.",steps:[{title:"Beskriv problemet exakt",text:"Säg till exempel Kamera 2 syns i Preview men inte i Program i stället för bara kameran funkar inte."},{title:"Skriv vem du kontaktar",text:"Lägg senare in namn, telefonnummer eller annan kontaktväg här."}],note:"Ju mer exakt problemet beskrivs, desto snabbare går det att hjälpa till.",noteType:"info"}
  }
};

let data=JSON.parse(JSON.stringify(DEFAULT_DATA));
let currentPage=null,admin=false,editingPageKey=null;
const $=id=>document.getElementById(id);

function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function toast(msg){const t=$("toast");if(!t)return;t.textContent=msg;t.classList.remove("hidden");clearTimeout(window._toast);window._toast=setTimeout(()=>t.classList.add("hidden"),2300)}
function openModal(id){$(id)?.classList.remove("hidden")}
function closeModal(id){$(id)?.classList.add("hidden")}

function renderHeader(){
  if(!data.settings||typeof data.settings!=="object")data.settings={};
  $("brandName").textContent=data.settings.brandName||"Jungfru Maria Kyrkan";
  $("brandSub").textContent=data.settings.brandSub||"Livestreamhjälp";
  $("heroTitle").textContent=data.settings.heroTitle||"Vad behöver du hjälp med?";
  $("heroText").textContent=data.settings.heroText||"";
}
function pageCard(k,p,main=false){return `<div class="${main?'card':'quickitem'}" data-page="${esc(k)}">${main?`<div class="ico">${esc(p.icon||"•")}</div><h2>${esc(p.title||"Namnlös guide")}</h2><p>${esc(p.summary||"")}</p><span class="more">Öppna guide →</span>`:`<div><strong>${esc(p.icon||"•")} ${esc(p.title||"Namnlös guide")}</strong><small>${esc(p.summary||"")}</small></div><div class="arr">›</div>`}${admin?`<button class="editfab" data-edit="${esc(k)}" type="button">✎</button>`:""}</div>`}
function renderHome(){
  renderHeader();const e=Object.entries(data.pages||{});
  $("mainCards").innerHTML=e.filter(([,p])=>p.group==="main").map(([k,p])=>pageCard(k,p,true)).join("");
  $("troubleCards").innerHTML=e.filter(([,p])=>p.group==="trouble").map(([k,p])=>pageCard(k,p)).join("");
  $("otherCards").innerHTML=e.filter(([,p])=>p.group==="other").map(([k,p])=>pageCard(k,p)).join("");
  $("editSiteBtn").classList.toggle("hidden",!admin);
}
function renderPage(k){
  const p=data.pages?.[k];if(!p)return showHome();currentPage=k;
  $("pageKicker").textContent=p.kicker||"";$("pageTitle").textContent=p.title||"";$("pageIntro").textContent=p.intro||"";
  $("editPageBtn").classList.toggle("hidden",!admin);
  let h='<div class="steps">';(p.steps||[]).forEach((s,i)=>h+=`<div class="step"><div class="num">${i+1}</div><div><h3>${esc(s.title||"")}</h3><p>${esc(s.text||"")}</p></div></div>`);h+='</div>';
  if(p.note){const type=["info","good","warn","danger"].includes(p.noteType)?p.noteType:"info";h+=`<div class="callout ${type}"><strong>Viktigt</strong><p>${esc(p.note)}</p></div>`}$("pageBody").innerHTML=h;
}
function showHome(){currentPage=null;$("homeView").classList.remove("hidden");$("pageView").classList.add("hidden");$("adminView").classList.add("hidden");history.replaceState(null,"","#home");window.scrollTo(0,0)}
function showPage(k){renderPage(k);$("homeView").classList.add("hidden");$("adminView").classList.add("hidden");$("pageView").classList.remove("hidden");history.replaceState(null,"","#"+encodeURIComponent(k));window.scrollTo(0,0)}
function showAdmin(){$("homeView").classList.add("hidden");$("pageView").classList.add("hidden");$("adminView").classList.remove("hidden");updateAdminView();history.replaceState(null,"","#admin");window.scrollTo(0,0)}
function setAdmin(v){admin=!!v;$("adminBar").classList.toggle("hidden",!admin);$("adminDashboardBtn").classList.toggle("hidden",!admin);$("logoutBtn").classList.toggle("hidden",!admin);$("loginBtn").classList.toggle("hidden",admin);renderHome();if(currentPage)renderPage(currentPage)}

async function saveContent(){throw new Error("Supabase har inte startat ännu. Försök igen om ett ögonblick.")}
function updateAdminView(){
  $("adminModeText").textContent="Supabase Auth";
  $("storageModeText").textContent="Supabase + media";
  $("backendModeText").textContent="Ansluten";
  const user=window.LH2?.state?.user;
  $("adminUserText").textContent=user?.email||"–";
}

function openEditSite(){$("editBrandName").value=data.settings?.brandName||"";$("editBrandSub").value=data.settings?.brandSub||"";$("editHeroTitle").value=data.settings?.heroTitle||"";$("editHeroText").value=data.settings?.heroText||"";openModal("editSiteModal")}
function openEditPage(k){editingPageKey=k;const p=data.pages?.[k];if(!p)return;$("editPageIcon").value=p.icon||"";$("editPageKicker").value=p.kicker||"";$("editPageTitle").value=p.title||"";$("editPageSummary").value=p.summary||"";$("editPageIntro").value=p.intro||"";$("editPageNote").value=p.note||"";$("editPageNoteType").value=["info","good","warn","danger"].includes(p.noteType)?p.noteType:"info";renderStepEditor(p.steps||[]);openModal("editPageModal")}
function renderStepEditor(st){$("stepEditor").innerHTML=(st||[]).map((s,i)=>`<div class="stepedit"><div class="stepeditbar"><strong>Steg ${i+1}</strong><button class="btn small danger" data-remove-step="${i}" type="button">Ta bort</button></div><div class="field"><label>Rubrik</label><input class="stepTitle" value="${esc(s.title||"")}"></div><div class="field"><label>Text</label><textarea class="stepText">${esc(s.text||"")}</textarea></div></div>`).join("")}
function collectSteps(){return [...document.querySelectorAll("#stepEditor .stepedit")].map(el=>({title:el.querySelector(".stepTitle")?.value.trim()||"",text:el.querySelector(".stepText")?.value.trim()||""})).filter(s=>s.title||s.text)}

document.addEventListener("click",e=>{
  const p=e.target.closest("[data-page]");if(p&&!e.target.closest("[data-edit]"))showPage(p.dataset.page);
  const ed=e.target.closest("[data-edit]");if(ed){e.stopPropagation();openEditPage(ed.dataset.edit)}
  const cl=e.target.closest("[data-close]");if(cl)closeModal(cl.dataset.close);
  const rm=e.target.closest("[data-remove-step]");if(rm){const st=collectSteps();st.splice(Number(rm.dataset.removeStep),1);renderStepEditor(st)}
});
$("backBtn").onclick=showHome;$("adminBackBtn").onclick=showHome;$("adminDashboardBtn").onclick=()=>{if(admin)showAdmin()};$("editSiteBtn").onclick=openEditSite;$("editPageBtn").onclick=()=>currentPage&&openEditPage(currentPage);$("loginBtn").onclick=()=>openModal("loginModal");
$("logoutBtn").onclick=()=>toast("Inloggningen startar fortfarande. Försök igen om ett ögonblick.");
$("submitLoginBtn").onclick=()=>toast("Inloggningen startar fortfarande. Försök igen om ett ögonblick.");
$("saveSiteBtn").onclick=async()=>{data.settings.brandName=$("editBrandName").value.trim()||data.settings.brandName;data.settings.brandSub=$("editBrandSub").value.trim();data.settings.heroTitle=$("editHeroTitle").value.trim();data.settings.heroText=$("editHeroText").value.trim();renderHome();closeModal("editSiteModal");try{await saveContent()}catch(e){toast(e.message)}};
$("addStepBtn").onclick=()=>{const st=collectSteps();st.push({title:"Nytt steg",text:"Skriv instruktionen här."});renderStepEditor(st)};
$("savePageBtn").onclick=async()=>{const p=data.pages?.[editingPageKey];if(!p)return;p.icon=$("editPageIcon").value.trim();p.kicker=$("editPageKicker").value.trim();p.title=$("editPageTitle").value.trim();p.summary=$("editPageSummary").value.trim();p.intro=$("editPageIntro").value.trim();p.steps=collectSteps();p.note=$("editPageNote").value.trim();p.noteType=$("editPageNoteType").value;renderHome();if(currentPage===editingPageKey)renderPage(currentPage);closeModal("editPageModal");try{await saveContent()}catch(e){toast(e.message)}};
window.addEventListener("hashchange",()=>{const h=decodeURIComponent(location.hash.slice(1));if(h==="admin"&&admin)showAdmin();else if(data.pages?.[h])showPage(h);else showHome()});

renderHome();
const initial=decodeURIComponent(location.hash.slice(1));
if(initial&&data.pages?.[initial])showPage(initial);else showHome();
