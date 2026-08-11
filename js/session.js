// session.js
// Handles saving, loading and version history for user sessions
// Also handles sharing via WhatsApp/email and CSV export - save/load and version history

// Session module - same IIFE pattern as State and UI
const Session = (() => {
  const LS_KEY='disc_mcdm_v3_history', MAX_HISTORY=30;
  let _history=[];

  // Load any previously auto-saved checkpoints from localStorage
  // We keep up to 30 versions so the user can go back
  function initHistory() {
    try{ const raw=localStorage.getItem(LS_KEY); if(raw) _history=JSON.parse(raw); }catch(e){_history=[];}
    UI.renderSessionHistory(_history);
  }
  function _persist() { try{localStorage.setItem(LS_KEY,JSON.stringify(_history.slice(0,MAX_HISTORY)));}catch(e){} }
  function _addEntry(payload,label) {
    const entry={id:Date.now(),name:label||payload.meta.sessionName,note:payload.meta.versionNote||'',
      savedAt:payload.meta.savedAt||new Date().toISOString(),step:payload.meta.step||1,
      alts:payload.alts.length,crits:payload.crits.filter(c=>!c.parentId).length,mode:payload.mode,state:payload};
    _history.unshift(entry);
    if(_history.length>MAX_HISTORY) _history.length=MAX_HISTORY;
    _persist(); UI.renderSessionHistory(_history);
    return entry;
  }
  function autoSnapshot(note) {
    const snap=State.snapshot(); snap.meta.versionNote=note; snap.meta.savedAt=new Date().toISOString();
    _addEntry(snap,snap.meta.sessionName+' (auto)');
  }
  // Save the current session to a JSON file
  function save() {
    const name=(document.getElementById('sessionNameInput').value.trim())||'Unnamed session';
    const note=document.getElementById('sessionNoteInput').value.trim();
    State.setSessionName(name); State.setVersionNote(note);
    const meta=State.getMeta(); meta.savedAt=new Date().toISOString();
    const payload=State.snapshot(); _addEntry(payload);
    const safeDate=new Date().toISOString().slice(0,16).replace(/[T:]/g,'-');
    const safeName=name.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_\-]/g,'').toLowerCase();
    _download(JSON.stringify(payload,null,2),`disc-mcdm_${safeName}_v${meta.version||1}_${safeDate}.json`,'application/json');
    State.bumpVersion();
    document.getElementById('hdrSessionName').textContent=name;
    const pn=document.getElementById('print-session-name'); if(pn) pn.textContent=name;
    const pd=document.getElementById('print-date'); if(pd) pd.textContent=new Date().toLocaleString();
    UI.closeSaveModal(); document.getElementById('sessionNoteInput').value='';
    UI.toast(`Session "${name}" saved ✓`);
  }
  // Load a session from a JSON file the user picks
  function loadFile(input) {
    const file=input.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=e=>{try{const data=JSON.parse(e.target.result);_restoreState(data,`Loaded: ${file.name}`);}catch(_){UI.toast('⚠ Invalid session file, could not load.');}};

    reader.readAsText(file); input.value='';
  }
  // Restore a specific auto-saved version by ID
  function loadVersion(id) {
    const entry=_history.find(v=>v.id===id); if(!entry) return;
    _restoreState(entry.state,`Restored: ${entry.name}`);
  }
  // Internal: restore state from a parsed session object
  function _restoreState(data, msg) {
    State.restore(data);
    UI.clearRemovedAlts(); // clear the removed-alts restore cache on any session load
    document.getElementById('hdrSessionName').textContent=data.meta.sessionName||'Loaded session';
    const pn=document.getElementById('print-session-name'); if(pn) pn.textContent=data.meta.sessionName||'Loaded session';
    const pd=document.getElementById('print-date'); if(pd) pd.textContent=new Date().toLocaleString();
    _addEntry(State.snapshot(),data.meta.sessionName);
    UI.goStep(data.meta.step||1);
    UI.toast(msg||'Session loaded ✓');
  }
  function clearAll() {
    UI.openRefineModal('Clear History','Clear all saved version history? This cannot be undone.',null,()=>{
      _history=[]; _persist(); UI.renderSessionHistory(_history); UI.toast('History cleared');
    });
    document.getElementById('refineModalConfirm').textContent='Clear All';
  }
  // Export the current results as a CSV spreadsheet
  function exportCSV() {
    const mode=State.getMode(), basis=State.getBasis(), ranked=Compute.ranked();
    const bd=Compute.breakdown(), leaves=State.getLeaves(), meta=State.getMeta();
    let csv=`DISC-MCDM Results\nSession:,${meta.sessionName}\nMode:,${mode==='US'?'DISCUS':'DISCRIM'}\nBasis:,${basis}\nExported:,${new Date().toLocaleString()}\n\n`;
    csv+=`Rank,Alternative,Overall Score\n`;
    ranked.forEach((r,i)=>{ csv+=`${i+1},${r.name},${r.score.toFixed(4)}\n`; });
    csv+=`\nCriterion,Tier,Parent,Global Weight\n`;
    leaves.forEach(c=>{
      const parent=c.parentId?State.getCrits().find(cc=>cc.id===c.parentId):'';
      csv+=`${c.name},${c.tier},${parent?parent.name:''},${Compute.globalW(c).toFixed(4)}\n`;
    });
    csv+=`\nAlternative,${leaves.map(c=>c.name).join(',')},Total\n`;
    const bdMap={}; bd.forEach(r=>{bdMap[r.name]=r;});
    ranked.forEach(r=>{ const row=bdMap[r.name]; if(!row)return; csv+=`${r.name},${row.contributions.map(c=>c.weighted.toFixed(3)).join(',')},${r.score.toFixed(4)}\n`; });
    _download(csv,`disc-mcdm_results_${new Date().toISOString().slice(0,10)}.csv`,'text/csv');
    UI.toast('CSV exported ✓');
  }
  function toggleSharePicker() {
    const panel=document.getElementById('sharePickerPanel');
    const btn=document.getElementById('btnShareToggle');
    const open=panel.style.display==='none';
    panel.style.display=open?'block':'none';
    btn.style.background=open?'var(--primary-l)':'';
    if(open) document.getElementById('shareRecipientInput').focus();
  }
  function _buildSharePayload() {
    const name=(document.getElementById('sessionNameInput').value.trim())||'Unnamed session';
    const note=document.getElementById('sessionNoteInput').value.trim();
    State.setSessionName(name); if(note) State.setVersionNote(note);
    const meta=State.getMeta(); meta.savedAt=new Date().toISOString();
    const payload=State.snapshot();
    const safeDate=new Date().toISOString().slice(0,16).replace(/[T:]/g,'-');
    const safeName=name.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_\-]/g,'').toLowerCase();
    const filename=`disc-mcdm_${safeName}_v${meta.version||1}_${safeDate}.json`;
    const jsonStr=JSON.stringify(payload,null,2);
    return {name,note,filename,jsonStr};
  }
  async function shareViaWhatsApp() {
    const recipient=document.getElementById('shareRecipientInput').value.trim();
    if(!recipient){ UI.toast('⚠ Enter a phone number first (e.g. +353861234567)'); return; }
    const {name,note,filename,jsonStr}=_buildSharePayload();
    const jsonBlob=new Blob([jsonStr],{type:'application/json'});
    const file=new File([jsonBlob],filename,{type:'application/json'});
    // Primary: Web Share API with file (mobile Chrome/Safari/Edge)
    if(navigator.canShare && navigator.canShare({files:[file]})) {
      try {
        await navigator.share({ files:[file], title:`DISC-MCDM: ${name}`, text:(note?`Note: ${note}\n`:'')+`Exported: ${new Date().toLocaleString()}` });
        UI.closeSaveModal();
        UI.toast('Shared via WhatsApp ✓');
        return;
      } catch(e) {
        if(e.name==='AbortError') return;
      }
    }
    // Fallback: auto-download + open WhatsApp with a message that carries the
    // file as a downloadable data link in the body, so the recipient can save it
    // even when the OS cannot attach the file directly to the chat.
    _download(jsonStr,filename,'application/json');
    const b64=btoa(unescape(encodeURIComponent(jsonStr)));
    const dataUri=`data:application/json;base64,${b64}`;
    const phone=recipient.replace(/[\s\-()]/g,'');
    const msg=
      `*DISC-MCDM Session: ${name}*\n`+
      (note?`_${note}_\n`:'')+
      `Exported: ${new Date().toLocaleString()}\n`+
      `File: ${filename}\n\n`+
      `The session file has been attached / auto-downloaded. You can also rebuild it from this downloadable data link. Open it in a browser and save the page as "${filename}":\n${dataUri}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,'_blank');
    UI.closeSaveModal();
    _showShareResult('whatsapp', filename);
  }
  async function shareViaEmail() {
    const recipient=document.getElementById('shareRecipientInput').value.trim();
    if(!recipient){ UI.toast('⚠ Enter an email address first'); return; }
    const {name,note,filename,jsonStr}=_buildSharePayload();
    const jsonBlob=new Blob([jsonStr],{type:'application/json'});
    const file=new File([jsonBlob],filename,{type:'application/json'});
    // Primary: Web Share API with file (mobile/modern browsers, lets OS pick email app with file attached)
    if(navigator.canShare && navigator.canShare({files:[file]})) {
      try {
        await navigator.share({ files:[file], title:`DISC-MCDM Session: ${name}`, text:(note?`Note: ${note}\n`:'')+`Exported: ${new Date().toLocaleString()}` });
        UI.closeSaveModal();
        UI.toast('Shared ✓');
        return;
      } catch(e) {
        if(e.name==='AbortError') return;
      }
    }
    // Desktop fallback: auto-download + open email client with pre-filled fields.
    // Attach the file via a data URI embedded in the body so recipient can reconstruct it,
    // and trigger the download automatically so it is ready to drag-and-drop.
    _download(jsonStr,filename,'application/json');
    const b64=btoa(unescape(encodeURIComponent(jsonStr)));
    const dataUri=`data:application/json;base64,${b64}`;
    const subject=encodeURIComponent(`DISC-MCDM Session: ${name}`);
    const body=encodeURIComponent(
      `Hi,\n\nI am sharing a DISC-MCDM decision session with you.\n`+
      `Session: ${name}\n`+(note?`Note: ${note}\n`:``)+
      `Exported: ${new Date().toLocaleString()}\n\n`+
      `The session file "${filename}" has been attached.\n\n`+
      `--- DISC-MCDM Data Link (save as ${filename}) ---\n${dataUri}\n---`
    );
    UI.closeSaveModal();
    window.location.href=`mailto:${encodeURIComponent(recipient)}?subject=${subject}&body=${body}`;
    _showShareResult('email', filename);
  }
  function _showShareResult(channel, filename) {
    const existing=document.getElementById('shareResultToast'); if(existing) existing.remove();
    const toast=document.createElement('div');
    toast.id='shareResultToast';
    toast.style.cssText='position:fixed;bottom:24px;right:24px;z-index:9999;background:var(--primary);color:#fff;padding:14px 18px;border-radius:10px;display:flex;align-items:flex-start;gap:10px;box-shadow:0 4px 20px rgba(0,0,0,.3);font-size:13px;max-width:340px;';
    const icon=channel==='email'?'📧':'💬';
    const channelLabel=channel==='email'?'email client':'WhatsApp';
    toast.innerHTML=
      `<span style="font-size:20px;flex-shrink:0">${icon}</span>`+
      `<span style="flex:1"><strong>File auto-downloaded!</strong><br>`+
      `<span style="opacity:.9">${channelLabel==='email client'?'Your email client opened with the session details pre-filled.':'WhatsApp opened with a pre-filled message.'} `+
      `Attach <code style="background:rgba(255,255,255,.2);padding:1px 4px;border-radius:3px;font-size:11px;">${filename}</code> from your Downloads.</span></span>`+
      `<button onclick="document.getElementById('shareResultToast').remove()" style="background:none;border:none;color:#fff;font-size:16px;cursor:pointer;padding:0 0 0 6px;flex-shrink:0;">✕</button>`;
    document.body.appendChild(toast);
    setTimeout(()=>{ if(toast.parentNode) toast.remove(); }, 8000);
  }
  // Helper: download a file - tries the modern File System Access API first,
  // falls back to the old-school blob URL approach for Firefox/Safari
  async function _download(content, filename, type) {
    // Use the modern File System Access API if available  -  opens a native Save As dialog
    if (window.showSaveFilePicker) {
      try {
        const ext = filename.split('.').pop();
        const mimeMap = { json:'application/json', csv:'text/csv' };
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: ext.toUpperCase()+' file', accept: { [mimeMap[ext]||type]: ['.'+ext] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        return;
      } catch (err) {
        // User cancelled the picker  -  do not fall through to auto-download
        if (err.name === 'AbortError') return;
        // Any other error (permissions, etc.)  -  fall through to blob download
      }
    }
    // Fallback: blob download to default Downloads folder
    const blob = new Blob([content], {type}), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }
  return { initHistory, autoSnapshot, save, toggleSharePicker, shareViaWhatsApp, shareViaEmail, loadFile, loadVersion, clearAll, exportCSV };
})();
