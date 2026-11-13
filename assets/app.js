(function bollyvaultApp(){
  "use strict";
  const $=id=>document.getElementById(id);
  const state={movies:[],recentUnique:[],byId:new Map(),genres:[],genre:"All",type:"All",sort:"recent",query:"",listOnly:false,pageSize:30,visible:30,favorites:new Set(),featured:null,active:null};
  const GENRE_ORDER=["Action","Romance","Thriller","Comedy","Drama","Horror","Crime","Mystery","Family","Adventure","Fantasy","Biography","War","Animation"];
  let toastTimer=null,previousFocus=null;
  const number=n=>Number(n).toLocaleString("en-IN");
  const norm=s=>String(s||"").normalize("NFKC").toLowerCase().replace(/\s+/g," ").trim();
  const uniqueKey=x=>norm(x.t).replace(/[^\p{L}\p{N}]+/gu,"")+"|"+x.y;
  const escapeHTML=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const posterURL=x=>encodeURI(String(x.h||x.p||""));
  function notify(message){
    const node=$("toast");node.textContent=message;node.classList.add("visible");
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove("visible"),2600);
  }
  function loadFavorites(){
    try{const d=JSON.parse(localStorage.getItem("bollyvault-watchlist-v1")||"[]");if(Array.isArray(d))state.favorites=new Set(d.filter(v=>typeof v==="string"));}catch(e){state.favorites=new Set();}
  }
  function saveFavorites(){
    try{localStorage.setItem("bollyvault-watchlist-v1",JSON.stringify([...state.favorites]));}catch(e){}
    updateFavoriteCount();
  }
  function updateFavoriteCount(){
    const n=state.favorites.size,el=$("watchCount");
    el.textContent=String(n);el.hidden=n===0;
    const on=state.listOnly;
    $("watchlistToggle").setAttribute("aria-pressed",String(on));
    $("watchlistToggle").setAttribute("aria-label",on?"Show all titles":"Show my list");
  }
  function titleMarkup(t){
    const words=String(t).split(/\s+/);
    if(words.length<2)return escapeHTML(t);
    return escapeHTML(words.slice(0,-1).join(" "))+" <em>"+escapeHTML(words[words.length-1])+"</em>";
  }
  function setHero(movie){
    state.featured=movie;
    if(!movie)return;
    $("heroOverline").textContent="FEATURED FROM THE COLLECTION · "+(movie.y||"");
    $("heroTitle").innerHTML=titleMarkup(movie.t);
    $("heroTitle").classList.add("is-movie");
    $("heroDescription").textContent="Discover "+movie.t+" in your cinema archive. "+(movie.g.length?movie.g.slice(0,3).join(" · ")+" · ":"")+"Explore more Indian stories below.";
    $("heroMeta").innerHTML="<span>"+escapeHTML(movie.k)+"</span><i></i><span>"+movie.y+"</span><i></i><span>"+escapeHTML(movie.g.slice(0,2).join(" · ")||"Bollywood")+"</span>";
    $("heroPoster").src=encodeURI(movie.p);
    $("heroPoster").alt="";
    $("heroPosterTitle").textContent=movie.t;
    const choices=state.recentUnique.filter(x=>x.i!==movie.i&&x.p);
    if(choices[0])$("heroSideLeft").src=encodeURI(choices[0].p);
    if(choices[2])$("heroSideRight").src=encodeURI(choices[2].p);
  }
  function movieCard(movie){
    const saved=state.favorites.has(movie.i);
    const card=document.createElement("article");card.className="movie-card";
    const label=movie.v?"UPDATED "+movie.v:(movie.y>=2025?"NEW":"");
    const type=movie.g.length?movie.g.slice(0,2).join(" · "):movie.k;
    card.innerHTML='<div class="poster-box">'+
      '<img src="'+escapeHTML(posterURL(movie))+'" alt="Poster: '+escapeHTML(movie.t)+'" loading="lazy" decoding="async">'+
      (label?'<span class="card-tag">'+escapeHTML(label)+'</span>':"")+
      '<button type="button" class="poster-action" data-movie-id="'+escapeHTML(movie.i)+'" aria-label="View details for '+escapeHTML(movie.t)+'"><span class="play-circle">▶</span></button>'+
      '<button type="button" class="favorite-card '+(saved?"saved":"")+'" data-fav-id="'+escapeHTML(movie.i)+'" aria-label="'+(saved?"Remove from":"Add to")+' My List" title="'+(saved?"Remove from":"Add to")+' My List">'+(saved?"♥":"♡")+'</button>'+
      '</div><div class="card-info"><h4 title="'+escapeHTML(movie.t)+'">'+escapeHTML(movie.t)+'</h4><p>'+movie.y+'<i>•</i>'+escapeHTML(type)+'</p></div>';
    const img=card.querySelector("img");
    img.addEventListener("error",()=>{img.style.opacity="0";});
    return card;
  }
  function replaceCards(container,items){
    const fragment=document.createDocumentFragment();for(const m of items)fragment.appendChild(movieCard(m));
    container.replaceChildren(fragment);
  }
  function renderRails(){
    const all=state.recentUnique;
    replaceCards($("recentRail"),all.slice(0,17));
    replaceCards($("actionRail"),all.filter(m=>m.g.includes("Action")).slice(0,17));
    replaceCards($("romanceRail"),all.filter(m=>m.g.includes("Romance")||m.g.includes("Drama")).slice(0,17));
  }
  function renderGenres(){
    const counts=new Map();
    for(const m of state.movies)for(const g of m.g)counts.set(g,(counts.get(g)||0)+1);
    state.genres=GENRE_ORDER.filter(g=>counts.has(g));
    $("statGenres").textContent=counts.size+"+";
    $("genreCount").textContent=counts.size+" moods to explore";
    $("genreChips").innerHTML="";
    const options=["All",...state.genres];
    for(const g of options){
      const b=document.createElement("button");b.type="button";b.className="genre-chip"+(state.genre===g?" selected":"");b.dataset.genre=g;
      b.textContent=g==="All"?"All genres":g;
      if(g!=="All"){const n=document.createElement("em");n.textContent=number(counts.get(g));b.appendChild(n);}
      $("genreChips").appendChild(b);
    }
  }
  function getFiltered(){
    let items=state.movies;
    if(state.genre!=="All")items=items.filter(m=>m.g.includes(state.genre));
    if(state.type!=="All")items=items.filter(m=>m.k===state.type);
    if(state.listOnly)items=items.filter(m=>state.favorites.has(m.i));
    if(state.query){
      const terms=norm(state.query).split(" ").filter(Boolean);
      items=items.filter(m=>{const hay=norm(m.t+" "+m.y+" "+m.g.join(" ")+" "+m.k);return terms.every(t=>hay.includes(t));});
    }
    items=items.slice();
    if(state.sort==="year")items.sort((a,b)=>b.y-a.y||b.n-a.n);
    else if(state.sort==="oldest")items.sort((a,b)=>a.y-b.y||b.n-a.n);
    else if(state.sort==="az")items.sort((a,b)=>a.t.localeCompare(b.t)||b.y-a.y);
    else items.sort((a,b)=>b.n-a.n);
    return items;
  }
  function renderLibrary(){
    const filtered=getFiltered();
    $("resultCount").textContent=number(filtered.length);
    $("resultLabel").textContent=state.listOnly?"titles in My List":"titles found";
    const list=filtered.slice(0,state.visible);
    replaceCards($("movieGrid"),list);
    $("emptyState").hidden=filtered.length!==0;
    $("loadMore").hidden=filtered.length<=list.length;
    $("pageStatus").textContent=filtered.length?"Showing "+number(list.length)+" of "+number(filtered.length)+" entries":"";
    const active=state.query||state.genre!=="All"||state.type!=="All"||state.listOnly;
    $("activeFilters").hidden=!active;
    $("activeFilters").replaceChildren();
    const badges=[];
    if(state.listOnly)badges.push("♡ My List");
    if(state.query)badges.push('Search: "'+state.query+'"');
    if(state.genre!=="All")badges.push("Genre: "+state.genre);
    if(state.type!=="All")badges.push("Type: "+state.type);
    for(const b of badges){const node=document.createElement("span");node.textContent=b;$("activeFilters").appendChild(node);}
    ["recentSection","actionSection","romanceSection"].forEach(id=>$(id).hidden=Boolean(active));
  }
  function applyFilter(){
    state.visible=state.pageSize;
    renderGenres();renderLibrary();
  }
  function clearFilters(){
    state.query="";state.type="All";state.genre="All";state.sort="recent";state.listOnly=false;
    $("searchInput").value="";$("typeSelect").value="All";$("sortSelect").value="recent";
    updateFavoriteCount();applyFilter();
  }
  function toggleFavorite(id){
    const m=state.byId.get(id);if(!m)return;
    if(state.favorites.has(id)){state.favorites.delete(id);notify("Removed from My List");}
    else{state.favorites.add(id);notify("Added to My List ♥");}
    saveFavorites();
    if(state.active?.i===id)updateModalFavorite(m);
    renderRails();renderLibrary();
  }
  function updateModalFavorite(m){
    const saved=state.favorites.has(m.i);
    $("modalFavorite").textContent=saved?"♥ Remove from My List":"♡ Add to My List";
  }
  function renderQualityLinks(movie){
    const holder=$("modalQualityLinks");holder.replaceChildren();
    const entries=Object.entries(movie.l||{}).filter(([quality,href])=>
      /^\d{3,4}p$/.test(quality)&&typeof href==="string"&&/^https?:\/\/[a-z0-9.-]+(?:\/|$)/i.test(href)
    ).sort((a,b)=>parseInt(a[0],10)-parseInt(b[0],10));
    $("modalNoLinks").hidden=entries.length>0;
    for(const [quality,href] of entries){
      const anchor=document.createElement("a");
      anchor.className="quality-link";
      anchor.href=href;
      anchor.target="_blank";
      anchor.rel="noopener noreferrer nofollow";
      anchor.setAttribute("aria-label","Open "+quality+" link for "+movie.t+" on external website");
      const top=document.createElement("span");top.className="quality-top";
      const label=document.createElement("strong");label.textContent=quality;
      const arrow=document.createElement("span");arrow.textContent="↗";arrow.setAttribute("aria-hidden","true");
      top.append(label,arrow);
      const domain=document.createElement("small");domain.className="quality-domain";
      domain.textContent=href.match(/^https?:\/\/([^/?#]+)/i)?.[1]||"External site";
      anchor.append(top,domain);
      holder.appendChild(anchor);
    }
  }
  function openDetails(id){
    const m=state.byId.get(id);if(!m)return;
    state.active=m;previousFocus=document.activeElement;
    $("modalTitle").textContent=m.t;
    $("modalPoster").src=encodeURI(m.p||m.h);
    $("modalPoster").alt="Poster for "+m.t;
    const bits=[String(m.y),m.k];
    if(m.v)bits.push("Updated "+m.v);
    $("modalMeta").replaceChildren();
    bits.forEach(s=>{const el=document.createElement("span");el.textContent=s;$("modalMeta").appendChild(el);});
    $("modalTags").replaceChildren();
    (m.g.length?m.g:["Indian cinema"]).forEach(s=>{const el=document.createElement("span");el.textContent=s;$("modalTags").appendChild(el);});
    $("modalSummary").textContent="An archived "+m.k.toLowerCase()+" entry from "+m.y+". "+(m.g.length?"Genres: "+m.g.join(", ")+". ":"")+"Explore other titles in this collection or open the original archive post for more information.";
    $("modalSource").href=m.s;
    renderQualityLinks(m);
    updateModalFavorite(m);
    $("detailsBackdrop").hidden=false;
    document.body.classList.add("modal-open");
    $("modalClose").focus();
  }
  function closeDetails(){
    $("detailsBackdrop").hidden=true;document.body.classList.remove("modal-open");state.active=null;
    if(previousFocus&&previousFocus.isConnected)previousFocus.focus();
  }
  function setListOnly(yes){
    state.listOnly=typeof yes==="boolean"?yes:!state.listOnly;
    updateFavoriteCount();applyFilter();$("library").scrollIntoView({behavior:"smooth",block:"start"});
    if(state.listOnly&&state.favorites.size===0)notify("Open any film and add it to My List");
  }
  function surpriseMe(){
    const pool=state.recentUnique.length?state.recentUnique:state.movies;
    const movie=pool[Math.floor(Math.random()*pool.length)];
    if(movie)openDetails(movie.i);
  }
  function attachEvents(){
    $("searchInput").addEventListener("input",e=>{state.query=e.target.value;applyFilter();});
    $("searchInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("library").scrollIntoView({behavior:"smooth"});});
    $("genreChips").addEventListener("click",e=>{
      const b=e.target.closest("button[data-genre]");
      if(!b)return;state.genre=b.dataset.genre;applyFilter();$("library").scrollIntoView({behavior:"smooth"});
    });
    $("typeSelect").addEventListener("change",e=>{state.type=e.target.value;applyFilter();});
    $("sortSelect").addEventListener("change",e=>{state.sort=e.target.value;applyFilter();});
    $("loadMore").addEventListener("click",()=>{state.visible+=state.pageSize;renderLibrary();});
    $("watchlistToggle").addEventListener("click",()=>setListOnly());
    $("mobileList").addEventListener("click",()=>setListOnly());
    $("heroExplore").addEventListener("click",()=>$("discover").scrollIntoView({behavior:"smooth"}));
    $("heroDetails").addEventListener("click",()=>{if(state.featured)openDetails(state.featured.i);});
    $("surpriseBtn").addEventListener("click",surpriseMe);
    $("resetFilters").addEventListener("click",clearFilters);
    $("emptyReset").addEventListener("click",clearFilters);
    $("backToTop").addEventListener("click",()=>$("home").scrollIntoView({behavior:"smooth"}));
    document.addEventListener("click",e=>{
      const fav=e.target.closest("button[data-fav-id]");
      if(fav){toggleFavorite(fav.dataset.favId);return;}
      const card=e.target.closest("button[data-movie-id]");
      if(card){openDetails(card.dataset.movieId);return;}
      const arrow=e.target.closest("button[data-rail]");
      if(arrow){const rail=$(arrow.dataset.rail);if(rail)rail.scrollBy({left:Number(arrow.dataset.dir)*rail.clientWidth*.85,behavior:"smooth"});}
    });
    $("modalClose").addEventListener("click",closeDetails);
    $("detailsBackdrop").addEventListener("click",e=>{if(e.target===$("detailsBackdrop"))closeDetails();});
    $("modalFavorite").addEventListener("click",()=>{if(state.active)toggleFavorite(state.active.i);});
    document.addEventListener("keydown",e=>{
      if(e.key==="Escape"&&!$("detailsBackdrop").hidden){closeDetails();return;}
      if(e.key==="/"&&$("detailsBackdrop").hidden&&!["INPUT","TEXTAREA"].includes(document.activeElement?.tagName)){
        e.preventDefault();$("searchInput").focus();
      }
    });
    window.addEventListener("scroll",()=>$("siteHeader").classList.toggle("scrolled",window.scrollY>18),{passive:true});
  }
  async function loadData(){
    try{
      const urls=[1,2,3,4].map(n=>"data/movies-"+n+".json");
      const arrays=await Promise.all(urls.map(async url=>{
        const r=await fetch(url,{cache:"default"});if(!r.ok)throw new Error("Could not load "+url+" (HTTP "+r.status+")");
        return r.json();
      }));
      state.movies=arrays.flat().filter(x=>x&&x.i&&x.t&&x.p).map((x,n)=>({...x,n}));
      state.byId=new Map(state.movies.map(x=>[x.i,x]));
      const keys=new Set();
      state.recentUnique=[];
      for(let n=state.movies.length-1;n>=0;n--){
        const m=state.movies[n],key=uniqueKey(m);
        if(!keys.has(key)){keys.add(key);state.recentUnique.push(m);}
      }
      $("statTitles").textContent=number(state.movies.length);
      $("statUnique").textContent=number(keys.size);
      $("heroCount").textContent=number(state.movies.length)+"+";
      const hero=state.recentUnique.find(m=>m.y>=2025&&m.y<=2026&&m.g.includes("Action")&&m.t.length>=7&&m.t.length<=24)
          ||state.recentUnique.find(m=>m.y>=2025&&m.t.length>=5&&m.t.length<=24)
          ||state.recentUnique[0];
      setHero(hero);
      renderRails();applyFilter();
      const q=new URLSearchParams(window.location.search).get("q");
      if(q){state.query=q;$("searchInput").value=q;applyFilter();}
    }catch(err){
      console.error("BollyVault: catalog failed to load",err);
      $("movieGrid").textContent="The catalogue could not be loaded. Please view this site through GitHub Pages, and confirm the data/movies-*.json files were published.";
      $("recentRail").textContent="Catalogue unavailable";
      $("actionRail").textContent="";
      $("romanceRail").textContent="";
      $("resultCount").textContent="0";
      notify("Could not load the movie catalogue");
    }
  }
  loadFavorites();updateFavoriteCount();attachEvents();loadData();
})();
