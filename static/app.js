// 공통 유틸
const esc = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const stamp = () => new Date().toLocaleTimeString();
const bubble = ({dir,text,b}) => `
  <div class="msg ${dir} ${b?'b':''}">
    <div class="bubble">${esc(text)}</div><div class="meta">${stamp()}</div>
  </div>`;
function append(el, html){ el.insertAdjacentHTML("beforeend", html); el.scrollTop = el.scrollHeight; }

// 상단/하단 입력칸을 서로 동기화
function bindMirror(idTop, idBottom, type="text"){
  const top = document.getElementById(idTop);
  const bottom = document.getElementById(idBottom);
  if(!top || !bottom) return;
  const ev = type === "checkbox" ? "change" : "input";
  top.addEventListener(ev, () => { if(type==="checkbox") bottom.checked = top.checked; else bottom.value = top.value; });
  bottom.addEventListener(ev, () => { if(type==="checkbox") top.checked = bottom.checked; else top.value = bottom.value; });
}
bindMirror("repA","repA_bottom");
bindMirror("repB","repB_bottom");
bindMirror("fuzzyA","fuzzyA_bottom","checkbox");
bindMirror("fuzzyB","fuzzyB_bottom","checkbox");

// 서버 필터 호출
async function filterForRecipient(text, replacement, fuzzy){
  const res = await fetch("/filter", {
    method:"POST", headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ text, replacement, fuzzy })
  });
  if(!res.ok) throw new Error("서버 오류");
  return await res.json(); // {output, replaced}
}

// A -> B
document.getElementById("sendA").addEventListener("click", async ()=>{
  const out = document.getElementById("outA");
  const t = out.value.trim(); if(!t) return;
  append(document.getElementById("chatA"), bubble({dir:"out", text:t}));
  try{
    const repB  = (document.getElementById("repB_bottom")?.value || document.getElementById("repB").value || "*****");
    const fuzzy = (document.getElementById("fuzzyB_bottom")?.checked ?? document.getElementById("fuzzyB").checked);
    const {output} = await filterForRecipient(t, repB, fuzzy);
    append(document.getElementById("chatB"), bubble({dir:"in", text: output}));
    out.value="";
  }catch(e){ alert("전송 실패: " + e.message); }
});

// B -> A
document.getElementById("sendB").addEventListener("click", async ()=>{
  const out = document.getElementById("outB");
  const t = out.value.trim(); if(!t) return;
  append(document.getElementById("chatB"), bubble({dir:"out", text:t, b:true}));
  try{
    const repA  = (document.getElementById("repA_bottom")?.value || document.getElementById("repA").value || "순화");
    const fuzzy = (document.getElementById("fuzzyA_bottom")?.checked ?? document.getElementById("fuzzyA").checked);
    const {output} = await filterForRecipient(t, repA, fuzzy);
    append(document.getElementById("chatA"), bubble({dir:"in", text: output}));
    out.value="";
  }catch(e){ alert("전송 실패: " + e.message); }
});
