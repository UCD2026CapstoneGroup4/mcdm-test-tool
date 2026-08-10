// state.js
// Central data store for the DISC-MCDM application
// All state lives here - nothing else modifies the data directly
// Uses the revealing module pattern (IIFE) to keep internals private - app state

// State module - wrap everything in an IIFE so nothing leaks to global scope
const State = (() => {
  let _idSeq = 100;
  const nextId = () => 'c' + (++_idSeq);

  const _defaults = () => ({
    meta: { sessionName:'Unsaved session', versionNote:'', savedAt:null, step:1, version:1 },
    alts: ['Supplier Alpha', 'Supplier Beta', 'Supplier Gamma'],
    // crits: flat list; each has id, name, tier, parentId (null = top-level)
    crits: [
      { id:'c1', name:'Unit Cost',      tier:'somatic',   parentId:null },
      { id:'c2', name:'Quality',        tier:'somatic',   parentId:null },
      { id:'c3', name:'Lead Time',      tier:'somatic',   parentId:null },
      { id:'c4', name:'Relationship',   tier:'psychic',   parentId:null },
      { id:'c5', name:'Flexibility',    tier:'psychic',   parentId:null },
      { id:'c6', name:'Sustainability', tier:'pneumatic', parentId:null },
    ],
    tierW:  { somatic:0.40, psychic:0.35, pneumatic:0.25 },
    critW:  {},      // critId → weight (within siblings)
    mode:   'US',
    basis:  10,
    scoresUS:  {},
    scoresRIM: {},
    scoreOrigin: {},
  });

  let _s = _defaults();
  const TIERS = ['somatic','psychic','pneumatic'];
  const TIER_COLORS = { somatic:'#1A5276', psychic:'#C65D00', pneumatic:'#1A7A6E' };
  const TIER_ICON_CLASS = { somatic:'ti-s', psychic:'ti-p', pneumatic:'ti-n' };
  const TIER_BADGE = { somatic:'badge-s', psychic:'badge-p', pneumatic:'badge-n' };


  // Leaf criteria = criteria with no children (the ones you actually score)
  function getLeaves() {
    const ids = new Set(_s.crits.map(c=>c.id));
    const hasChildren = new Set(_s.crits.filter(c=>c.parentId).map(c=>c.parentId));
    return _s.crits.filter(c => !hasChildren.has(c.id));
  }


  // Top-level criteria have no parentId
  function getTopLevel() {
    return _s.crits.filter(c=>!c.parentId);
  }

  function getChildren(parentId) {
    return _s.crits.filter(c=>c.parentId===parentId);
  }

  function getSiblings(critId) {
    const c = _s.crits.find(cc=>cc.id===critId);
    if (!c) return [];
    return _s.crits.filter(cc=>cc.parentId===c.parentId && cc.tier===c.tier);
  }

  // Make sure all alts/crits have score entries (fills gaps with defaults)
  // Called whenever alts or crits change
  function ensure() {
    const leaves = getLeaves();
    _s.alts.forEach((_,ai) => {
      if (!_s.scoresUS[ai])     _s.scoresUS[ai]     = {};
      if (!_s.scoresRIM[ai])    _s.scoresRIM[ai]    = {};
      if (!_s.scoreOrigin[ai])  _s.scoreOrigin[ai]  = {};
      leaves.forEach(c => {
        if (_s.scoresUS[ai][c.id]  == null) _s.scoresUS[ai][c.id]  = 0;
        if (_s.scoresRIM[ai][c.id] == null) {
          _s.scoresRIM[ai][c.id] = +(_s.basis / Math.max(_s.alts.length,1)).toFixed(2);
        }
      });
    });
    _s.crits.forEach(c => {
      if (_s.critW[c.id] == null) {
        const siblings = getSiblings(c.id);
        _s.critW[c.id] = parseFloat((1/Math.max(siblings.length,1)).toFixed(4));
      }
    });
    TIERS.forEach(t => { if (_s.tierW[t]==null) _s.tierW[t]=0.33; });
  }

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function reset() { _idSeq=100; _s=_defaults(); }
  function restore(data) { _s=data; ensure(); }
  const get = () => _s;
  const getAlts  = () => _s.alts;
  const getCrits = () => _s.crits;
  const getMeta  = () => _s.meta;
  const getMode  = () => _s.mode;
  const getBasis = () => _s.basis;
  const getTierW = () => _s.tierW;
  const getCritW = () => _s.critW;
  const getScoresUS  = () => _s.scoresUS;
  const getScoresRIM = () => _s.scoresRIM;
  const getScores    = () => _s.mode==='US' ? _s.scoresUS : _s.scoresRIM;

  function setMode(m) { _s.mode=m; }
  function setBasis(b) { _s.basis=b; }
  function setStep(n) { _s.meta.step=n; }
  function setSessionName(n) { _s.meta.sessionName=n; }
  function setVersionNote(n) { _s.meta.versionNote=n; }
  function bumpVersion() { _s.meta.version=(_s.meta.version||1)+1; }


  function addAlt(name) { _s.alts.push(name); ensure(); }

  function removeAlt(i) {
    // Snapshot scores BEFORE splice so old indices are still valid
    const oldUS  = clone(_s.scoresUS);
    const oldRIM = clone(_s.scoresRIM);
    _s.alts.splice(i, 1);
    // Re-map: skip the removed index, shift everything after it down by one
    const newUS = {}, newRIM = {};
    _s.alts.forEach((_, newAi) => {
      const oldAi = newAi >= i ? newAi + 1 : newAi;
      newUS[newAi]  = clone(oldUS[oldAi]  || {});
      newRIM[newAi] = clone(oldRIM[oldAi] || {});
    });
    _s.scoresUS = newUS; _s.scoresRIM = newRIM;
    ensure();
  }

  function renameAlt(i, name) { _s.alts[i]=name; }


  function addCrit(name, tier, parentId=null) {
    const id = nextId();
    // Inherit tier from parent if adding sub-criterion
    let actualTier = tier;
    if (parentId) {
      const parent = _s.crits.find(c=>c.id===parentId);
      if (parent) actualTier = parent.tier;
    }
    _s.crits.push({ id, name, tier:actualTier, parentId });
    ensure();
    return id;
  }

  function removeCrit(id) {
    // Remove this crit and all descendants
    const toRemove = new Set();
    const queue = [id];
    while (queue.length) {
      const cur = queue.pop();
      toRemove.add(cur);
      _s.crits.filter(c=>c.parentId===cur).forEach(c=>queue.push(c.id));
    }
    _s.crits = _s.crits.filter(c=>!toRemove.has(c.id));
    toRemove.forEach(rid=>{ delete _s.critW[rid]; });
    ensure();
  }
  function renameCrit(id, name) {
    const c = _s.crits.find(cc=>cc.id===id);
    if (c) c.name=name;
  }

  function setTierW(t,v) { _s.tierW[t]=v; }

  function setCritW(id,v) { _s.critW[id]=v; }


  function setScore(ai, critId, v) {
    const n = Math.max(0, Math.min(_s.basis, v));
    if (_s.mode==='US') {
      if (!_s.scoresUS[ai]) _s.scoresUS[ai]={};
      _s.scoresUS[ai][critId]=n;
    } else {
      if (!_s.scoresRIM[ai]) _s.scoresRIM[ai]={};
      _s.scoresRIM[ai][critId]=n;
    }
  }
  // Clear all scores but keep criteria and weights intact
  function clearScores() {
    _s.scoresUS = {};
    _s.scoresRIM = {};
    _s.scoreOrigin = {};
    ensure(); // re-fill with zeros
  }

  const getScoreOrigin = () => _s.scoreOrigin;

  function setScoreOrigin(ai, critId, origin) {
    if (!_s.scoreOrigin[ai]) _s.scoreOrigin[ai] = {};
    _s.scoreOrigin[ai][critId] = origin;
  }

  function loadTemplate(tplData) {
    _idSeq=100;
    _s.alts=[...tplData.alts];
    _s.tierW={...(tplData.tierW||{})};
    _s.critW={}; _s.scoresUS={}; _s.scoresRIM={};

    // first pass - assign IDs→id map
    const keyToId={};
    _s.crits = tplData.crits.map(c=>{
      const id='c'+(++_idSeq);
      if(c.key) keyToId[c.key]=id;
      return { id, name:c.name, tier:c.tier, parentId:null };
    });
    // Second pass: resolve parentKey → parentId
    tplData.crits.forEach((c,i)=>{
      if(c.parentKey && keyToId[c.parentKey]) {
        _s.crits[i].parentId = keyToId[c.parentKey];
      }
    });

    // Map critW by key or name to real id
    if(tplData.critW) {
      Object.entries(tplData.critW).forEach(([k,v])=>{
        const id = keyToId[k] || (_s.crits.find(c=>c.name===k)||{}).id;
        if(id) _s.critW[id]=v;
      });
    }

    // Leaf criteria (no children) for score mapping
    // We map scoresUS/RIM by alt index and leaf order
    function getLeafOrder() {
      const hasChildren=new Set(tplData.crits.filter(c=>c.parentKey).map(c=>c.parentKey));
      return tplData.crits
        .filter(c=>!hasChildren.has(c.key))
        .map(c=>keyToId[c.key]||(_s.crits.find(cc=>cc.name===c.name)||{}).id)
        .filter(Boolean);
    }

    if(tplData.scoresUS) {
      const leafIds=getLeafOrder();
      _s.alts.forEach((_,ai)=>{
        _s.scoresUS[ai]={};
        const row=tplData.scoresUS[ai]||[];
        leafIds.forEach((id,li)=>{ _s.scoresUS[ai][id]=row[li]||0; });
      });
    }
    if(tplData.scoresRIM) {
      const leafIds=getLeafOrder();
      _s.alts.forEach((_,ai)=>{
        _s.scoresRIM[ai]={};
        const row=tplData.scoresRIM[ai]||[];
        leafIds.forEach((id,li)=>{ _s.scoresRIM[ai][id]=row[li]||0; });
      });
    }
    ensure();
  }

  function snapshot() { return clone(_s); }

  return {
    TIERS, TIER_COLORS, TIER_ICON_CLASS, TIER_BADGE,
    nextId, ensure, reset, restore, snapshot,
    get, getAlts, getCrits, getMeta, getMode, getBasis,
    getTierW, getCritW, getScores, getScoresUS, getScoresRIM, getScoreOrigin,
    getLeaves, getTopLevel, getChildren, getSiblings,
    setMode, setBasis, setStep, setSessionName, setVersionNote, bumpVersion,
    addAlt, removeAlt, renameAlt,
    addCrit, removeCrit, renameCrit,
    setTierW, setCritW, setScore, setScoreOrigin, clearScores, loadTemplate,
  };
})();
