(() => {
  const S=window.LH2; if(!S) return;
  const presets={encouragement:{bg:"#12302e",color:"#d7fff1"},plain:{bg:"#102036",color:"#f3f6fb"},info:{bg:"#102b49",color:"#d8eaff"},warning:{bg:"#342812",color:"#ffe1a3"}};
  let dragRef=null,dragAllowed=null,resizeState=null,editingText=null;

  function layout(){
    S.ensureData();
    const cats=new Set((data.categories||[]).map(c=>c.id)), texts=new Set(Object.keys(data.homeTextBlocks||{}));
    const valid=r=>r==="hero"||(typeof r==="string"&&((r.startsWith("cat:")&&cats.has(r.slice(4)))||(r.startsWith("text:")&&texts.has(r.slice(5)))));
    let out=Array.isArray(data.homeLayoutV2)?data.homeLayoutV2.filter(valid):[];
    const seen=new Set(); out=out.filter(r=>!seen.has(r)&&seen.add(r));
    if(!out.length) out=["hero",...(Array.isArray(data.homeLayout)?data.homeLayout.filter(valid):[])];
    if(!out.includes("hero")) out.unshift("hero");
    (data.categories||[]).forEach(c=>{const r=`cat:${c.id}`;if(!out.includes(r))out.push(r)});
    Object.keys(data.homeTextBlocks||{}).forEach(id=>{const r=`text:${id}`;if(!out.includes(r))out.push(r)});
    data.homeLayoutV2=out; data.homeLayout=out.filter(r=>r!=="hero"); return out;
  }

  function styleBlock(node,b){
    const p=presets[b.style]||presets.plain;
    const width=Math.max(30,Math.min(100,Number(b.widthPct)||100)), h=Math.max(0,Math.min(700,Number(b.minHeight)||0));
    node.style.width=`${width}%`; node.style.maxWidth="100%"; node.style.minHeight=h?`${h}px`:"";
    node.style.background=b.bg||p.bg; node.style.color=b.color||p.color;
    node.style.textAlign=["left","center","right"].includes(b.textAlign)?b.textAlign:"left";
    node.style.fontFamily=b.fontFamily==="serif"?"Georgia,serif":b.fontFamily==="mono"?"ui-monospace,SFMono-Regular,Consolas,monospace":"inherit";
    node.style.fontStyle=b.italic?"italic":"normal"; node.style.fontWeight=b.bold?"700":"inherit";
    const box=["left","center","right"].includes(b.boxAlign)?b.boxAlign:"left";
    node.style.marginLeft=box==="center"||box==="right"?"auto":"0"; node.style.marginRight=box==="center"||box==="left"?"auto":"0";
    const title=node.querySelector("h2"), body=node.querySelector("p");
    if(title){title.style.fontSize=`${Math.max(16,Math.min(64,Number(b.titleSize)||27))}px`;title.style.color=b.color||p.color;}
    if(body){body.style.fontSize=`${Math.max(11,Math.min(32,Number(b.bodySize)||15))}px`;body.style.color=b.color||p.color;}
  }

  function makeItem(node,ref){
    if(!node)return; node.classList.add("v2-layout-item"); node.dataset.v2Ref=ref;
    if(!admin||ref==="hero"){node.removeAttribute("draggable");return}
    node.draggable=true;
    let controls=node.querySelector(ref.startsWith("cat:")?".category-admin-controls":".home-text-controls"); if(!controls)return;
    controls.querySelectorAll("[data-home-up],[data-home-down],[data-cat-up],[data-cat-down]").forEach(x=>x.remove());
    if(!controls.querySelector(".v2-drag-handle")){const h=document.createElement("button");h.className="btn small v2-drag-handle";h.type="button";h.textContent="⋮⋮ Flytta";controls.prepend(h)}
    if(ref.startsWith("text:")){
      const e=controls.querySelector("[data-edit-home-text]"); if(e){e.dataset.v2EditText=e.dataset.editHomeText;e.removeAttribute("data-edit-home-text")}
      node.classList.add("v2-resizable"); styleBlock(node,data.homeTextBlocks[ref.slice(5)]||{});
    }
    if(ref.startsWith("cat:")){
      const a=controls.querySelector("[data-add-guide]"); if(a){a.dataset.v2AddGuide=a.dataset.addGuide;a.removeAttribute("data-add-guide")}
    }
  }

  function homeHook(){
    const home=document.getElementById("homeView"), holder=document.getElementById("dynamicCategories"); if(!home||!holder)return;
    const toolbar=holder.querySelector(".front-admin-toolbar");
    if(toolbar){
      const old=toolbar.querySelector("#addHomeTextBtn"); if(old)old.id="v2AddTextBtn";
      const d=toolbar.querySelector("span"); if(d)d.textContent="Dra textblock och kategorier till rätt plats. Textblock kan också ändra storlek och utseende.";
    }
    let box=document.getElementById("v2HomeLayout"); if(!box){box=document.createElement("div");box.id="v2HomeLayout";holder.insertAdjacentElement("afterend",box)}
    [...box.querySelectorAll(".front-category,.home-text-block")].forEach(n=>n.remove());
    const hero=home.querySelector(".hero"), cats=new Map([...holder.querySelectorAll(".front-category[data-category]")].map(n=>[n.dataset.category,n])), texts=new Map([...holder.querySelectorAll(".home-text-block[data-home-text]")].map(n=>[n.dataset.homeText,n]));
    layout().forEach(ref=>{
      const n=ref==="hero"?hero:ref.startsWith("cat:")?cats.get(ref.slice(4)):texts.get(ref.slice(5));
      if(!n)return; box.appendChild(n); makeItem(n,ref);
    });
  }
  S.hooks.home.push(homeHook);

  async function saveLayout(before){try{data.homeLayout=data.homeLayoutV2.filter(r=>r!=="hero");await S.save();renderHome()}catch(e){data.homeLayoutV2=before;data.homeLayout=before.filter(r=>r!=="hero");renderHome();toast(e.message||"Kunde inte flytta sektionen.")}}

  function ensureModal(){
    if(document.getElementById("v2TextModal"))return;
    document.body.insertAdjacentHTML("beforeend",`<div class="modalback hidden" id="v2TextModal"><div class="modal"><div class="modalhead"><h2 id="v2TextTitleHead">Textblock</h2><button class="close" id="v2TextClose" type="button">×</button></div><div class="modalbody">
      <div class="field"><label>Rubrik</label><input id="v2TextTitle" maxlength="140"></div><div class="field"><label>Text <span class="hint">(valfritt)</span></label><textarea id="v2TextBody"></textarea></div>
      <div class="row"><div class="field"><label>Stil</label><select id="v2TextStyle"><option value="encouragement">Uppmuntran</option><option value="plain">Vanlig</option><option value="info">Info</option><option value="warning">Varning</option></select></div><div class="field"><label>Textjustering</label><select id="v2TextAlign"><option value="left">Vänster</option><option value="center">Centrerad</option><option value="right">Höger</option></select></div></div>
      <div class="row"><div class="field"><label>Bakgrund</label><input id="v2TextBg" type="color"></div><div class="field"><label>Textfärg</label><input id="v2TextColor" type="color"></div></div>
      <div class="row"><div class="field"><label>Bredd (%)</label><input id="v2TextWidth" type="number" min="30" max="100"></div><div class="field"><label>Minsta höjd (px)</label><input id="v2TextHeight" type="number" min="0" max="700" step="10"></div></div>
      <div class="row"><div class="field"><label>Rubrikstorlek</label><input id="v2TitleSize" type="number" min="16" max="64"></div><div class="field"><label>Textstorlek</label><input id="v2BodySize" type="number" min="11" max="32"></div></div>
      <div class="row"><div class="field"><label>Blockets placering</label><select id="v2BoxAlign"><option value="left">Vänster</option><option value="center">Centrerad</option><option value="right">Höger</option></select></div><div class="field"><label>Typsnitt</label><select id="v2Font"><option value="system">System</option><option value="serif">Serif</option><option value="mono">Monospace</option></select></div></div>
      <div class="v2-checks"><label><input id="v2Bold" type="checkbox"> Fet</label><label><input id="v2Italic" type="checkbox"> Kursiv</label></div><div class="v2-note">Du kan även dra i nedre högra hörnet på blocket för att ändra bredd och höjd. På mobil blir blocket automatiskt fullbrett.</div>
      </div><div class="modalfooter"><button class="btn danger hidden" id="v2TextDelete" type="button">Ta bort</button><div style="flex:1"></div><button class="btn" id="v2TextCancel" type="button">Avbryt</button><button class="btn primary" id="v2TextSave" type="button">Spara</button></div></div></div>`);
    const m=document.getElementById("v2TextModal"); m.addEventListener("input",()=>m.dataset.dirty="1");m.addEventListener("change",()=>m.dataset.dirty="1");
    const close=()=>{if(m.dataset.dirty==="1"&&!confirm("Du har osparade ändringar. Vill du verkligen avbryta?"))return;m.dataset.dirty="0";m.classList.add("hidden")};
    document.getElementById("v2TextClose").onclick=close;document.getElementById("v2TextCancel").onclick=close;
    document.getElementById("v2TextStyle").onchange=()=>{const p=presets[document.getElementById("v2TextStyle").value]||presets.plain;document.getElementById("v2TextBg").value=p.bg;document.getElementById("v2TextColor").value=p.color};
    document.getElementById("v2TextSave").onclick=async()=>{
      const title=document.getElementById("v2TextTitle").value.trim(),text=document.getElementById("v2TextBody").value.trim();if(!title&&!text)return toast("Skriv en rubrik eller text.");
      const before=S.clone(data);try{
        const id=editingText||S.uid("text"); data.homeTextBlocks[id]={title,text,style:document.getElementById("v2TextStyle").value,bg:document.getElementById("v2TextBg").value,color:document.getElementById("v2TextColor").value,widthPct:Number(document.getElementById("v2TextWidth").value)||100,minHeight:Number(document.getElementById("v2TextHeight").value)||0,titleSize:Number(document.getElementById("v2TitleSize").value)||27,bodySize:Number(document.getElementById("v2BodySize").value)||15,textAlign:document.getElementById("v2TextAlign").value,boxAlign:document.getElementById("v2BoxAlign").value,fontFamily:document.getElementById("v2Font").value,bold:document.getElementById("v2Bold").checked,italic:document.getElementById("v2Italic").checked};
        const ref=`text:${id}`;const l=layout();if(!l.includes(ref))l.push(ref);data.homeLayoutV2=l;data.homeLayout=l.filter(r=>r!=="hero");await S.save();m.dataset.dirty="0";m.classList.add("hidden");renderHome();
      }catch(e){data=before;renderHome();toast(e.message||"Kunde inte spara textblocket.")}
    };
    document.getElementById("v2TextDelete").onclick=async()=>{if(!editingText)return;const b=data.homeTextBlocks?.[editingText];if(!b||!confirm(`Ta bort textblocket${b.title?` “${b.title}”`:""}? Det kan återställas via versionshistoriken.`))return;const before=S.clone(data);try{delete data.homeTextBlocks[editingText];data.homeLayout=(data.homeLayout||[]).filter(r=>r!==`text:${editingText}`);data.homeLayoutV2=(data.homeLayoutV2||[]).filter(r=>r!==`text:${editingText}`);await S.save();m.dataset.dirty="0";m.classList.add("hidden");renderHome()}catch(e){data=before;renderHome();toast(e.message||"Kunde inte ta bort textblocket.")}};
  }

  function openText(id=null){
    ensureModal();editingText=id;const b=id?data.homeTextBlocks?.[id]:null,p=presets[b?.style||"encouragement"]||presets.encouragement;
    document.getElementById("v2TextTitleHead").textContent=b?"Redigera textblock":"Nytt textblock";document.getElementById("v2TextTitle").value=b?.title||"";document.getElementById("v2TextBody").value=b?.text||"";document.getElementById("v2TextStyle").value=b?.style||"encouragement";document.getElementById("v2TextBg").value=b?.bg||p.bg;document.getElementById("v2TextColor").value=b?.color||p.color;document.getElementById("v2TextWidth").value=b?.widthPct||100;document.getElementById("v2TextHeight").value=b?.minHeight||0;document.getElementById("v2TitleSize").value=b?.titleSize||27;document.getElementById("v2BodySize").value=b?.bodySize||15;document.getElementById("v2TextAlign").value=b?.textAlign||"left";document.getElementById("v2BoxAlign").value=b?.boxAlign||"left";document.getElementById("v2Font").value=b?.fontFamily||"system";document.getElementById("v2Bold").checked=!!b?.bold;document.getElementById("v2Italic").checked=!!b?.italic;document.getElementById("v2TextDelete").classList.toggle("hidden",!b);const m=document.getElementById("v2TextModal");m.dataset.dirty="0";m.classList.remove("hidden");
  }

  const css=document.createElement("style");css.textContent=`.v2-layout-item{position:relative}.v2-layout-item.v2-dragging{opacity:.45}.v2-layout-item.v2-drop{outline:2px dashed #7c5cff;outline-offset:5px}.v2-drag-handle{cursor:grab!important}.v2-resizable{resize:both;overflow:auto;max-width:100%}.v2-checks{display:flex;gap:18px;margin:5px 0 14px}.v2-checks label{display:flex;align-items:center;gap:7px}.v2-note{padding:11px 12px;border:1px solid #2e4664;border-radius:12px;background:#0a1727;color:#9fb0c5;font-size:13px;line-height:1.5}@media(max-width:720px){.v2-resizable{resize:none!important;width:100%!important;min-height:0!important}.home-text-block.v2-layout-item{margin-left:0!important;margin-right:0!important}}`;document.head.appendChild(css);

  document.addEventListener("pointerdown",e=>{
    const h=e.target.closest(".v2-drag-handle");dragAllowed=h?.closest("[data-v2-ref]")?.dataset.v2Ref||null;
    const b=e.target.closest(".home-text-block.v2-resizable[data-v2-ref]");if(b){const r=b.getBoundingClientRect();if(e.clientX>=r.right-22&&e.clientY>=r.bottom-22)resizeState={ref:b.dataset.v2Ref,old:S.clone(data.homeTextBlocks?.[b.dataset.v2Ref.slice(5)]||{})}}
  },true);
  document.addEventListener("dragstart",e=>{const item=e.target.closest("[data-v2-ref][draggable='true']");if(!item||item.dataset.v2Ref!==dragAllowed){if(item)e.preventDefault();return}dragRef=item.dataset.v2Ref;item.classList.add("v2-dragging");e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",dragRef)});
  document.addEventListener("dragover",e=>{const box=e.target.closest("#v2HomeLayout");if(!box||!dragRef)return;e.preventDefault();box.querySelectorAll(".v2-drop").forEach(n=>n.classList.remove("v2-drop"));const t=e.target.closest(".v2-layout-item");if(t&&t.dataset.v2Ref!==dragRef)t.classList.add("v2-drop")});
  document.addEventListener("drop",async e=>{const box=e.target.closest("#v2HomeLayout");if(!box||!dragRef)return;e.preventDefault();const before=S.clone(layout()),ref=dragRef,target=e.target.closest(".v2-layout-item")?.dataset.v2Ref||null,next=before.filter(r=>r!==ref);if(!target||target===ref)next.push(ref);else{let i=next.indexOf(target),n=document.querySelector(`[data-v2-ref="${CSS.escape(target)}"]`);if(n){const r=n.getBoundingClientRect();if(e.clientY>r.top+r.height/2)i++}next.splice(Math.max(0,i),0,ref)}data.homeLayoutV2=next;dragRef=dragAllowed=null;await saveLayout(before)});
  document.addEventListener("dragend",()=>{document.querySelectorAll(".v2-dragging,.v2-drop").forEach(n=>n.classList.remove("v2-dragging","v2-drop"));dragRef=dragAllowed=null});
  document.addEventListener("pointerup",async()=>{if(!resizeState)return;const st=resizeState;resizeState=null,n=document.querySelector(`[data-v2-ref="${CSS.escape(st.ref)}"]`),box=document.getElementById("v2HomeLayout");if(!n||!box||!st.ref.startsWith("text:"))return;const id=st.ref.slice(5),b=data.homeTextBlocks?.[id];if(!b)return;b.widthPct=Math.max(30,Math.min(100,Math.round(n.getBoundingClientRect().width/box.getBoundingClientRect().width*100)));b.minHeight=Math.max(0,Math.min(700,Math.round(n.getBoundingClientRect().height)));try{await S.save();renderHome()}catch(e){data.homeTextBlocks[id]=st.old;renderHome();toast(e.message||"Kunde inte spara storleken.")}},true);
  document.addEventListener("click",e=>{const add=e.target.closest("#v2AddTextBtn");if(add&&admin){e.preventDefault();openText();return}const edit=e.target.closest("[data-v2-edit-text]");if(edit&&admin){e.preventDefault();e.stopPropagation();openText(edit.dataset.v2EditText)}},true);
  window.addEventListener("beforeunload",e=>{const m=document.getElementById("v2TextModal");if(m?.dataset.dirty==="1"&&!m.classList.contains("hidden")){e.preventDefault();e.returnValue=""}});
})();