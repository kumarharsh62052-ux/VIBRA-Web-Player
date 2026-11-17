const $ = id => document.getElementById(id);
const audio = $("audio");
let songs = [], playlists = JSON.parse(localStorage.getItem("vibra-playlists") || '{"Chill Mix":[],"Focus":[]}'), liked = new Set(JSON.parse(localStorage.getItem("vibra-liked") || "[]")), current = null, view = "home", currentPlaylist = null, query = "", shuffle = false, repeat = false;
let selectedId = null, toastTimer;
const dbReq = indexedDB.open("vibra-web-library", 1);
dbReq.onupgradeneeded = e => e.target.result.createObjectStore("tracks", {keyPath:"id"});
dbReq.onsuccess = async e => { const db=e.target.result, tx=db.transaction("tracks","readonly"), req=tx.objectStore("tracks").getAll(); req.onsuccess=()=>{songs=(req.result||[]).map(s=>({...s,url:s.blob?URL.createObjectURL(s.blob):s.url}));render();}; };
function saveTrack(song){const db=dbReq.result;if(!db)return;db.transaction("tracks","readwrite").objectStore("tracks").put(song);}
function removeTrack(id){const db=dbReq.result;if(db)db.transaction("tracks","readwrite").objectStore("tracks").delete(id);}
function notify(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2200);}
function fmt(s){if(!Number.isFinite(s))return "0:00";return Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0");}
function visibleSongs(){let list=view==="liked"?songs.filter(s=>liked.has(s.id)):view==="playlist"?songs.filter(s=>(playlists[currentPlaylist]||[]).includes(s.id)):songs; if(query){const q=query.toLowerCase();list=list.filter(s=>(s.title+" "+s.artist+" "+s.name).toLowerCase().includes(q));}return list;}
function persistPrefs(){localStorage.setItem("vibra-playlists",JSON.stringify(playlists));localStorage.setItem("vibra-liked",JSON.stringify([...liked]));}
function render(){persistPrefs();const list=visibleSongs();$("songRows").innerHTML="";list.forEach((s,i)=>{const tr=document.createElement("tr");tr.className=(selectedId===s.id?"selected":"");tr.innerHTML=`<td>${i+1}</td><td><span class="song-title"></span></td><td></td><td></td><td>${fmt(s.duration||0)}</td><td><button class="heart-cell">${liked.has(s.id)?"♥":"♡"}</button></td>`;tr.children[1].querySelector("span").textContent=s.title;tr.children[2].textContent=s.artist||"Unknown artist";tr.children[3].textContent=s.name;tr.addEventListener("click",()=>{selectedId=s.id;render();});tr.addEventListener("dblclick",()=>play(s));tr.querySelector("button").addEventListener("click",e=>{e.stopPropagation();toggleLike(s);});$("songRows").appendChild(tr);});$("empty").style.display=list.length?"none":"block";$("sectionTitle").textContent=view==="liked"?"Liked Songs":view==="playlist"?currentPlaylist:"Your Library";$("sectionSubtitle").textContent=list.length?`${list.length} ${list.length===1?"track":"tracks"} in this view`:"Your collection, all in one place";$("hero").style.display=view==="home"&&!query?"flex":"none";renderPlaylists();updateNow();}
function renderPlaylists(){$("playlistList").innerHTML="";Object.keys(playlists).forEach(name=>{const b=document.createElement("button");b.className="playlist-item"+(view==="playlist"&&name===currentPlaylist?" active":"");b.textContent="♫   "+name;b.onclick=()=>{view="playlist";currentPlaylist=name;render();};$("playlistList").appendChild(b);});}
function updateNow(){const s=current;$("nowTitle").textContent=s?s.title:"Nothing playing";$("nowArtist").textContent=s?(s.artist||"Unknown artist"):"Choose a song to begin";$("barTitle").textContent=s?s.title:"Nothing playing";$("barArtist").textContent=s?(s.artist||"Unknown artist"):"VIBRA Music Player";$("nowLike").textContent=s&&liked.has(s.id)?"♥":"♡";$("nextTitle").textContent=songs.length? "Select a track or use Next":"Your next track will appear here";}
function play(s){current=s;audio.src=s.url;audio.play().then(()=>{$("play").textContent="Ⅱ";}).catch(()=>notify("This audio file could not be played in this browser."));selectedId=s.id;render();}
function toggleLike(s){if(liked.has(s.id))liked.delete(s.id);else liked.add(s.id);persistPrefs();render();}
function next(){if(!songs.length)return;let idx=songs.findIndex(s=>s.id===current?.id);let list=visibleSongs();if(!list.length)list=songs;let i=list.findIndex(s=>s.id===current?.id);if(shuffle)i=Math.floor(Math.random()*list.length);else i=(i+1+list.length)%list.length;play(list[i]);}
function previous(){if(!songs.length)return;let list=visibleSongs();if(!list.length)list=songs;let i=list.findIndex(s=>s.id===current?.id);play(list[(i-1+list.length)%list.length]);}
$("fileInput").addEventListener("change",async e=>{for(const f of e.target.files){const url=URL.createObjectURL(f),s={id:crypto.randomUUID(),name:f.name,title:f.name.replace(/\.[^.]+$/,""),artist:"Local file",duration:0,url,blob:f};const probe=new Audio(url);await new Promise(resolve=>{probe.onloadedmetadata=()=>{s.duration=probe.duration;resolve();};probe.onerror=resolve;});songs.push(s);saveTrack(s);}e.target.value="";view="all";render();notify("Music added to your library");});
$("search").addEventListener("input",e=>{query=e.target.value;render();});
$("heroAdd").onclick=$("emptyAdd").onclick=()=>$("fileInput").click();
document.querySelectorAll(".nav[data-view]").forEach(b=>b.onclick=()=>{view=b.dataset.view;currentPlaylist=null;document.querySelectorAll(".nav[data-view]").forEach(x=>x.classList.toggle("active",x===b));render();});
$("createPlaylist").onclick=()=>{const n=prompt("Name your playlist:");if(!n||!n.trim())return;const name=n.trim();if(playlists[name])return notify("That playlist already exists");playlists[name]=[];view="playlist";currentPlaylist=name;render();notify("Playlist created");};
function openPlaylistModal(){
  const song=songs.find(x=>x.id===selectedId);
  if(!song){notify("Select a song first, then click Add to playlist.");return;}
  $("modalSongName").textContent=`Add “${song.title}” to one of your playlists.`;
  const choices=$("playlistChoices");
  choices.innerHTML="";
  const names=Object.keys(playlists);
  if(!names.length){
    const msg=document.createElement("p");msg.className="no-playlists";msg.textContent="You don't have any playlists yet.";choices.appendChild(msg);
  }
  names.forEach(name=>{
    const b=document.createElement("button");
    b.className="playlist-choice";
    const already=playlists[name].includes(song.id);
    b.innerHTML=`<span class="choice-icon">♫</span><span class="choice-name"></span><span class="choice-status">${already?"Added ✓":"Add ＋"}</span>`;
    b.querySelector(".choice-name").textContent=name;
    b.disabled=already;
    b.addEventListener("click",()=>{
      if(!playlists[name].includes(song.id))playlists[name].push(song.id);
      persistPrefs();closePlaylistModal();render();notify("Added to "+name);
    });
    choices.appendChild(b);
  });
  $("playlistModal").hidden=false;
}
function closePlaylistModal(){$("playlistModal").hidden=true;}
$("addPlaylistTrack").addEventListener("click",openPlaylistModal);
$("closePlaylistModal").addEventListener("click",closePlaylistModal);
$("playlistModal").addEventListener("click",e=>{if(e.target===$("playlistModal"))closePlaylistModal();});
$("modalCreatePlaylist").addEventListener("click",()=>{
  const name=prompt("Name your new playlist:");
  if(!name||!name.trim())return;
  const clean=name.trim();
  if(playlists[clean])return notify("That playlist already exists");
  playlists[clean]=[];
  const song=songs.find(x=>x.id===selectedId);
  if(song)playlists[clean].push(song.id);
  persistPrefs();closePlaylistModal();render();notify(song?"Playlist created and song added":"Playlist created");
});
$("play").onclick=()=>{if(!current){if(songs.length)play(songs[0]);else return notify("Add music first");}else if(audio.paused)audio.play();else audio.pause();};
audio.onplay=()=>$("play").textContent="Ⅱ";audio.onpause=()=>$("play").textContent="▶";audio.ontimeupdate=()=>{$("elapsed").textContent=fmt(audio.currentTime);$("duration").textContent=fmt(audio.duration);$("seek").value=audio.duration?audio.currentTime/audio.duration*100:0;};audio.onended=()=>repeat?play(current):next();
$("seek").oninput=e=>{if(audio.duration)audio.currentTime=audio.duration*e.target.value/100;};$("volume").oninput=e=>audio.volume=Number(e.target.value);
$("next").onclick=next;$("previous").onclick=previous;$("shuffle").onclick=()=>{shuffle=!shuffle;$("shuffle").style.color=shuffle?"#b394ff":"";};$("repeat").onclick=()=>{repeat=!repeat;$("repeat").style.color=repeat?"#b394ff":"";};$("nowLike").onclick=()=>current&&toggleLike(current);
render();