// ui.js
// The main UI module - renders all four steps and the results page
// Uses a revealing module pattern (IIFE) so all helpers stay private
// 
// Step 1: Setup (alternatives + criteria)
// Step 2: Weights (tier and criterion weights)  
// Step 3: Scoring (DISCUS or DISCRIM)
// Step 4: Results (rankings, charts, sensitivity analysis)

const UI = (() => {
  const RIM_SUM_TOL = 0.05; // tolerance for row sum checks (per criterion, sum across all alternatives)

  // tooltip strings for data-tip attributes throughout
  const _TIP = {
    somatic:     'Somatic tier (Having): tangible, measurable criteria such as cost, time, quantity and physical specifications. These are objective and verifiable. Typically weighted highest in purchasing and supplier decisions.',
    psychic:     'Psychic tier (Doing): relational, experiential and contextual criteria such as supplier flexibility, trust, communication quality and ease of working together. Captures how the relationship will function in practice.',
    pneumatic:   'Pneumatic tier (Being): values-based, long-term and ethical criteria such as sustainability, corporate social responsibility, alignment with organisational values and long-run strategic fit. Hardest to quantify but often most important for strategic decisions.',
    discus:      'DISCUS (Utility Scoring): score each alternative independently on each criterion from 0 to the basis. A score of 0 means worst possible; the basis means best possible. Scores across alternatives are independent. Use DISCUS for 3 or more alternatives with clearly different profiles.',
    discrim:     'DISCRIM (Discrimination Intensity): distribute a fixed number of points (the basis) across all alternatives for each criterion, reflecting relative intensity. If Alt A is twice as strong as Alt B, give A approximately 6.7 and B approximately 3.3. Row sums must equal the basis. Use DISCRIM for fine discrimination between 2 or 3 closely-scored alternatives.',
    basis:       'The scoring scale upper limit (default 10). All individual cell scores and the final aggregated score are bounded by this value. Changing the basis after scores are entered will clear all existing scores.',
    templates:   'Pre-built decision problems from published academic DISC-MCDM case studies. Each template includes a two-level criteria hierarchy, sample weights, and illustrative scores. Load a template to explore the tool, then edit freely.',
    tierWeights: 'Controls the relative importance of the three Nomological tiers: Somatic (measurable), Psychic (relational) and Pneumatic (values). All active tier weights must sum to 1.00. A tier with weight 0 is excluded from scoring.',
    critWeights: 'Controls the relative importance of each criterion within its sibling group. Each group must independently sum to 1.00. The range hint below each slider shows how much weight is still available for that criterion given what its siblings currently hold (0.00 to remaining budget).',
    globalW:     'Global weight: the effective contribution of this criterion to the final score, computed as tier weight x all ancestor local weights x this criterion local weight. All global weights across all leaf criteria sum to 1.00.',
    criteriaTree:'Visual tree of the Nomological criteria hierarchy. Each node shows its local weight. Colours correspond to Somatic (navy), Psychic (orange) and Pneumatic (teal) tiers.',
    donut:       'Interactive weight distribution chart. The outer ring shows tier weights. Click any slice to drill into that tier and see how weight is distributed across its criteria. Click a leaf criterion to see per-alternative score contributions. Use the Back button to return.',
    normalise:   'Rescales all weights in this group proportionally so they sum to exactly 1.00, preserving their relative ratios. Use this after adding or removing a criterion to restore validity without manually adjusting each slider.',
    equal:       'Sets all weights in this group to an equal share (1 divided by the number of criteria). Use as a neutral starting point when you have no strong preference between criteria.',
    groupTotal:  'Sum of all sibling weights in this group. Must equal exactly 1.00 before you can proceed to scoring. A red asterisk (*) means the group is invalid. Use Normalise to fix automatically.',
    discusScore: 'Score this alternative on this criterion from 0 to the basis. 0 = worst possible, basis = best possible. Scores are independent across alternatives.',
    discrimAlloc:'Distribute the basis across alternatives for this criterion reflecting relative performance. The row total must equal the basis. If Alt A is twice as good as Alt B, give A approximately 6.7 and B approximately 3.3.',
    colTotal:    'DISCRIM row total: the sum of scores across all alternatives for this criterion. Must equal exactly the basis. A red value means the row is over or under. Adjust cells until the indicator turns green.',
    rankBasis:   'The maximum possible score. A score of 8.5 out of a basis of 10 means this alternative achieved 85% of the best possible outcome across all weighted criteria.',
    rankBar:     'Bar length is proportional to the top-ranked alternative score, not to the basis. The winner always fills 100% of the bar, making relative gaps between alternatives clearly visible.',
    tierChart:   'Stacked bar chart showing each alternative score broken down by Nomological tier contribution. Somatic (navy), Psychic (orange) and Pneumatic (teal) segments sum to the total score. Hover over a segment for the exact value.',
    heatmap:     'Advantage Heatmap: compares the top-ranked alternative against each opponent criterion by criterion. Blue cells mean the winner is ahead; amber cells mean the winner is behind. Darker colour indicates a larger gap. Use this to identify the winner weakest criteria.',
    parallel:    'Radar Chart: each spoke represents one criterion and each alternative is a closed polygon connecting its normalised scores. Toggle alternatives using the buttons. Overlapping polygons reveal where alternatives agree or diverge.',
    sensSliders: 'Sensitivity sliders work in a sandbox copy of the weights. Moving a slider does not change your saved weights or scores. The rankings and breakdown update live. Click Reset Weights to restore your original weights.',
    breakeven:   'The weight value at which the current top-ranked alternative would be overtaken by the second-ranked alternative. A number shows the exact flip point. "~0 (unstable)" means the ranking flips immediately if this weight drops. "~1 (stable)" means it only flips at the maximum. A dash means no flip occurs across the full 0-1 range.',
    tornado:     'Tornado Chart: ranks criteria by how much the winner score margin changes when that criterion weight is swept from 0 to 1. A longer bar means this criterion has higher influence on the ranking outcome.',
    sensTop:     'The alternative currently ranked first under the sandbox weights. Flashes blue when the leader changes as you move sliders.',
    sensMargin:  'Score gap between 1st and 2nd ranked alternatives under the current sandbox weights. A small margin (less than 0.5) suggests the ranking is sensitive to weight changes. Consider using the Magnifying Glass or switching to DISCRIM.',
    breakdown:   'Score Breakdown Tree: shows how each criterion contributes to each alternative total score. Each leaf shows its global weight and per-alternative values as raw score and weighted contribution (raw x Wt). Scroll horizontally to see all alternatives.',
    totalCol:    'Sum of all weighted criterion contributions for this alternative. This equals the overall score shown in the Rankings card.',
    magnify:     'Magnifying Glass (O Brien and Brugha 2010): when two alternatives score very close overall, this tool focuses the evaluation on one sub-branch of the criteria tree, renormalising weights within that branch to reveal subtle differences.',
    focusBranch: 'Restricts the ranking to only the leaf criteria under the selected top-level criterion. Weights are renormalised within that branch so local ratios are preserved.',
    exitMagnify: 'Restores the full-tree ranking using all criteria and their original weights.',
    refinePanel: 'Stage 7 (Pliability) of the Brugha 8-stage DISC cycle. After seeing initial results, revise your decision setup based on what the data reveals, before committing to a final recommendation.',
    refineScores:'Returns to the Scoring step (Step 3) to revise any scores. An automatic session checkpoint is saved first so you can restore this state if needed.',
    refineWeights:'Returns to the Weights step (Step 2) to adjust criterion or tier weights, or to add and remove criteria. An automatic checkpoint is saved first.',
    refineSet:   'Opens the Modify Alternatives panel where you can remove an existing alternative or add a new one. Removed alternatives are cached and can be restored with their original scores using the Re-add button.',
    switchMode:  'Switches between DISCUS (independent utility scoring) and DISCRIM (relative intensity allocation) and returns to Step 3. Scores for each mode are stored independently in memory.',
    fillSample:  'Fills all scoring cells with randomly generated sample scores drawn uniformly within the valid range. Useful for exploring the tool before entering real data. Any existing scores are overwritten.',
    clearAll:    'Clears all scores in the current mode (DISCUS or DISCRIM), resetting every cell to 0. Weights and criteria are not affected. Save your session first if you want to retain the current scores.',
  };

  // Escape HTML special characters - used everywhere we put user text into HTML
  function _esc(str) {
    if(str==null) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  let _weightsValidated = false;
  let _scoresValidated  = false;
  let _removedAlts = []; // cache: [{name, scoresUS, scoresRIM, scoreOrigin}]

  // Check if all weight groups sum to 1.00 (within tolerance)
  function _getWeightErrors() {
    const errors = [];
    const cw = State.getCritW ? State.getCritW() : {};
    const tw = State.getTierW ? State.getTierW() : {};
    const leaves = State.getLeaves ? State.getLeaves() : [];
    const activeTiers = State.TIERS ? State.TIERS.filter(t => leaves.some(c => c.tier === t)) : [];

    const tierTot = activeTiers.reduce((s, t) => s + (tw[t] || 0), 0);
    if (Math.abs(tierTot - 1) >= 0.005) {
      errors.push(`Tier weights total ${tierTot.toFixed(2)}, must equal 1.00`);
    }

    const processedGroups = new Set();
    if (State.getCrits) {
      State.getCrits().forEach(c => {
        const groupKey = c.parentId || ('tier_' + c.tier);
        if (processedGroups.has(groupKey)) return;
        processedGroups.add(groupKey);
        const sibs = State.getSiblings ? State.getSiblings(c.id) : [];
        const tot = sibs.reduce((s, cc) => s + (cw[cc.id] || 0), 0);
        if (Math.abs(tot - 1) >= 0.005) errors.push(`A criteria weight group totals ${tot.toFixed(2)}, must equal 1.00`);
      });
    }
    return errors;
  }

  // Validate scores before computing results
  // Different rules for DISCUS vs DISCRIM
  function _getScoreErrors() {
    const mode = State.getMode(), b = State.getBasis(), leaves = State.getLeaves();
    const errors = [];
    const storeUS = State.getScoresUS(), storeRIM = State.getScoresRIM();

    if (mode === 'US') {
      // DISCUS: check if all cells are still 0 (no user input)
      const totalUS = State.getAlts().reduce((s,_,ai) =>
        s + leaves.reduce((ls,c) => ls+((storeUS[ai]&&storeUS[ai][c.id]!=null)?storeUS[ai][c.id]:0), 0), 0);
      if (totalUS === 0) {
        errors.push('No scores entered. Please score at least one alternative before computing results.');
        return errors;
      }
      // Check each cell is within valid range
      State.getAlts().forEach((a, ai) => {
        leaves.forEach(c => {
          const v = (storeUS[ai] && storeUS[ai][c.id] != null) ? storeUS[ai][c.id] : 0;
          if (v > b + 0.001 || v < -0.001)
            errors.push(`"${a}", "${c.name}": value ${v} is outside the valid 0 to ${b} range`);
        });
      });
    }

    if (mode === 'RIM') {
      // DISCRIM: every criterion row must sum exactly to basis
      // Do NOT use an early-return totalSum check  -  default ensure() values are non-zero
      leaves.forEach(c => {
        const sum = State.getAlts().reduce((s,_,ai) =>
          s + ((storeRIM[ai]&&storeRIM[ai][c.id]!=null) ? storeRIM[ai][c.id] : 0), 0);
        if (Math.abs(sum - b) >= RIM_SUM_TOL)
          errors.push(`Criterion "${c.name}": row total ${sum.toFixed(1)} must equal ${b} (allocate across all alternatives)`);
      });
    }
    return errors;
  }

  // Shows a friendly message when the user tries to jump ahead
  function _showStepBlockedMsg(missing) {
    const msg = missing === 'both'
      ? 'Please complete <strong>Weights</strong> (Step 2) and <strong>Scoring</strong> (Step 3) before viewing Results.'
      : missing === 'weights'
      ? 'Please complete <strong>Weights</strong> (Step 2) before viewing Results.'
      : 'Please complete <strong>Scoring</strong> (Step 3) before viewing Results.';
    let toast = document.getElementById('_nav-blocked-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = '_nav-blocked-toast';
      toast.style.cssText = 'position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:9999;background:var(--error,#D93636);color:#fff;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.25);pointer-events:none;transition:opacity .3s';
      document.body.appendChild(toast);
    }
    toast.innerHTML = '⚠ ' + msg;
    toast.style.opacity = '1';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
  }

  // Navigate to a different step
  // Validates that you're allowed to go to step 4 (need valid weights + scores first)
  function goStep(n) {
    if (n === 4) {
      const scoreErrors = _getScoreErrors();
      const weightErrors = _getWeightErrors();
      const scoresValid = scoreErrors.length === 0;
      const weightsValid = weightErrors.length === 0;

      if (!scoresValid || !weightsValid) {
        const missing = (!scoresValid && !weightsValid) ? 'both'
                      : !weightsValid ? 'weights'
                      : 'scores';
        _showStepBlockedMsg(missing);
        n = !weightsValid ? 2 : 3;
      }
    }
    State.setStep(n);
    for(let i=1;i<=4;i++){
      const pane=document.getElementById('pane'+i), sb=document.getElementById('sb'+i);
      if(!pane||!sb) continue;
      pane.classList.toggle('active',i===n);
      sb.classList.remove('active','done');
      if(i===n) sb.classList.add('active');
      if(i<n)  sb.classList.add('done');
    }
    if(n===1) _renderStep1();
    if(n===2) _renderStep2();
    if(n===3) _renderStep3();
    if(n===4) _renderStep4();
    // Reset pane3 background when leaving step 3
    if(n!==3) {
      const p3=document.getElementById('pane3');
      if(p3) { p3.style.background=''; p3.style.borderRadius=''; }
    }
    // Scroll the main content area to top  -  .main has overflow-y:auto so window.scrollTo has no effect
    const mainEl = document.getElementById('mainContent');
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    const expBtn=document.getElementById('btnExport');
    if(expBtn) expBtn.style.display=n===4?'flex':'none';
  }

  /* ── STEP 1: SETUP with editable lists and hierarchical criteria ── */
  // ── STEP 1: SETUP ──────────────────────────────────────────────
  function _renderStep1() {
    const pane=document.getElementById('pane1');
    pane.innerHTML=`
      <div class="g2">
        <!-- Alternatives -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Alternatives</div>
            <div class="card-sub">The options under evaluation. Click a name to edit. Between 2 and 15 alternatives.</div>
          </div>
          <div id="alt-list">${_altListHTML()}</div>
          <div class="btn-row" style="margin-top:10px">
            <input type="text" id="na" placeholder="Alternative name…" style="flex:1" onkeydown="if(event.key==='Enter')UI._addAlt()">
            <button class="btn btn-p btn-sm" onclick="UI._addAlt()">+ Add</button>
          </div>
        </div>

        <!-- Criteria with hierarchy -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Criteria</div>
            <div class="card-sub">Assign tier, expand to add sub-criteria, click name to edit</div>
          </div>
          <div id="crit-list">${_critListHTML()}</div>
          <div class="btn-row" style="margin-top:10px;flex-wrap:wrap">
            <input type="text" id="nc" placeholder="Criterion name…" style="flex:1;min-width:100px" onkeydown="if(event.key==='Enter')UI._addCrit()">
            <select id="nt" aria-label="Select tier for new criterion" style="width:130px">
              <option value="somatic">Somatic</option>
              <option value="psychic">Psychic</option>
              <option value="pneumatic">Pneumatic</option>
            </select>
            <button class="btn btn-p btn-sm" onclick="UI._addCrit()">+ Add Top-Level</button>
          </div>
        </div>
      </div>

      <!-- Scoring Mode -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Scoring Mode</div>
          <div class="card-sub">Select before scoring. Can be changed at any time.</div>
        </div>
        <div class="mode-toggle" style="max-width:420px;margin-bottom:10px">
          <button class="mode-btn ${State.getMode()==='US'?'on':''}" id="mUS" onclick="State.setMode('US');UI._refreshModeNote()" data-tip="${_TIP.discus}">DISCUS: Utility Scoring</button>
          <button class="mode-btn ${State.getMode()==='RIM'?'on':''}" id="mRIM" onclick="State.setMode('RIM');UI._refreshModeNote()" data-tip="${_TIP.discrim}">DISCRIM: Relative Intensity</button>
        </div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;flex-wrap:wrap">
          <span style="font-size:12px;color:var(--ink2);font-family:var(--font-mono)" data-tip="${_TIP.basis}">Scoring scale (upper limit):</span>
          ${[10,50,100].map(v=>`<label style="display:flex;align-items:center;gap:5px;font-size:12px;cursor:pointer;font-family:var(--font-mono)">
            <input type="radio" name="basis-sel" value="${v}" ${State.getBasis()===v?'checked':''}
              onchange="State.setBasis(${v});State.clearScores();UI._refreshModeNote();UI.toast('Scale set to 0 to ${v}. Scores cleared.')">
            0 to ${v}
          </label>`).join('')}
        </div>
        <div class="ibar" id="modeNote"></div>
      </div>

      <!-- Templates -->
      <div class="card">
        <div class="card-header">
          <div class="card-title" data-tip="${_TIP.templates}">Quick-Start Templates</div>
          <div class="card-sub">Pre-built decision problems, fully editable</div>
        </div>
        <div class="tpl-row">
          ${Templates.getAll().map(t=>`<span class="tpl" onclick="UI._loadTpl('${t.key}')">${t.label}</span>`).join('')}
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end">
        <button class="btn btn-p" onclick="UI.goStep(2)">Continue to Weights →</button>
      </div>`;
    _refreshModeNote();
  }

  /* Alternatives: editable inline */
  function _altListHTML() {
    const alts=State.getAlts();
    if(!alts.length) return '<div class="irow"><span class="irow-name text-muted">No alternatives yet</span></div>';
    return alts.map((a,i)=>`
      <div class="irow" id="alt-row-${i}">
        <span class="irow-name" id="alt-label-${i}" style="cursor:pointer" onclick="UI._startEditAlt(${i})">${_esc(a)}</span>
        <button class="xbtn" onclick="UI._removeAlt(${i})" aria-label="Remove">×</button>
      </div>`).join('');
  }

  function _startEditAlt(i) {
    const label=document.getElementById(`alt-label-${i}`); if(!label) return;
    const cur=State.getAlts()[i];
    label.outerHTML=`<input class="inline-edit" id="alt-edit-${i}" value="${_esc(cur)}" 
      onblur="UI._finishEditAlt(${i})" 
      onkeydown="if(event.key==='Enter')UI._finishEditAlt(${i});if(event.key==='Escape'){UI._cancelEditAlt(${i},'${_esc(cur)}')}">`;
    const inp=document.getElementById(`alt-edit-${i}`);
    if(inp){inp.focus();inp.select();}
  }
  function _finishEditAlt(i) {
    const inp=document.getElementById(`alt-edit-${i}`); if(!inp) return;
    const v=inp.value.trim(); if(v) State.renameAlt(i,v);
    document.getElementById('alt-list').innerHTML=_altListHTML();
  }
  function _cancelEditAlt(i) { document.getElementById('alt-list').innerHTML=_altListHTML(); }

  function _addAlt() {
    const v = (document.getElementById('na').value || '').trim(); if (!v) return;
    const exists = State.getAlts().some(a => a.trim().toLowerCase() === v.toLowerCase());
    if (exists) {
      toast(`⚠ "${v}" already exists as an alternative.`);
      return;
    }
    State.addAlt(v); document.getElementById('na').value = '';
    document.getElementById('alt-list').innerHTML = _altListHTML();
  }
  function _removeAlt(i) { State.removeAlt(i); document.getElementById('alt-list').innerHTML=_altListHTML(); }

  /* Hierarchical criteria list */
  function _critListHTML() {
    const topLevel=State.getTopLevel();
    if(!topLevel.length) return '<div class="no-crits">No criteria yet. Add one below.</div>';
    // Group by tier
    const byTier={};
    State.TIERS.forEach(t=>{byTier[t]=topLevel.filter(c=>c.tier===t);});
    let html='';
    State.TIERS.forEach(t=>{
      if(!byTier[t].length) return;
      html+=`<div style="margin-bottom:6px;font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:${State.TIER_COLORS[t]};padding:4px 0 2px" data-tip="${_TIP[t]}">${t}</div>`;
      byTier[t].forEach(c=>{ html+=_critGroupHTML(c); });
    });
    return html;
  }

  function _critGroupHTML(crit) {
    const children=State.getChildren(crit.id);
    const hasChildren=children.length>0;
    const badge=`<span class="badge ${State.TIER_BADGE[crit.tier]}" data-tip="${_TIP[crit.tier]}">${crit.tier.slice(0,3)}</span>`;
    return `
      <div class="crit-group" id="cg-${crit.id}">
        <div class="crit-group-head" onclick="UI._toggleCritGroup('${crit.id}')">
          <span class="crit-group-toggle ${hasChildren?'open':''}" id="toggle-${crit.id}">▶</span>
          <span class="crit-group-name" id="crit-label-${crit.id}" 
            onclick="event.stopPropagation();UI._startEditCrit('${crit.id}')"
            style="cursor:pointer">${_esc(crit.name)}</span>
          ${badge}
          <div class="crit-group-actions" onclick="event.stopPropagation()">
            <button class="edit-btn" title="Add sub-criterion" onclick="UI._showSubAdd('${crit.id}')">+</button>
            <button class="xbtn" onclick="UI._removeCrit('${crit.id}')" aria-label="Remove criterion ${_esc(crit.name)}" title="Remove ${_esc(crit.name)}">×</button>
          </div>
        </div>
        <div class="crit-sub-list" id="sub-${crit.id}" style="${hasChildren?'':'display:none'}">
          ${children.map(ch=>_subCritHTML(ch)).join('')}
          <div class="sub-add-row" id="subadd-${crit.id}" style="display:none">
            <input class="inline-edit" id="subinput-${crit.id}" placeholder="Sub-criterion name…"
              onkeydown="if(event.key==='Enter')UI._addSubCrit('${crit.id}');if(event.key==='Escape')UI._hideSubAdd('${crit.id}')">
            <button class="btn btn-p btn-sm" onclick="UI._addSubCrit('${crit.id}')">Add</button>
            <button class="btn btn-sm" onclick="UI._hideSubAdd('${crit.id}')">Cancel</button>
          </div>
        </div>
      </div>`;
  }

  function _subCritHTML(crit) {
    const children=State.getChildren(crit.id);
    const hasChildren=children.length>0;
    return `
      <div id="sub-row-${crit.id}">
        <div class="crit-sub-row">
          <span style="color:var(--ink4);font-size:10px;flex-shrink:0">${hasChildren?'▼':'└'}</span>
          <span class="crit-sub-name" id="crit-label-${crit.id}" style="cursor:pointer"
            onclick="UI._startEditCrit('${crit.id}')">${_esc(crit.name)}</span>
          <div class="crit-group-actions">
            <button class="edit-btn" title="Add sub-criterion" onclick="UI._showSubAdd('${crit.id}')">+</button>
            <button class="xbtn" onclick="UI._removeCrit('${crit.id}')" aria-label="Remove criterion ${_esc(crit.name)}" title="Remove ${_esc(crit.name)}">×</button>
          </div>
        </div>
        ${hasChildren?`<div style="padding-left:14px">${children.map(ch=>_subCritHTML(ch)).join('')}</div>`:''}
        <div class="sub-add-row" id="subadd-${crit.id}" style="display:none;padding-left:14px">
          <input class="inline-edit" id="subinput-${crit.id}" placeholder="Sub-criterion name…"
            onkeydown="if(event.key==='Enter')UI._addSubCrit('${crit.id}');if(event.key==='Escape')UI._hideSubAdd('${crit.id}')">
          <button class="btn btn-p btn-sm" onclick="UI._addSubCrit('${crit.id}')">Add</button>
          <button class="btn btn-sm" onclick="UI._hideSubAdd('${crit.id}')">Cancel</button>
        </div>
      </div>`;
  }

  function _toggleCritGroup(id) {
    const sub=document.getElementById(`sub-${id}`);
    const tog=document.getElementById(`toggle-${id}`);
    if(!sub||!tog) return;
    const open=sub.style.display==='none';
    sub.style.display=open?'':'none';
    tog.classList.toggle('open',open);
  }
  function _showSubAdd(parentId) {
    const children=State.getChildren(parentId);
    // Ensure parent's sub-list is visible
    const subList=document.getElementById(`sub-${parentId}`);
    if(subList) subList.style.display='';
    const tog=document.getElementById(`toggle-${parentId}`);
    if(tog) tog.classList.add('open');
    const row=document.getElementById(`subadd-${parentId}`);
    if(row){row.style.display='flex';}
    const inp=document.getElementById(`subinput-${parentId}`);
    if(inp){inp.focus();inp.value='';}
  }
  function _hideSubAdd(parentId) {
    const row=document.getElementById(`subadd-${parentId}`);
    if(row) row.style.display='none';
  }
  function _addSubCrit(parentId) {
    const inp=document.getElementById(`subinput-${parentId}`);
    if(!inp) return;
    const v=inp.value.trim(); if(!v) return;
    State.addCrit(v,null,parentId); // tier inherited
    _hideSubAdd(parentId);
    document.getElementById('crit-list').innerHTML=_critListHTML();
    // re-open the parent
    const subList=document.getElementById(`sub-${parentId}`);
    if(subList) subList.style.display='';
    const tog=document.getElementById(`toggle-${parentId}`);
    if(tog) tog.classList.add('open');
  }
  function _startEditCrit(id) {
    const label=document.getElementById(`crit-label-${id}`); if(!label) return;
    const crit=State.getCrits().find(c=>c.id===id); if(!crit) return;
    const cur=crit.name;
    const isTop=!crit.parentId;
    // Replace the label with an inline input
    const orig=label.outerHTML;
    label.outerHTML=`<input class="inline-edit" id="cedit-${id}" value="${_esc(cur)}"
      onblur="UI._finishEditCrit('${id}')"
      onkeydown="if(event.key==='Enter')UI._finishEditCrit('${id}');if(event.key==='Escape')document.getElementById('crit-list').innerHTML=UI._critListHTMLPublic()">`;
    const inp=document.getElementById(`cedit-${id}`);
    if(inp){inp.focus();inp.select();}
  }
  function _finishEditCrit(id) {
    const inp=document.getElementById(`cedit-${id}`); if(!inp) return;
    const v=inp.value.trim(); if(v) State.renameCrit(id,v);
    document.getElementById('crit-list').innerHTML=_critListHTML();
  }
  function _addCrit() {
    const nm=(document.getElementById('nc').value||'').trim(); if(!nm) return;
    const tier=document.getElementById('nt').value;
    State.addCrit(nm,tier,null);
    document.getElementById('nc').value='';
    document.getElementById('crit-list').innerHTML=_critListHTML();
  }
  function _removeCrit(id) {
    const crit=State.getCrits().find(c=>c.id===id);
    const children=State.getChildren(id);
    if(children.length>0){
      openRefineModal(
        'Remove Criterion',
        `"${crit?crit.name:id}" has ${children.length} sub-criteria. Remove all of them too?`,
        null,
        ()=>{ State.removeCrit(id); document.getElementById('crit-list').innerHTML=_critListHTML(); }
      );
      document.getElementById('refineModalConfirm').textContent='Remove All';
    } else {
      State.removeCrit(id); document.getElementById('crit-list').innerHTML=_critListHTML();
    }
  }
  function _critListHTMLPublic() { return _critListHTML(); }
  function _refreshModeNote() {
    const el=document.getElementById('modeNote'); if(!el) return;
    const b=State.getBasis();
    el.innerHTML=State.getMode()==='US'
      ?`<strong>DISCUS (Utility Scoring):</strong> Score each alternative from 0 to ${b} per criterion independently. Sub-criteria scores roll up as weighted averages.`
      :`<strong>DISCRIM (Relative Intensity):</strong> Allocate ${b} points across all alternatives per criterion. Uses power-function aggregation.`;
    document.getElementById('mUS')&&document.getElementById('mUS').classList.toggle('on',State.getMode()==='US');
    document.getElementById('mRIM')&&document.getElementById('mRIM').classList.toggle('on',State.getMode()==='RIM');
  }
  function _loadTpl(key) {
    if(!Templates.load(key)) return;
    _renderStep1(); toast('Template loaded ✓');
  }

  /* ── STEP 2: WEIGHTS ── */
  function _critTreeVizHTML() {
    const topLevel=State.getTopLevel();
    if(!topLevel.length) return '<div style="color:var(--ink3);font-size:12px;padding:8px">No criteria defined yet.</div>';
    const TIER_LABEL={somatic:'SOM',psychic:'PSY',pneumatic:'PNE'};

    function _nodeHTML(c, col, depth) {
      const children=State.getChildren(c.id);
      const gw=Compute.globalW(c);
      const indent=depth*12;
      let h=`<div style="margin-bottom:4px;padding-left:${indent}px">`;
      h+=`<div style="display:flex;justify-content:space-between;align-items:center;font-size:${depth===0?'11':'10'}px;
        font-weight:${depth===0?'600':'400'};color:${depth===0?'var(--ink)':'var(--ink2)'};
        padding:${depth===0?'4px 6px':'3px 6px'};
        background:${depth===0?col+'18':'transparent'};
        border-radius:4px;border-left:${depth===0?'3px solid '+col:'2px dashed '+col+'50'}">
        <span>${depth>0?'↳ ':''}<span>${_esc(c.name)}</span></span>
        <span style="font-family:var(--font-mono);font-size:9px;color:${depth===0?col:'var(--ink3)'}">${(gw*100).toFixed(0)}%</span>
      </div>`;
      if(children.length) h+=children.map(ch=>_nodeHTML(ch, col, depth+1)).join('');
      h+=`</div>`;
      return h;
    }

    let html='<div style="display:flex;gap:12px;flex-wrap:wrap;padding:8px 0">';
    State.TIERS.forEach(t=>{
      const tCrits=topLevel.filter(c=>c.tier===t);
      if(!tCrits.length) return;
      const col=State.TIER_COLORS[t];
      html+=`<div style="border:2px solid ${col};border-radius:8px;padding:10px 12px;min-width:140px;flex:1">`;
      html+=`<div style="font-size:9px;font-family:var(--font-mono);font-weight:700;color:${col};text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">${TIER_LABEL[t]}: ${t.charAt(0).toUpperCase()+t.slice(1)}</div>`;
      tCrits.forEach(c=>{ html+=_nodeHTML(c, col, 0); });
      html+=`</div>`;
    });
    html+='</div>';
    return html;
  }

  // Interactive donut chart showing weight distribution
  // Clicking a slice drills into that tier/criterion
  function _donutChartHTML() {
    const leaves = State.getLeaves();

    // Build tier-level slices for the top-level donut
    const tiers = State.TIERS.filter(t => leaves.some(c => c.tier === t));
    const tierSlices = tiers.map(t => {
      const tLeaves = leaves.filter(c => c.tier === t);
      const w = tLeaves.reduce((s,c) => s + Compute.globalW(c), 0);
      return { id: 'tier_'+t, name: t.charAt(0).toUpperCase()+t.slice(1), tier: t, col: State.TIER_COLORS[t], w, children: State.getCrits().filter(c => c.tier===t && !c.parentId) };
    });

    // Build crit-level slices for a given set of criteria
    function critSlices(crits) {
      return crits.map(c => {
        const cLeaves = leaves.filter(l => {
          // check if l is a descendant of c
          let cur = l;
          while (cur) { if (cur.id === c.id) return true; cur = State.getCrits().find(p => p.id === cur.parentId); }
          return false;
        });
        const w = cLeaves.length ? cLeaves.reduce((s,l) => s+Compute.globalW(l),0) : Compute.globalW(c);
        const children = State.getChildren(c.id);
        return { id: c.id, name: c.name, tier: c.tier, col: State.TIER_COLORS[c.tier], w, children, isLeaf: children.length===0 };
      });
    }

    // Render donut SVG for a set of slices
    function renderDonut(slices, title, subtitle) {
      const total = slices.reduce((s,sl) => s+sl.w, 0) || 1;
      const CX=120, CY=120, R=95, r=50, GAP=0.012;
      let angle = -Math.PI/2;
      function polar(rad,ang) { return [CX+rad*Math.cos(ang), CY+rad*Math.sin(ang)]; }
      let paths='', legend='';
      slices.forEach((sl,i) => {
        const sweep = (sl.w/total)*2*Math.PI - GAP;
        if (sweep<=0) { angle+=GAP; return; }
        const a0=angle+GAP/2, a1=a0+sweep;
        const [ox0,oy0]=polar(R,a0),[ox1,oy1]=polar(R,a1);
        const [ix0,iy0]=polar(r,a1),[ix1,iy1]=polar(r,a0);
        const large=sweep>Math.PI?1:0;
        const clickable = sl.children && sl.children.length>0;
        const onclick   = clickable ? `onclick="(function(){var el=document.getElementById('donut-chart-wrap');if(!el)return;el.innerHTML=UI._donutDrillHTML('${sl.id}','${_esc(sl.name)}','${sl.tier}');})()"` : '';
        const cursor    = clickable ? 'cursor:pointer' : '';
        paths += `<path d="M${ox0.toFixed(2)},${oy0.toFixed(2)} A${R},${R} 0 ${large},1 ${ox1.toFixed(2)},${oy1.toFixed(2)} L${ix0.toFixed(2)},${iy0.toFixed(2)} A${r},${r} 0 ${large},0 ${ix1.toFixed(2)},${iy1.toFixed(2)} Z"
          fill="${sl.col}" opacity="0.88" stroke="var(--surface)" stroke-width="2" style="${cursor}"
          ${onclick} onmouseover="this.setAttribute('opacity','1')" onmouseout="this.setAttribute('opacity','0.88')">
          <title>${_esc(sl.name)}: ${(sl.w*100).toFixed(1)}%${clickable?' - click to drill in':''}</title></path>`;
        if (sweep>0.15) {
          const midA=a0+sweep/2;
          const [lx,ly]=polar((R+r)/2, midA);
          paths += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="12" font-family="var(--font-mono)" fill="#fff" font-weight="700" style="pointer-events:none">${(sl.w*100).toFixed(0)}%</text>`;
        }
        angle = a1+GAP/2;
        legend += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
          <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${sl.col};flex-shrink:0"></span>
          <span style="font-size:12px;color:var(--ink2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px" title="${_esc(sl.name)}">${_esc(sl.name)}</span>
          <span style="font-size:11px;font-family:var(--font-mono);color:var(--ink3);margin-left:auto;white-space:nowrap">${(sl.w*100).toFixed(1)}%</span>
          ${sl.children&&sl.children.length>0?`<span style="font-size:9px;color:var(--ink3);font-family:var(--font-mono)">▶</span>`:''}
        </div>`;
      });
      return `<div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;padding:4px">
        <div style="position:relative;flex-shrink:0">
          <svg viewBox="0 0 240 240" width="200" height="200" style="overflow:visible">${paths}
            <text x="${CX}" y="${CY-7}" text-anchor="middle" font-size="12" font-family="var(--font-sans)" fill="var(--ink3)">${_esc(title)}</text>
            <text x="${CX}" y="${CY+9}" text-anchor="middle" font-size="11" font-family="var(--font-sans)" fill="var(--ink3)">${_esc(subtitle)}</text>
          </svg>
        </div>
        <div style="flex:1;min-width:150px;max-height:200px;overflow-y:auto">${legend}</div>
      </div>`;
    }

    return renderDonut(tierSlices, 'Tier', 'Weights');
  }

  // Drill-down view when user clicks a donut slice  -  drills into that tier or criterion group
  function _donutDrillHTML(sliceId, sliceName, tier) {
    const leaves = State.getLeaves();
    const col    = State.TIER_COLORS[tier];

    // Determine what to show: if sliceId starts with 'tier_' show top-level crits of that tier
    // otherwise show children of that criterion
    let crits;
    if (sliceId.startsWith('tier_')) {
      const t = sliceId.replace('tier_','');
      crits = State.getCrits().filter(c => c.tier===t && !c.parentId);
    } else {
      crits = State.getChildren(sliceId);
    }

    if (!crits.length) {
      // Leaf  -  show individual scores
      const crit = State.getCrits().find(c => c.id === sliceId);
      const gw   = crit ? Compute.globalW(crit) : 0;
      const alts = State.getAlts();
      const mode = State.getMode();
      const store = mode==='US' ? State.getScoresUS() : State.getScoresRIM();
      const bars  = alts.map((_,ai) => {
        const raw = (store[ai]&&store[ai][sliceId]!=null) ? +store[ai][sliceId] : 0;
        const wt  = gw * raw;
        return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <div style="font-size:12px;font-weight:600;color:var(--ink);min-width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_esc(alts[ai])}</div>
          <div style="flex:1;height:16px;background:var(--border);border-radius:8px;overflow:hidden">
            <div style="height:100%;width:${State.getBasis()>0?(raw/State.getBasis()*100).toFixed(0):0}%;background:${col};border-radius:8px"></div>
          </div>
          <div style="font-size:11px;font-family:var(--font-mono);color:${col};font-weight:700;min-width:40px;text-align:right">${raw.toFixed(1)} → ${wt.toFixed(2)}</div>
        </div>`;
      }).join('');
      return `<div style="padding:8px">
        <button onclick="UI._renderDonutChart()" style="font-size:11px;color:${col};background:none;border:none;cursor:pointer;padding:0;margin-bottom:10px;display:flex;align-items:center;gap:4px">
          ← Back to overview
        </button>
        <div style="font-size:13px;font-weight:700;color:var(--ink);margin-bottom:6px">${_esc(sliceName)}</div>
        <div style="font-size:11px;font-family:var(--font-mono);color:${col};margin-bottom:10px">Wt: ${(gw*100).toFixed(1)}%</div>
        ${bars}
      </div>`;
    }

    // Build slices for children
    const slices = crits.map(c => {
      const cLeaves = leaves.filter(l => { let cur=l; while(cur){if(cur.id===c.id)return true; cur=State.getCrits().find(p=>p.id===cur.parentId);} return false; });
      const w = cLeaves.length ? cLeaves.reduce((s,l)=>s+Compute.globalW(l),0) : Compute.globalW(c);
      return {id:c.id, name:c.name, tier, col, w, children:State.getChildren(c.id), isLeaf:State.getChildren(c.id).length===0};
    });

    const total = slices.reduce((s,sl)=>s+sl.w,0)||1;
    const CX=120,CY=120,R=95,r=50,GAP=0.012;
    let angle=-Math.PI/2;
    function polar(rad,ang){return[CX+rad*Math.cos(ang),CY+rad*Math.sin(ang)];}
    let paths='', legend='';

    // Generate distinguishable shades within tier colour
    slices.forEach((sl,i) => {
      const sweep=(sl.w/total)*2*Math.PI-GAP;
      if(sweep<=0){angle+=GAP;return;}
      const a0=angle+GAP/2,a1=a0+sweep;
      const[ox0,oy0]=polar(R,a0),[ox1,oy1]=polar(R,a1);
      const[ix0,iy0]=polar(r,a1),[ix1,iy1]=polar(r,a0);
      const large=sweep>Math.PI?1:0;
      // Shade: lighten progressively for each slice at this level
      const opacity = 0.95 - i*0.08;
      const clickable = sl.children&&sl.children.length>0;
      const onclick   = clickable ? `onclick="(function(){var el=document.getElementById('donut-chart-wrap');if(!el)return;el.innerHTML=UI._donutDrillHTML('${sl.id}','${_esc(sl.name)}','${tier}');})()"` : '';
      const cursor    = clickable ? 'cursor:pointer' : '';

      paths+=`<path d="M${ox0.toFixed(2)},${oy0.toFixed(2)} A${R},${R} 0 ${large},1 ${ox1.toFixed(2)},${oy1.toFixed(2)} L${ix0.toFixed(2)},${iy0.toFixed(2)} A${r},${r} 0 ${large},0 ${ix1.toFixed(2)},${iy1.toFixed(2)} Z"
        fill="${col}" opacity="${opacity}" stroke="var(--surface)" stroke-width="2" style="${cursor}"
        ${onclick} onmouseover="this.setAttribute('opacity',Math.min(1,${opacity}+0.1))" onmouseout="this.setAttribute('opacity','${opacity}')">
        <title>${_esc(sl.name)}: ${(sl.w*100).toFixed(1)}%${clickable?' - click to drill in':''}</title></path>`;
      if(sweep>0.15){const midA=a0+sweep/2;const[lx,ly]=polar((R+r)/2,midA);paths+=`<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="12" font-family="var(--font-mono)" fill="#fff" font-weight="700" style="pointer-events:none">${(sl.w*100).toFixed(0)}%</text>`;}
      angle=a1+GAP/2;

      legend+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
        <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${col};opacity:${opacity};flex-shrink:0"></span>
        <span style="font-size:12px;color:var(--ink2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px" title="${_esc(sl.name)}">${_esc(sl.name)}</span>
        <span style="font-size:11px;font-family:var(--font-mono);color:var(--ink3);margin-left:auto">${(sl.w*100).toFixed(1)}%</span>
        ${clickable?`<span style="font-size:9px;color:${col};font-family:var(--font-mono)">▶</span>`:''}
      </div>`;
    });

    return `<div style="padding:4px">
      <button onclick="UI._renderDonutChart()" style="font-size:11px;color:${col};background:none;border:none;cursor:pointer;padding:0;margin-bottom:8px;display:flex;align-items:center;gap:4px">
        ← Back to overview
      </button>
      <div style="font-size:11px;font-weight:700;color:${col};font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">${_esc(sliceName)}</div>
      <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
        <div style="flex-shrink:0">
          <svg viewBox="0 0 240 240" width="200" height="200" style="overflow:visible">${paths}
            <text x="${CX}" y="${CY-7}" text-anchor="middle" font-size="12" font-family="var(--font-sans)" fill="${col}">${_esc(sliceName)}</text>
            <text x="${CX}" y="${CY+9}" text-anchor="middle" font-size="11" font-family="var(--font-sans)" fill="var(--ink3)">breakdown</text>
          </svg>
        </div>
        <div style="flex:1;min-width:150px;max-height:200px;overflow-y:auto">${legend}</div>
      </div>
    </div>`;
  }

  // ── STEP 2: WEIGHTS ────────────────────────────────────────────
  function _renderStep2() {
    const pane=document.getElementById('pane2');
    pane.innerHTML=`
      <div class="ibar"><strong>Stage 5 - Verifiable:</strong> Assign direct weights. Tier weights and criterion weights within each group must sum to 1.0.</div>
      <div class="card" style="margin-bottom:1.25rem">
        <div class="card-header"><div class="card-title" data-tip="${_TIP.criteriaTree}">Criteria Tree</div><div class="card-sub">Visual hierarchy showing tiers and sub-criteria with global weights</div></div>
        <div id="crit-tree-viz" style="overflow-x:auto">${_critTreeVizHTML()}</div>
      </div>
      <div class="g2">
        <div class="card">
          <div class="card-header"><div class="card-title" data-tip="${_TIP.tierWeights}">Tier Weights</div><div class="card-sub">Relative importance of Somatic, Psychic and Pneumatic</div></div>
          <div id="tier-weights"></div>
          <div class="btn-row" style="margin-top:10px">
            <button class="btn btn-sm" onclick="UI._equalTierW()" data-tip="${_TIP.equal}">Equal</button>
            <button class="btn btn-sm" onclick="UI._normTierW()" data-tip="${_TIP.normalise}">Normalise</button>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title" data-tip="${_TIP.critWeights}">Criterion Weights</div><div class="card-sub">Within-group weights, each group sums to 1.0</div></div>
          <div id="crit-weights"></div>
          <div class="btn-row" style="margin-top:10px">
            <button class="btn btn-sm" onclick="UI._equalCritW()" data-tip="${_TIP.equal}">Equal all</button>
            <button class="btn btn-sm" onclick="UI._normCritW()" data-tip="${_TIP.normalise}">Normalise all</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title" data-tip="${_TIP.donut}">Criterion Contribution</div><div class="card-sub">Global weight of each leaf criterion across all tiers</div></div>
        <div id="donut-chart-wrap">${_donutChartHTML()}</div>
      </div>
            <div id="weights-validation-msg" style="display:none"></div>
      <div class="btn-row" style="justify-content:space-between">
        <button class="btn btn-ghost" onclick="UI.goStep(1)">← Back</button>
        <button class="btn btn-p" onclick="UI._proceedToScoring()">Continue to Scoring →</button>
      </div>`;
    _renderTierWeights();
    _renderCritWeights();
    _renderDonutChart(); _renderCritTree();
    _weightsValidated = false;
  }

  function _renderTierWeights() {
    const leaves=State.getLeaves();
    const at=State.TIERS.filter(t=>leaves.some(c=>c.tier===t));
    const tw=State.getTierW();
    const tot=at.reduce((s,t)=>s+(tw[t]||0),0);
    document.getElementById('tier-weights').innerHTML=
      at.map(t=>`
        <div class="wrow">
          <div class="wname" style="color:${State.TIER_COLORS[t]};font-family:var(--font-mono);font-size:10px;text-transform:uppercase" data-tip="${_TIP[t]}">${t}</div>
          <input type="range" min="0" max="100" step="1" value="${Math.round((tw[t]||0)*100)}"
            oninput="UI._updTierW('${t}',+this.value/100)" style="flex:1">
          <div class=\"wval${Math.abs(tot-1)<.005?'':' wval-err'}\" id=\"twv-${t}\">${(tw[t]||0).toFixed(2)}</div>
        </div>`).join('')+
      `<div class=\"wtot-row\"><span class=\"text-muted\">Total</span>
        <span class=\"wtot ${Math.abs(tot-1)<.005?'ok':'warn'}\" id=\"tier-tot\">${tot.toFixed(2)}</span></div>`;
  }
  function _updTierW(t,v) {
    State.setTierW(t,v);
    _weightsValidated = false;
    const leaves=State.getLeaves();
    const at=State.TIERS.filter(tt=>leaves.some(c=>c.tier===tt));
    const tot=at.reduce((s,tt)=>s+(State.getTierW()[tt]||0),0);
    const valid=Math.abs(tot-1)<.005;
    // Update every tier value box colour (they all share the same total)
    at.forEach(tt=>{
      const e=document.getElementById('twv-'+tt);
      if(e){ e.textContent=(State.getTierW()[tt]||0).toFixed(2); e.className='wval'+(valid?'':' wval-err'); }
    });
    const te=document.getElementById('tier-tot');
    if(te){te.textContent=tot.toFixed(2);te.className='wtot '+(valid?'ok':'warn');}
    _renderDonutChart(); _renderCritTree();
  }

  /* Render criterion weights at every level recursively */
  function _renderCritWeights() {
    const el=document.getElementById('crit-weights'); if(!el) return;
    el.innerHTML=State.TIERS.filter(t=>State.getLeaves().some(c=>c.tier===t)).map(t=>{
      const topForTier=State.getTopLevel().filter(c=>c.tier===t);
      const col=State.TIER_COLORS[t];
      return `<div style="margin-bottom:12px">
        <div style="font-family:var(--font-mono);font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:${col};margin-bottom:5px">${t}</div>
        ${topForTier.map(c=>_critWeightGroupHTML(c,0,col)).join('')}
      </div>`;
    }).join('');
  }

  function _critWeightGroupHTML(crit, depth, col) {
    const children=State.getChildren(crit.id);
    const cw=State.getCritW();
    const sibs=State.getSiblings(crit.id);
    const tot=sibs.reduce((s,c)=>s+(cw[c.id]||0),0);
    const isLastInSibs=sibs[sibs.length-1]?.id===crit.id;
    const isChild=depth>0;
    const indentPx=depth*20;
    // Effective normalised weight for this criterion within its sibling group
    const normW = tot > 0 ? ((cw[crit.id]||0) / tot) : 0;
    let html=`
      <div class="wrow" style="padding-left:${indentPx}px;${isChild?'border-left:3px solid '+col+'35;margin-left:8px;':''}">
        <div class="wname" style="font-size:${isChild?'12':'13'}px;color:${isChild?'var(--ink2)':'var(--ink)'}">
          ${isChild?`<span style="color:${col};opacity:.7;margin-right:3px">↳</span>`:''}${_esc(crit.name)}
        </div>
        <div style="flex:1;display:flex;flex-direction:column;gap:1px">
          <input type="range" min="0" max="100" step="1" value="${Math.round((cw[crit.id]||0)*100)}"
            oninput="UI._updCritW('${crit.id}',+this.value/100,'${crit.parentId||'ROOT'}')" style="width:100%;accent-color:${col}">
          <div style="display:flex;justify-content:space-between;font-size:10px;font-family:var(--font-mono);color:var(--ink3);margin-top:1px;padding:0 2px">
            <span>0.00</span>
            <span id="weff-${crit.id}" style="color:${col};font-weight:600"
              title="Valid range for this criterion given current sibling weights">
              ${(()=>{
                const othersSum = sibs.filter(s=>s.id!==crit.id).reduce((s,c)=>s+(cw[c.id]||0),0);
                const remaining = Math.max(0, 1 - othersSum);
                return '0.00 – ' + remaining.toFixed(2);
              })()}
            </span>
            <span>1.00</span>
          </div>
        </div>
        <div class="wval${Math.abs(tot-1)<.005?'':' wval-err'}" id="cwv-${crit.id}" style="font-size:13px">${(cw[crit.id]||0).toFixed(2)}</div>
      </div>`;
    if(isLastInSibs) {
      const grpId=crit.parentId||'tier_'+crit.tier;
      html+=`<div class="wtot-row" style="padding-left:${indentPx}px;padding-bottom:6px;border-bottom:1px solid var(--border2)">
        <span class="text-muted" style="font-size:13px" data-tip="${_TIP.groupTotal}">${isChild?'Sub-group':'Group'} total</span>
        <span class="wtot ${Math.abs(tot-1)<.005?'ok':'warn'}" id="ctot-${grpId}">${tot.toFixed(2)}</span>
      </div>`;
    }
    if(children.length>0) {
      html+=children.map(ch=>_critWeightGroupHTML(ch, depth+1, col)).join('');
    }
    return html;
  }

  function _updCritW(id,v,parentOrTier) {
    State.setCritW(id,v);
    _weightsValidated = false;
    const crit=State.getCrits().find(c=>c.id===id); if(!crit) return;
    const sibs=State.getSiblings(id);
    const tot=sibs.reduce((s,c)=>s+(State.getCritW()[c.id]||0),0);
    const valid=Math.abs(tot-1)<.005;
    // Update every sibling's value box and effective weight hint
    sibs.forEach(sib=>{
      const e=document.getElementById('cwv-'+sib.id);
      if(e){ e.textContent=(State.getCritW()[sib.id]||0).toFixed(2); e.className='wval'+(valid?'':' wval-err'); e.style.fontSize='11px'; }
      // Update the range hint: show 0.00 - (1 - sum of other siblings)
      const sibsForHint = State.getSiblings(sib.id);
      const othersSum = sibsForHint.filter(s => s.id !== sib.id)
        .reduce((s, c) => s + (State.getCritW()[c.id] || 0), 0);
      const remaining = Math.max(0, 1 - othersSum);
      const hintEl = document.getElementById('weff-'+sib.id);
      if (hintEl) {
        hintEl.textContent = `0.00 - ${remaining.toFixed(2)}`;
        hintEl.title = `Valid range: 0 to ${remaining.toFixed(2)} (remaining after sibling weights)`;
      }
    });
    const grpId=crit.parentId||'tier_'+crit.tier;
    const te=document.getElementById('ctot-'+grpId);
    if(te){te.textContent=tot.toFixed(2);te.className='wtot '+(valid?'ok':'warn');}
    _renderDonutChart(); _renderCritTree();
  }
  function _equalTierW() {
    const leaves=State.getLeaves();
    const at=State.TIERS.filter(t=>leaves.some(c=>c.tier===t));
    at.forEach(t=>State.setTierW(t,1/at.length));
    _renderTierWeights(); _renderDonutChart(); _renderCritTree();
  }
  function _normTierW() {
    const leaves=State.getLeaves();
    const at=State.TIERS.filter(t=>leaves.some(c=>c.tier===t));
    const s=at.reduce((ss,t)=>ss+(State.getTierW()[t]||0),0)||1;
    at.forEach(t=>State.setTierW(t,(State.getTierW()[t]||0)/s));
    _renderTierWeights(); _renderDonutChart(); _renderCritTree();
  }
  function _equalCritW() {
    State.getCrits().forEach(c=>{
      const sibs=State.getSiblings(c.id);
      State.setCritW(c.id,1/Math.max(sibs.length,1));
    });
    _renderCritWeights(); _renderDonutChart(); _renderCritTree();
  }
  function _normCritW() {
    // Normalise within each sibling group
    const processed=new Set();
    State.getCrits().forEach(c=>{
      const key=c.parentId||('T'+c.tier);
      if(processed.has(key)) return;
      processed.add(key);
      const sibs=State.getSiblings(c.id);
      const s=sibs.reduce((ss,cc)=>ss+(State.getCritW()[cc.id]||0),0)||1;
      sibs.forEach(cc=>State.setCritW(cc.id,(State.getCritW()[cc.id]||0)/s));
    });
    _renderCritWeights(); _renderDonutChart(); _renderCritTree();
  }

  function _renderDonutChart() {
    const el = document.getElementById('donut-chart-wrap');
    if (!el) return;
    el.innerHTML = _donutChartHTML();
  }
  function _renderCritTree() {
    const el = document.getElementById('crit-tree-viz');
    if (!el) return;
    el.innerHTML = _critTreeVizHTML();
  }
  function _proceedToScoring() {
    const errors = [];
    const cw = State.getCritW();
    const tw = State.getTierW();
    const leaves = State.getLeaves();
    const activeTiers = State.TIERS.filter(t => leaves.some(c => c.tier === t));

    // Check tier weights sum to 1.0
    const tierTot = activeTiers.reduce((s, t) => s + (tw[t] || 0), 0);
    if (Math.abs(tierTot - 1) >= 0.005) {
      errors.push(`Tier weights total <strong>${tierTot.toFixed(2)}</strong>, must equal 1.00`);
    }

    // Check each sibling group sums to 1.0
    const processedGroups = new Set();
    State.getCrits().forEach(c => {
      const groupKey = c.parentId || ('tier_' + c.tier);
      if (processedGroups.has(groupKey)) return;
      processedGroups.add(groupKey);
      const sibs = State.getSiblings(c.id);
      const tot = sibs.reduce((s, cc) => s + (cw[cc.id] || 0), 0);
      if (Math.abs(tot - 1) >= 0.005) {
        const groupLabel = c.parentId
          ? (State.getCrits().find(p => p.id === c.parentId)?.name || groupKey) + ' sub-criteria'
          : c.tier.charAt(0).toUpperCase() + c.tier.slice(1) + ' criteria';
        errors.push(`<strong>${groupLabel}</strong> group total is <strong>${tot.toFixed(2)}</strong>, must equal 1.00`);
      }
    });

    const msgEl = document.getElementById('weights-validation-msg');
    if (errors.length === 0) {
      if (msgEl) msgEl.style.display = 'none';
      _weightsValidated = true;
      goStep(3);
    } else {
      if (msgEl) {
        msgEl.style.display = 'block';
        msgEl.innerHTML = `
          <div style="background:var(--error-l);border:1px solid var(--error);border-radius:var(--rl);padding:12px 16px;margin-top:8px">
            <div style="font-weight:600;color:var(--error);margin-bottom:6px">⚠ Please fix the following before proceeding:</div>
            <ul style="margin:0;padding-left:18px;color:var(--error)">
              ${errors.map(e => `<li style="margin-bottom:4px">${e}</li>`).join('')}
            </ul>
            <div style="margin-top:8px;font-size:12px;color:var(--ink3)">Use <em>Normalise</em> or <em>Equal</em> buttons to quickly fix weights.</div>
          </div>`;
        msgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }


  // ── STEP 3: SCORING ────────────────────────────────────────────
  function _renderStep3() {
    const mode  = State.getMode();
    const basis = State.getBasis();
    const alts  = State.getAlts();
    const store = mode === 'US' ? State.getScoresUS() : State.getScoresRIM();
    const tiers = State.TIERS.filter(t => State.getLeaves().some(c => c.tier === t));

    // Fixed column width  -  every header cell and input cell uses exactly this
    // so headers always align with inputs regardless of name length
    const COL_W  = 100; // px  -  every alt column
    const CRIT_W = 200; // px  -  criterion label column
    const RIM_W  = 80;  // px  -  row sum column

    // ── Theme variables  -  defined FIRST so altHeaderCells and nodeHTML can use them ──
    const isRIM     = mode === 'RIM';
    const pageBg    = isRIM ? '#0F1E2E' : '#F5F8FF';
    const surfBg    = isRIM ? '#162535' : '#FFFFFF';
    const surf2Bg   = isRIM ? '#1C2E40' : '#EEF3FB';
    const inkCol    = isRIM ? '#E8F4F2' : '#0D1F3C';
    const ink2Col   = isRIM ? '#A8C8C4' : '#2C4470';
    const ink3Col   = isRIM ? '#6A9E98' : '#5A7AA8';
    const borderCol = isRIM ? 'rgba(26,122,110,.35)' : 'rgba(26,82,118,.18)';
    const accentCol = isRIM ? '#1A7A6E' : '#1A5276';
    const toolbarBg = isRIM ? '#1C3040' : '#E8EDF8';
    const toolbarBdr= isRIM ? '#1A7A6E' : 'rgba(26,82,118,.25)';
    const bannerBg  = isRIM ? 'rgba(26,122,110,.20)' : 'rgba(26,82,118,.08)';
    const bannerBdr = isRIM ? '#1A7A6E' : '#1A5276';
    const bannerText= isRIM ? '#A8E4DE' : '#1A5276';
    const inputBg   = '#FFFFFF';  // always white so numbers are clearly visible in both themes
    const inputBdr  = isRIM ? '1.5px solid rgba(26,122,110,.6)' : '1px solid #C8D4E4';
    const modeLabel = isRIM
      ? `<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;
            font-family:var(--font-mono);color:#A8E4DE;background:rgba(26,122,110,.3);border:1px solid #1A7A6E;
            border-radius:20px;padding:3px 12px;letter-spacing:.05em">◆ DISCRIM - Dark Theme</span>`
      : `<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;
            font-family:var(--font-mono);color:#1A5276;background:rgba(26,82,118,.08);border:1px solid #1A5276;
            border-radius:20px;padding:3px 12px;letter-spacing:.05em">◆ DISCUS - Light Theme</span>`;

    // Alternative header cells  -  name wraps to 2 lines, never truncates
    const altHeaderCells = alts.map(a =>
      `<div style="width:${COL_W}px;min-width:${COL_W}px;max-width:${COL_W}px;flex:none;text-align:center;
        font-size:12px;font-weight:600;color:${ink2Col};padding:6px 6px;border-right:1px solid ${borderCol};
        word-break:break-word;line-height:1.3;display:flex;align-items:center;justify-content:center;
        min-height:48px" title="${_esc(a)}">${_esc(a)}</div>`
    ).join('');

    // Recursive function  -  returns HTML string for a criterion node and its subtree
    function nodeHTML(crit, depth, col, isLastSibling, siblingLeaves) {
      const children  = State.getChildren(crit.id);
      const isLeaf    = children.length === 0;
      const isChild   = depth > 0;
      const indent    = depth * 28;
      // Tree connector style
      const connector = isChild
        ? `<div style="position:absolute;left:${indent-14}px;top:0;width:14px;height:50%;border-left:2px solid ${col}50;border-bottom:2px solid ${col}50;border-radius:0 0 0 6px"></div>`
        : '';
      // Vertical line continuing down for siblings
      const vline = isChild && !isLastSibling
        ? `<div style="position:absolute;left:${indent-14}px;top:50%;bottom:-100%;width:0;border-left:2px solid ${col}30"></div>`
        : '';

      if (isLeaf) {
        // Compute row sum for DISCRIM (sum across all alts for this criterion)
        const rimRowTotal = mode === 'RIM'
          ? alts.reduce((s,_,ai) => s+((store[ai]&&store[ai][crit.id]!=null)?store[ai][crit.id]:0), 0)
          : 0;
        const rimRowOk = mode === 'RIM' ? Math.abs(rimRowTotal - basis) < RIM_SUM_TOL : true;

        // Input cells  -  fixed width matching header cells exactly
        const inputCells = alts.map((a, ai) => {
          const v      = (store[ai] && store[ai][crit.id] != null) ? store[ai][crit.id] : 0;
          const origin = (State.getScoreOrigin()[ai] || {})[crit.id] || '';
          const isSample = origin === 'sample';
          const bg     = isSample ? '#FFF3CD' : inputBg;
          const bdr    = isSample ? '1px dashed #C8960C' : inputBdr;
          // Sample cells always use dark text (amber bg is light regardless of theme)
          const cellTextCol = isSample ? '#5A3A00' : '#0D1F3C';  // always dark on white cell
          return `<div style="width:${COL_W}px;min-width:${COL_W}px;max-width:${COL_W}px;flex:none;
              display:flex;flex-direction:column;align-items:center;
              border-right:1px solid ${borderCol};padding:6px 4px">
            <input type="number" min="0" max="${basis}" step="0.1" value="${v}"
              oninput="UI._setScore(${ai},'${crit.id}',+this.value);UI._updateRimHints('${crit.id}')"
              style="width:${COL_W-16}px;text-align:center;background:${bg};border:${bdr};border-radius:5px;
                padding:5px 4px;font-size:13px;font-family:var(--font-mono);color:${cellTextCol}"
              aria-label="${_esc(a)} - ${_esc(crit.name)}">
            ${mode === 'RIM'
              ? `<div id="rim-hint-${ai}-${crit.id}" style="font-size:10px;font-family:var(--font-mono);
                  color:${ink3Col};margin-top:2px;text-align:center;white-space:nowrap"></div>`
              : ''}
          </div>`;
        }).join('');

        // Row sum shown at the RIGHT end of this criterion row (DISCRIM only)  -  sticky right
        const rowSumCell = mode === 'RIM'
          ? `<div style="width:${RIM_W}px;min-width:${RIM_W}px;flex:none;display:flex;flex-direction:column;
                align-items:center;justify-content:center;padding:4px 8px;background:${surf2Bg};
                border-left:2px solid ${col}40"
              data-tip="${_TIP.colTotal}">
              <span style="font-size:9px;font-family:var(--font-mono);color:${ink3Col};text-transform:uppercase;
                letter-spacing:.04em;margin-bottom:2px">Row ∑</span>
              <span id="rimsum-${crit.id}"
                style="font-size:13px;font-family:var(--font-mono);font-weight:700;
                  color:${rimRowOk ? (isRIM ? '#4CE8C8' : 'var(--green)') : '#FF6B6B'}">
                ${rimRowTotal.toFixed(1)}/${basis}
              </span>
            </div>`
          : '';

        return `<div style="display:flex;align-items:stretch;min-height:52px;border-bottom:1px solid ${borderCol};background:${surfBg}">
          <!-- Criterion label  -  solid white background, connector inside, no sticky -->
          <div style="width:${CRIT_W}px;min-width:${CRIT_W}px;flex:none;
              padding:8px 8px 8px ${12+indent}px;
              display:flex;align-items:center;gap:7px;border-right:2px solid ${col}30;
              background:${surfBg};overflow:hidden;position:relative">
            ${connector}${vline}
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${col};flex-shrink:0;opacity:.85"></span>
            <span style="font-size:13px;color:${isChild?ink2Col:inkCol};font-weight:${isChild?'400':'600'};
              overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0" title="${_esc(crit.name)}">${_esc(crit.name)}</span>
          </div>
          <!-- Input cells -->
          <div style="display:flex;flex:none;align-items:center">
            ${inputCells}
          </div>
          <!-- Row sum indicator  -  DISCRIM only -->
          ${rowSumCell}
        </div>`;
      } else {
        // Parent/group node  -  show label, then recurse into children
        const leafChildren = children.filter(ch => !State.getChildren(ch.id).length);
        const childHTML = children.map((ch, idx) =>
          nodeHTML(ch, depth+1, col, idx===children.length-1, leafChildren)
        ).join('');

        return `<div>
          <div style="display:flex;align-items:center;min-height:38px;
              border-bottom:1px solid ${col}30">
            <!-- Group label  -  themed background, connector inside -->
            <div style="width:${CRIT_W}px;min-width:${CRIT_W}px;flex:none;
                padding:7px 8px 7px ${12+indent}px;
                display:flex;align-items:center;gap:7px;border-right:2px solid ${col}40;
                background:${isRIM ? col+'22' : col+'0E'};overflow:hidden;position:relative">
              ${connector}${vline}
              <span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${col};flex-shrink:0;opacity:.8"></span>
              <span style="font-size:13px;font-weight:700;color:${isRIM ? '#E8F4F2' : col};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0">${_esc(crit.name)}</span>
              <span style="font-size:10px;font-family:var(--font-mono);color:${isRIM ? '#6A9E98' : col};opacity:.8;margin-left:2px;white-space:nowrap">group</span>
            </div>
            <div style="flex:1;padding:0 12px;background:${isRIM ? col+'18' : col+'06'}">
              <span style="font-size:11px;font-family:var(--font-mono);color:${ink3Col}">
                ${children.length} sub-criteria
              </span>
            </div>
          </div>
          ${childHTML}
        </div>`;
      }
    }

    // Build tier panels
    let tiersHTML = '';
    tiers.forEach(t => {
      const col      = State.TIER_COLORS[t];
      const iclass   = State.TIER_ICON_CLASS[t];
      const allCrits = State.getCrits().filter(c => c.tier === t);
      const topCrits = allCrits.filter(c => !c.parentId);
      const leafList = State.getLeaves().filter(c => c.tier === t);

      const critRows = topCrits.map((c, idx) =>
        nodeHTML(c, 0, col, idx === topCrits.length-1, leafList.filter(l => !l.parentId || State.getSiblings(l.id)[0]?.parentId === c.parentId))
      ).join('');

      const scId = `sc-tier-${t}-${Date.now()}`;
      const sbId = `sb-tier-${t}-${Date.now()}`;
      const totalW = CRIT_W + alts.length * COL_W + (mode==='RIM' ? RIM_W : 0);

      tiersHTML += `
        <div style="border:1px solid ${col}50;border-radius:10px;margin-bottom:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.15)">
          <!-- Tier header bar -->
          <div style="background:${col};padding:10px 16px;display:flex;align-items:center;gap:10px">
            <div class="tier-icon ${iclass}" style="width:32px;height:32px;font-size:11px;background:rgba(255,255,255,.2)">
              ${t.slice(0,3).toUpperCase()}
            </div>
            <div>
              <div style="font-size:14px;font-weight:700;color:#fff;letter-spacing:.02em">
                ${t.charAt(0).toUpperCase()+t.slice(1)} Criteria
              </div>
              <div style="font-size:11px;color:rgba(255,255,255,.8);font-family:var(--font-mono)">
                ${mode==='US' ? 'Score 0 to '+basis+' per cell' : 'Allocate '+basis+' pts across alternatives per criterion row'}
              </div>
            </div>
            <div style="margin-left:auto;font-size:11px;font-family:var(--font-mono);color:rgba(255,255,255,.7)">
              ${leafList.length} criteria · ${alts.length} alternatives
            </div>
          </div>
          <!-- Single scroll container with VISIBLE native scrollbar -->
          <div id="${scId}" style="overflow-x:auto;overflow-y:visible;background:${surfBg}"
            onscroll="(function(sc){
              var sb=document.getElementById('${sbId}');
              if(sb) sb.scrollLeft=sc.scrollLeft;
            })(this)">
            <div style="min-width:${totalW}px">
              <!-- Column header row -->
              <div style="display:flex;align-items:stretch;background:${surf2Bg};
                  border-bottom:2px solid ${col}60">
                <div style="width:${CRIT_W}px;min-width:${CRIT_W}px;flex:none;padding:8px 12px;
                    font-size:11px;font-weight:700;color:${ink3Col};font-family:var(--font-mono);
                    text-transform:uppercase;letter-spacing:.06em;border-right:2px solid ${col}30;
                    flex-shrink:0;background:${surf2Bg}">
                  Criterion
                </div>
                <div style="display:flex;flex:none">
                  ${altHeaderCells}
                </div>
                ${mode==='RIM' ? `<div style="width:${RIM_W}px;min-width:${RIM_W}px;flex:none;padding:8px 8px;
                    font-size:11px;font-weight:700;color:${ink2Col};font-family:var(--font-mono);
                    text-transform:uppercase;letter-spacing:.06em;text-align:center;
                    border-left:2px solid ${col}30;background:${surf2Bg};flex-shrink:0">Row ∑</div>` : ''}
              </div>
              <!-- Tree rows -->
              ${critRows}
            </div>
          </div>
        </div>`;
    });


    const legend = `<div style="display:flex;gap:16px;align-items:center;font-size:11px;
        font-family:var(--font-mono);color:${ink3Col};flex-wrap:wrap">
      <span style="display:flex;align-items:center;gap:6px">
        <span style="width:20px;height:14px;background:#FFF3CD;border:2px dashed #C8960C;
          display:inline-block;border-radius:4px;flex-shrink:0"></span>
        <span style="color:${ink2Col};font-weight:600">Sample score</span>
        <span style="color:${ink3Col}">- click cell to override</span>
      </span>
      <span style="display:flex;align-items:center;gap:6px">
        <span style="width:20px;height:14px;
          background:#FFFFFF;
          border:${isRIM ? '2px solid rgba(26,122,110,.9)' : '1px solid #C8D4E4'};
          display:inline-block;border-radius:4px;flex-shrink:0"></span>
        <span style="color:${ink2Col};font-weight:600">Your score</span>
        <span style="color:${ink3Col}">- entered by you</span>
      </span>
    </div>`;

    const p3 = document.getElementById('pane3');
    p3.style.background   = pageBg;
    p3.style.color        = inkCol;
    p3.style.borderRadius = '0';

    document.getElementById('pane3').innerHTML = `
      <div style="background:${pageBg};padding:0">
        <div style="margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px">
            <h2 style="margin:0;font-size:20px;font-weight:700;color:${inkCol}">Step 3: Score Alternatives</h2>
            ${modeLabel}
          </div>
          <p style="font-size:13px;color:${ink2Col};margin:0">Each tier is shown as a card. Score each leaf criterion across all alternatives.</p>
        </div>
        <!-- Mode banner -->
        <div id="scoreNote" style="margin-bottom:14px;padding:11px 16px;
            background:${bannerBg};border:1px solid ${bannerBdr};border-left:4px solid ${bannerBdr};
            border-radius:6px;font-size:13px;color:${bannerText};line-height:1.6">
          ${isRIM
            ? `<strong style="color:${bannerText}">DISCRIM mode:</strong> For each criterion, allocate exactly <strong>${basis}</strong> points across all alternatives. The row total on the right must equal ${basis}.`
            : `<strong style="color:${bannerText}">DISCUS mode:</strong> Score each alternative independently on each criterion from 0 to ${basis}. Scores do not need to sum to any total.`}
        </div>
        <!-- Action toolbar -->
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;
            padding:10px 14px;background:${toolbarBg};border:1px solid ${toolbarBdr};
            border-radius:8px">
          <span style="font-size:11px;font-family:var(--font-mono);color:${ink3Col};text-transform:uppercase;
            letter-spacing:.06em;margin-right:4px">Quick actions:</span>
          <button onclick="UI._fillRandom()" style="display:inline-flex;align-items:center;gap:6px;
              padding:8px 16px;background:${accentCol};color:#fff;border:none;border-radius:7px;
              font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;
              box-shadow:0 1px 4px rgba(0,0,0,.2);transition:opacity .15s"
            onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'">
            ⚄ Fill Sample Scores
          </button>
          <button onclick="UI._clearScores()" style="display:inline-flex;align-items:center;gap:6px;
              padding:8px 16px;background:transparent;color:#D93636;
              border:1.5px solid #D93636;border-radius:7px;
              font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;
              transition:opacity .15s"
            onmouseover="this.style.opacity='.7'" onmouseout="this.style.opacity='1'">
            ✕ Clear All Scores
          </button>
          <div style="flex:1"></div>
          ${legend}
        </div>
        <!-- Validation error box -->
        <div id="score-validation-error" style="display:none;margin-bottom:14px;padding:12px 16px;
            background:rgba(217,54,54,.12);border:1px solid #D93636;
            border-left:4px solid #D93636;border-radius:6px;
            font-size:13px;color:#D93636;line-height:1.6"></div>
        <!-- Tier cards -->
        <div>${tiersHTML}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:16px;padding-top:12px;border-top:1px solid ${borderCol}">
        <button style="padding:9px 18px;background:transparent;border:1.5px solid ${borderCol};color:${ink2Col};
            border-radius:7px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit"
          onclick="UI.goStep(2)">← Back to Weights</button>
        <div style="flex:1"></div>
        <button class="btn btn-gold" onclick="UI._validateAndScore()">Compute Results →</button>
      </div>
    </div>`;

    if (mode === 'RIM') {
      State.getLeaves().forEach(c => _updateRimHints(c.id));
    }
  }

  function _rimSumHTML(t,ai) {
    const ids=State.getLeaves().filter(c=>c.tier===t).map(c=>c.id);
    const sum=Compute.rimRowSum(ids,ai);
    const b=State.getBasis();
    return `<span class="${Math.abs(sum-b)<RIM_SUM_TOL?'sum-ok':'sum-warn'}">${sum.toFixed(1)}/${b}</span>`;
  }
  function _rimColSumHTML(critId) {
    const store=State.getScoresRIM();
    const b=State.getBasis();
    const sum=State.getAlts().reduce((s,_,ai)=>s+((store[ai]&&store[ai][critId]!=null)?store[ai][critId]:0),0);
    const ok=Math.abs(sum-b)<RIM_SUM_TOL;
    return `<span class="${ok?'sum-ok':'sum-warn'}" title="${ok?'Column total OK':'Column total must equal '+b}">${sum.toFixed(1)}/${b}</span>`;
  }

  // Updates the per-cell hints showing remaining budget for DISCRIM rows
  // Also updates the row total indicator on the right
  function _updateRimHints(critId) {
    // DISCRIM: for each criterion ROW, show remaining budget hint per cell
    // and update the row total indicator at the right end of the row
    const store = State.getScoresRIM();
    const b     = State.getBasis();
    const alts  = State.getAlts();
    const n     = alts.length;

    // Current row total for this criterion (sum across all alternatives)
    const rowTotal = alts.reduce((s,_,ai) =>
      s + ((store[ai] && store[ai][critId] != null) ? store[ai][critId] : 0), 0);
    const rowOk = Math.abs(rowTotal - b) < RIM_SUM_TOL;

    // Update the row sum indicator at the right end of the row
    const rowSumEl = document.getElementById(`rimsum-${critId}`);
    if (rowSumEl) {
      // Don't use CSS class (sum-ok/warn)  -  use inline colour for theme compatibility
      rowSumEl.className    = '';
      rowSumEl.style.color  = rowOk
        ? (State.getMode()==='RIM' ? '#4CE8C8' : 'var(--green)')
        : '#FF6B6B';
      rowSumEl.textContent  = rowTotal.toFixed(1) + '/' + b;
    }

    // Update per-cell hint: show remaining budget for each cell
    alts.forEach((_, ai) => {
      const el = document.getElementById(`rim-hint-${ai}-${critId}`);
      if (!el) return;

      // Row sum excluding THIS cell
      const othersSum = alts.reduce((s, _, oi) => {
        if (oi === ai) return s;
        return s + ((store[oi] && store[oi][critId] != null) ? store[oi][critId] : 0);
      }, 0);

      const remaining = Math.max(0, b - othersSum);

      if (ai === n - 1) {
        // Last alternative: value is fully determined
        el.textContent    = `= ${remaining.toFixed(1)}`;
        const isDark = document.getElementById('pane3')?.style.background === '#0F1E2E';
        el.style.color    = isDark ? '#4CE8C8' : 'var(--accent)';
        el.style.fontWeight = '700';
      } else {
        el.textContent    = `0 - ${remaining.toFixed(1)}`;
        const isDarkHint  = document.getElementById('pane3')?.style.background === '#0F1E2E';
        el.style.color    = isDarkHint ? '#6A9E98' : 'var(--ink3)';
        el.style.fontWeight = '';
      }
    });
  }
  // Called on every score input change
  // Clamps value to valid range and flashes the border red if out of bounds
  function _setScore(ai, critId, v) {
    const b    = State.getBasis();
    const mode = State.getMode();
    const name = (State.getCrits().find(c=>c.id===critId)||{}).name || '';
    const alt  = State.getAlts()[ai] || '';
    const inp  = document.querySelector(`input[aria-label="${alt} - ${name}"]`);
    let clamped = v;
    if(clamped > b) clamped = b;
    if(clamped < 0) clamped = 0;
    if(clamped !== v) {
      // Out-of-range  -  correct the input, flash border red, show toast
      if(inp) {
        inp.value = clamped;
        inp.style.borderColor = 'var(--error)';
        inp.style.boxShadow   = '0 0 0 2px rgba(217,54,54,.25)';
        clearTimeout(inp._errTimer);
        inp._errTimer = setTimeout(() => { inp.style.borderColor=''; inp.style.boxShadow=''; }, 2000);
      }
      const modeLabel = mode === 'US' ? 'DISCUS' : 'DISCRIM';
      toast(`⚠ ${modeLabel} scores must be 0 to ${b}. Value clamped to ${clamped}.`);
    } else {
      // Clear any previous error highlight on this cell
      if(inp) { inp.style.borderColor=''; inp.style.boxShadow=''; }
    }
    State.setScore(ai, critId, clamped);
    // Mark as user-entered and clear the sample amber tint
    State.setScoreOrigin(ai, critId, 'user');
    if(inp) inp.style.background = '';
    if(mode === 'RIM') {
      _updateRimHints(critId);
    }
  }
  // Validate everything and move to results if all good
  function _validateAndScore() {
    const errors = _getScoreErrors();
    const errEl=document.getElementById('score-validation-error');
    if(errors.length>0) {
      if(errEl) {
        errEl.innerHTML = errors.length===1 && errors[0].startsWith('No scores entered')
          ? `<strong>⚠ ${_esc(errors[0])}</strong>`
          : '<strong>⚠ Please fix the following before continuing:</strong><ul style="margin:6px 0 0 16px">'
            + errors.map(e=>`<li style="margin-bottom:3px">${_esc(e)}</li>`).join('')+'</ul>';
        errEl.style.display='';
        // Scroll the main content area so the error message is visible
        setTimeout(() => {
          const main = document.getElementById('mainContent');
          const errTop = errEl.getBoundingClientRect().top + (main ? main.scrollTop : 0)
                         - (main ? main.getBoundingClientRect().top : 0) - 20;
          if (main) main.scrollTo({ top: errTop, behavior: 'smooth' });
        }, 80);
      }
      return;
    }
    if(errEl) errEl.style.display='none';
    _scoresValidated = true;
    goStep(4);
  }
  // Fill all scoring cells with random sample values for demo purposes
  function _fillRandom() {
    const basis=State.getBasis(), sus=State.getScoresUS(), rim=State.getScoresRIM(), leaves=State.getLeaves();
    State.getAlts().forEach((_,ai)=>{
      if(!sus[ai]) sus[ai]={}; if(!rim[ai]) rim[ai]={};
      leaves.forEach(c=>{
        sus[ai][c.id]=Math.round((3+Math.random()*7)/10*basis*10)/10;
        rim[ai][c.id]=0;
        State.setScoreOrigin(ai, c.id, 'sample');
      });
    });
    if(State.getMode()==='RIM') {
      leaves.forEach(c=>{
        const vals=_allocateExact(State.getAlts().map(()=>Math.random()), basis);
        State.getAlts().forEach((_,ai)=>{
          rim[ai][c.id]=vals[ai];
          State.setScoreOrigin(ai, c.id, 'sample');
        });
      });
    }
    _renderStep3();
  }
  // largest-remainder method so values sum exactly to total
  function _allocateExact(weights, total) {
    const sumW = weights.reduce((a,b)=>a+b,0) || 1;
    const units = Math.round(total*10); // work in tenths to avoid float drift
    const raw = weights.map(w => (w/sumW)*units);
    const floors = raw.map(Math.floor);
    let remainder = units - floors.reduce((a,b)=>a+b,0);
    const order = raw.map((v,i)=>({i,frac:v-Math.floor(v)})).sort((a,b)=>b.frac-a.frac);
    const result = floors.slice();
    for(let k=0; k<remainder; k++) result[order[k % order.length].i]++;
    return result.map(v=>Math.round(v)/10);
  }
  // Clear all scores (DISCRIM: set to 0, DISCUS: use State.clearScores)
  function _clearScores() {
    if (State.getMode() === 'RIM') {
      // For DISCRIM: set all cells to 0 (not the default equal distribution)
      const leaves = State.getLeaves();
      State.getAlts().forEach((_, ai) => {
        leaves.forEach(c => {
          State.setScore(ai, c.id, 0);
          State.setScoreOrigin(ai, c.id, '');
        });
      });
    } else {
      State.clearScores();
    }
    _scoresValidated = false;
    _renderStep3();
  }

  // leaves in tree order
  // Return leaf criteria in a consistent left-to-right order matching the tree
  function _orderedLeaves() {
    const result=[];
    function _collectLeaves(crit) {
      const children=State.getChildren(crit.id);
      if(!children.length) { result.push(crit); }
      else { children.forEach(ch=>_collectLeaves(ch)); }
    }
    State.TIERS.forEach(t=>{
      State.getTopLevel().filter(c=>c.tier===t).forEach(c=>_collectLeaves(c));
    });
    return result;
  }

  let _magFilter = null;
  let _activeVizTab = 'heatmap';
  let _radarState = null;
  let _radarZoom  = 1; // current zoom level for the radar chart (1 = 100%)

  function _enterMagnify() {
    const sel=document.getElementById('mag-branch-sel'); if(!sel) return;
    Session.autoSnapshot('Pre-magnify checkpoint');
    _magFilter=sel.value;
    _renderStep4();
  }
  function _exitMagnify() { _magFilter=null; _renderStep4(); }

  /* ── STEP 4: RESULTS ── */
  // ── STEP 4: RESULTS ────────────────────────────────────────────
  function _renderStep4() {
    // If magnifying glass is active, restrict leaves to the selected branch
    let ranked, max;
    if(_magFilter) {
      const allLeaves=State.getLeaves();
      // Collect all descendants of _magFilter
      const desc=new Set();
      const queue=[_magFilter];
      while(queue.length){ const cur=queue.pop(); desc.add(cur); State.getChildren(cur).forEach(c=>queue.push(c.id)); }
      const magLeaves=allLeaves.filter(c=>desc.has(c.id)||c.id===_magFilter);
      // Compute scores restricted to magLeaves with renormalised weights
      const scores=State.getAlts().map((_,ai)=>{
        const mode=State.getMode();
        const basis=State.getBasis();
        const sumW=magLeaves.reduce((s,c)=>s+Compute.globalW(c),0)||1;
        if (mode==='US') {
          // DISCUS: renormalised linear weighted sum
          const store=State.getScoresUS();
          return magLeaves.reduce((total,c)=>{
            const gw=Compute.globalW(c)/sumW;
            const v=(store[ai]&&store[ai][c.id]!=null)?+store[ai][c.id]:0;
            return total+gw*v;
          },0);
        } else {
          // DISCRIM: renormalised power-function restricted to magLeaves
          // Group magLeaves by tier, renormalise tier weights within the branch
          const store=State.getScoresRIM();
          const magTiers=State.TIERS.filter(t=>magLeaves.some(c=>c.tier===t));
          const tierWRaw=State.getTierW();
          const tierWSum=magTiers.reduce((s,t)=>s+(tierWRaw[t]||0),0)||1;
          const tierScores={};
          magTiers.forEach(t=>{
            const tLeaves=magLeaves.filter(c=>c.tier===t);
            // Renormalise crit weights within this tier's magLeaves by their globalW share
            const tierGWSum=tLeaves.reduce((s,c)=>s+Compute.globalW(c),0)||1;
            let p=1;
            tLeaves.forEach(c=>{
              const normW=Compute.globalW(c)/tierGWSum;
              const v=(store[ai]&&store[ai][c.id]!=null)?+store[ai][c.id]:0;
              p*=Math.pow(v>0?v/basis:0.001,normW);
            });
            tierScores[t]=p*basis;
          });
          let p=1;
          magTiers.forEach(t=>{
            const normTW=(tierWRaw[t]||0)/tierWSum;
            p*=Math.pow(tierScores[t]>0?tierScores[t]/basis:0.001,normTW);
          });
          return p*basis;
        }
      });
      ranked=[...State.getAlts().map((a,i)=>({name:a,score:scores[i],idx:i}))].sort((a,b)=>b.score-a.score);
    } else {
      ranked=Compute.ranked();
    }
    max=ranked[0]?.score||State.getBasis();
    const close=Compute.isClose(ranked), mode=State.getMode(), leaves=_magFilter
      ? State.getLeaves().filter(c=>{ const desc=new Set(); const q=[_magFilter]; while(q.length){const cur=q.pop();desc.add(cur);State.getChildren(cur).forEach(ch=>q.push(ch.id));} return desc.has(c.id); })
      : State.getLeaves();

    document.getElementById('pane4').innerHTML=`
      ${(close||_magFilter)?`<div class="mag-glass-note">
        🔍 <strong data-tip="${_TIP.magnify}">Magnifying Glass (O Brien and Brugha 2010):</strong>
        ${_magFilter
          ? `Focused on branch: <strong>${_esc(State.getCrits().find(c=>c.id===_magFilter)?.name||_magFilter)}</strong>. Rankings show this sub-tree only.`
          : `"${_esc(ranked[0]?.name)}" and "${_esc(ranked[1]?.name)}" are very close (margin: ${Math.abs(ranked[0].score-ranked[1].score).toFixed(2)}). Focus on a specific branch for finer discrimination:`
        }
        <div style="display:flex;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap">
          <select id="mag-branch-sel" aria-label="Select criterion branch to focus on" style="flex:1;min-width:160px">
            ${State.getTopLevel().map(c=>`<option value="${_esc(c.id)}" ${_magFilter===c.id?'selected':''}>${_esc(c.name)}</option>`).join('')}
          </select>
          <button class="btn btn-sm btn-gold" onclick="UI._enterMagnify()" data-tip="${_TIP.focusBranch}">🔍 Focus This Branch</button>
          ${_magFilter?`<button class="btn btn-sm" onclick="UI._exitMagnify()" data-tip="${_TIP.exitMagnify}">✕ Exit Magnifying Glass</button>`:''}
        </div>
        ${_magFilter?`<div style="margin-top:6px;font-size:11px;color:var(--accent2);font-family:var(--font-mono)">🔎 Magnifying glass active. Showing sub-tree only. Select a different branch above or exit to restore full rankings.</div>`:''}
      </div>`:''}
      <div class="card" style="margin-bottom:1.25rem;background:var(--accent-l);border:1px solid var(--border-acc)">
        <div style="font-size:13px;line-height:1.7;color:var(--ink2);padding:4px 0" id="results-narrative">
          ${_narrativeSummary(ranked)}
        </div>
      </div>
      <div class="g2" style="margin-bottom:1.25rem">
        <div class="card">
          <div class="card-header"><div class="card-title">Rankings</div><div class="card-sub">DISC-MCDM | ${mode==='US'?'DISCUS':'DISCRIM'} | <span data-tip="${_TIP.rankBasis}">Basis: ${State.getBasis()}</span></div></div>
          ${ranked.map((r,i)=>{
            const pct=max>0?r.score/max*100:0;
            return `<div class="res-row">
              <div class="rk ${['rk1','rk2','rk3','rkn'][Math.min(i,3)]}">${i+1}</div>
              <div class="rname">${_esc(r.name)}</div>
              <div class="rbar-o" data-tip="${_TIP.rankBar}"><div class="rbar-i ${['b1','b2','b3','bn'][Math.min(i,3)]}" style="width:${pct.toFixed(0)}%"></div></div>
              <div class="rscore">${r.score.toFixed(1)}</div>
            </div>`;
          }).join('')}
          <div class="btn-row" style="justify-content:flex-end;margin-top:10px;padding-top:10px;border-top:1px solid var(--border2)">
            <button class="btn btn-sm" onclick="Session.exportCSV()">⬇ CSV</button>
            <button class="btn btn-sm" onclick="window.print()">🖨 Print</button>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title" data-tip="${_TIP.tierChart}">Tier Contribution</div><div class="card-sub">Score breakdown by Somatic, Psychic and Pneumatic tier per alternative</div></div>
          <div style="overflow-x:auto;overflow-y:hidden" id="chart-area"></div>
        </div>
      </div>
      <div class="card" style="margin-bottom:1.25rem">
        <div class="card-header">
          <div class="card-title">Advanced Visualisations</div>
          <div class="card-sub">Alternative views of the decision. Switch between chart types.</div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">
          <button class="btn btn-sm" id="viz-tab-heatmap"   onclick="UI._vizTab('heatmap')"   style="font-size:11px" data-tip="${_TIP.heatmap}">🟥 Advantage Heatmap</button>
          <button class="btn btn-sm" id="viz-tab-parallel"  onclick="UI._vizTab('parallel')"  style="font-size:11px" data-tip="${_TIP.parallel}">🕸 Radar Chart</button>
        </div>
        <div id="adv-viz-area"></div>
      </div>
      <div class="card" style="margin-bottom:1.25rem">
        <div class="card-header"><div class="card-title" data-tip="${_TIP.breakdown}">Original Weighted Score Breakdown</div><div class="card-sub">Contribution of each leaf criterion (global weight × raw score)</div></div>
        <div class="breakdown-wrap mx-wrap">${_breakdownHTML(ranked)}</div>
      </div>
      <div class="card" style="margin-bottom:1.25rem">
        <div class="card-header"><div class="card-title">Sensitivity Analysis</div><div class="card-sub">Drag sliders to vary criterion weights live. The tornado chart shows ranking influence.</div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;align-items:start">
          <div>
            <div style="font-size:10px;font-family:var(--font-mono);color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px" data-tip="${_TIP.sensSliders}">Live Weight Sliders</div>
            <div id="sens-sliders">
              ${leaves.map(c=>{
                const gw=Compute.globalW(c);
                const cw=State.getCritW()[c.id]||0;
                return `<div style="margin-bottom:10px">
                  <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">
                    <span style="color:${State.TIER_COLORS[c.tier]};font-weight:600">${_esc(c.name)}</span>
                    <span style="font-family:var(--font-mono);color:var(--ink3)" id="slv-${c.id}">${cw.toFixed(2)}</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.01" value="${cw.toFixed(2)}"
                    style="width:100%;accent-color:${State.TIER_COLORS[c.tier]}"
                    oninput="UI._liveSens('${c.id}',+this.value)">
                  <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--ink3);font-family:var(--font-mono)">
                    <span>0</span><span>Breakeven: <span id="be-${c.id}" style="color:var(--accent2)" data-tip="${_TIP.breakeven}">${_breakeven(c.id)}</span></span><span>1</span>
                  </div>
                </div>`;
              }).join('')}
            </div>
            <button class="btn btn-ghost btn-sm" style="margin-top:6px" onclick="UI._resetSensWeights()">↺ Reset Weights</button>
          </div>
          <div>
            <div style="font-size:10px;font-family:var(--font-mono);color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px" data-tip="${_TIP.tornado}">Tornado Chart: Ranking Influence</div>
            <div id="tornado-chart"></div>
            <div class="sg" style="margin-top:12px">
              <div class="scard"><div class="scard-l" data-tip="${_TIP.sensTop}">Top Ranked</div><div class="scard-v" style="font-size:13px" id="sens-top">${_esc(ranked[0]?.name||'-')}</div></div>
              <div class="scard"><div class="scard-l">Score</div><div class="scard-v" id="sens-score">${(ranked[0]?.score||0).toFixed(2)}</div></div>
              <div class="scard"><div class="scard-l" data-tip="${_TIP.sensMargin}">Margin #2</div><div class="scard-v" id="sens-margin">${ranked.length>1?Math.abs(ranked[0].score-ranked[1].score).toFixed(2):'-'}</div></div>
              <div class="scard"><div class="scard-l">Mode</div><div class="scard-v" style="font-size:12px;font-family:var(--font-mono)">${mode}</div></div>
            </div>
          </div>
        </div>
        <div style="margin-top:1.25rem;border-top:1px solid var(--border2);padding-top:1rem">
          <div style="font-size:10px;font-family:var(--font-mono);color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">
            Sensitivity Weighted Score Breakdown
            <span style="font-weight:400;text-transform:none;letter-spacing:0;margin-left:6px;color:var(--ink3)">(recalculated using current slider weights, raw scores unchanged)</span>
          </div>
          <div id="sens-breakdown-table" class="mx-wrap">${_sensBreakdownHTML()}</div>
        </div>
      </div>
      <div class="refine-section">
        <div class="refine-title" data-tip="${_TIP.refinePanel}">🔁 Refinement Panel - Stage 7 (Pliability)</div>
        <div class="refine-sub">O Brien and Brugha (2010): Refine alternatives, criteria and weights. Each action auto-saves a checkpoint.</div>
        <div class="btn-row">
          <button class="btn btn-sm btn-gold" onclick="UI._refine('set')" data-tip="${_TIP.refineSet}">Modify Alternatives</button>
          <button class="btn btn-sm btn-gold" onclick="UI._refine('weights')" data-tip="${_TIP.refineWeights}">Refine Criteria &amp; Weights</button>
          <button class="btn btn-sm btn-gold" onclick="UI._refine('scores')" data-tip="${_TIP.refineScores}">Refine Scores</button>
          <button class="btn btn-sm" onclick="UI._switchMode()" data-tip="${_TIP.switchMode}">Switch DISCUS ↔ DISCRIM</button>
          <button class="btn btn-sm" onclick="UI.openSaveModal()">💾 Save this version</button>
        </div>
      </div>
      <div class="btn-row" style="justify-content:space-between">
        <button class="btn btn-ghost" onclick="UI.goStep(3)">← Back to Scoring</button>
        <button class="btn btn-p" onclick="UI._startNew()">New Analysis</button>
      </div>`;
    _renderChart(ranked,max);
    _activeVizTab = 'heatmap';
    _renderAdvViz();
    // Seed sensitivity sandbox from current State weights (State never mutated during sensitivity)
    _sensOrigWeights = {};
    State.getLeaves().forEach(c => { _sensOrigWeights[c.id] = State.getCritW()[c.id] || 0; });
    _sensWeights = Object.assign({}, _sensOrigWeights);
    _renderTornado();
  }

  // Builds the horizontal SVG tree showing score breakdown
  // Each leaf criterion gets a weight badge and score cells for each alternative
  function _breakdownHTML(ranked) {
    const allAlts  = State.getAlts();
    const alts     = ranked.map(r => r.name);
    const mode     = State.getMode();
    const storeUS  = State.getScoresUS();
    const storeRIM = State.getScoresRIM();
    const tiers    = State.TIERS.filter(t => State.getLeaves().some(c => c.tier === t));

    // ── Layout constants ──────────────────────────────────────────────────────
    const ROW_H  = 38;          // px height per row slot
    const PAD    = 6;           // px gap between rows
    const NODE_W = 160;         // px for node label box
    const GAP    = 24;          // px horizontal gap between columns
    const WT_W   = 48;          // px weight badge
    const CELL_W = 76;          // px per alt score cell
    const COL_W  = NODE_W + GAP;// total column pitch

    function countLeaves(crit) {
      const ch = State.getChildren(crit.id);
      return ch.length === 0 ? 1 : ch.reduce((s,c) => s + countLeaves(c), 0);
    }

    // ── Flat layout: each node gets {crit, col, rowStart, rowSpan, isLeaf} ───
    function layout(crit, col, rowStart) {
      const children = State.getChildren(crit.id);
      const isLeaf = children.length === 0;
      const span = isLeaf ? 1 : children.reduce((s,c) => s + countLeaves(c), 0);
      const nodes = [{crit, col, rowStart, rowSpan: span, isLeaf}];
      if (!isLeaf) {
        let cursor = rowStart;
        children.forEach(ch => { nodes.push(...layout(ch, col+1, cursor)); cursor += countLeaves(ch); });
      }
      return nodes;
    }

    // Build tree: root(col0) → tier(col1) → top-level criteria(col2) → ...
    const tierNodes = tiers.map(t => ({
      id:'tier_'+t, name:t.charAt(0).toUpperCase()+t.slice(1),
      tier:t, isTier:true,
      children: State.getCrits().filter(c => c.tier===t && !c.parentId)
    }));
    let tierRowStart = 0;
    const tierLayouts = tierNodes.map(tn => {
      const span = tn.children.reduce((s,c) => s+countLeaves(c), 0);
      const tierEntry = {crit:tn, col:1, rowStart:tierRowStart, rowSpan:span, isLeaf:false, isTier:true};
      let critNodes = [], cursor = tierRowStart;
      tn.children.forEach(c => { critNodes.push(...layout(c, 2, cursor)); cursor += countLeaves(c); });
      tierRowStart += span;
      return {tierNode:tierEntry, critNodes};
    });

    const totalRows = tierRowStart;
    const rootNode  = {crit:{id:'root',name:'Decision',tier:tiers[0]}, col:0, rowStart:0, rowSpan:totalRows, isLeaf:false, isRoot:true};
    const flatNodes = [rootNode, ...tierLayouts.flatMap(tl => [tl.tierNode, ...tl.critNodes])];
    const maxCol    = Math.max(...flatNodes.map(n => n.col));

    // ── Canvas dimensions ─────────────────────────────────────────────────────
    // Each leaf node has: NODE_W + GAP + WT_W + GAP/2 + alts.length*CELL_W
    // Non-leaf cols: NODE_W + GAP
    // Total width: (maxCol+1)*COL_W + WT_W + alts.length*CELL_W
    const SVG_H = totalRows * (ROW_H + PAD) + PAD;
    const SVG_W = (maxCol+1)*COL_W + WT_W + 8 + alts.length*CELL_W + 16;

    function yc(row)  { return PAD + row*(ROW_H+PAD) + ROW_H/2; }
    function yt(row)  { return PAD + row*(ROW_H+PAD); }

    let svgLines = '', svgNodes = '';

    // ── Draw vertical gather lines first (so they sit behind nodes) ───────────
    flatNodes.filter(n => !n.isLeaf).forEach(parent => {
      const col_c = State.TIER_COLORS[parent.crit.tier] || '#1A5276';
      const childrenOf = flatNodes.filter(n =>
        n.col === parent.col+1 &&
        n.rowStart >= parent.rowStart &&
        n.rowStart < parent.rowStart + parent.rowSpan
      );
      if (childrenOf.length > 1) {
        const gatherX = parent.col*COL_W + NODE_W + GAP/2;
        const firstCY = yc(childrenOf[0].rowStart + (childrenOf[0].rowSpan-1)/2);
        const lastCY  = yc(childrenOf[childrenOf.length-1].rowStart + (childrenOf[childrenOf.length-1].rowSpan-1)/2);
        svgLines += `<line x1="${gatherX}" y1="${firstCY}" x2="${gatherX}" y2="${lastCY}"
          stroke="${col_c}" stroke-width="2" stroke-dasharray="4,3" opacity=".5"/>`;
      }
    });

    // ── Draw each node ────────────────────────────────────────────────────────
    flatNodes.forEach(node => {
      const {crit, col, rowStart, rowSpan, isLeaf} = node;
      const isTier  = !!node.isTier;
      const isRoot  = !!node.isRoot;
      const col_c   = State.TIER_COLORS[crit.tier] || '#1A5276';

      const nodeX   = col * COL_W;
      const nodeCY  = yc(rowStart + (rowSpan-1)/2);
      const nodeY   = nodeCY - ROW_H/2;

      // Horizontal connector from parent gather point to this node
      if (!isRoot) {
        const gatherX = (col-1)*COL_W + NODE_W + GAP/2;
        svgLines += `<line x1="${gatherX}" y1="${nodeCY}" x2="${nodeX}" y2="${nodeCY}"
          stroke="${col_c}" stroke-width="2" stroke-dasharray="4,3" opacity=".5"/>`;
      }

      // Node box fill and text colour
      // Colour coding by depth level  -  root darkest, each level progressively lighter
      const depthOpacity = ['FF','DD','BB','99','77'][Math.min(col-1, 4)];
      const fillCol  = isRoot ? '#0D1F3C'
                     : isTier ? col_c                    // tier: solid tier colour
                     : isLeaf ? col_c + depthOpacity     // leaf: solid but fading with depth
                     :          col_c + '28';             // group: very light tint
      const textCol  = isRoot||isTier ? '#ffffff'
                     : isLeaf ? '#ffffff'
                     : col_c;
      const label    = crit.name.length > 17 ? crit.name.slice(0,16)+'…' : crit.name;

      svgNodes += `<rect x="${nodeX}" y="${nodeY}" width="${NODE_W}" height="${ROW_H}"
        rx="7" fill="${fillCol}" stroke="${col_c}" stroke-width="1.8"/>`;
      svgNodes += `<text x="${nodeX + NODE_W/2}" y="${nodeCY}"
        text-anchor="middle" dominant-baseline="middle"
        font-size="11" font-family="sans-serif" font-weight="${isRoot||isTier?700:600}"
        fill="${textCol}">${_esc(label)}</text>`;

      // ── Score + weight panel immediately right of leaf ────────────────────
      if (isLeaf) {
        const gw     = Compute.globalW(crit);
        const gwPct  = (gw*100).toFixed(1)+'%';
        const panelX = nodeX + NODE_W + 6;

        // Connector from node right edge to panel
        svgLines += `<line x1="${nodeX+NODE_W}" y1="${nodeCY}" x2="${panelX}" y2="${nodeCY}"
          stroke="${col_c}" stroke-width="1.5" opacity=".35"/>`;

        // Weight badge
        svgNodes += `<rect x="${panelX}" y="${nodeY}" width="${WT_W}" height="${ROW_H}"
          rx="6" fill="${col_c}25" stroke="${col_c}" stroke-width="1.4"/>`;
        svgNodes += `<text x="${panelX+WT_W/2}" y="${nodeCY-7}" text-anchor="middle"
          font-size="8" font-family="monospace" fill="${col_c}" font-weight="700" opacity=".8">Wt</text>`;
        svgNodes += `<text x="${panelX+WT_W/2}" y="${nodeCY+7}" text-anchor="middle"
          font-size="12" font-family="monospace" fill="${col_c}" font-weight="800">${gwPct}</text>`;

        // Score cells  -  one per ranked alternative, directly right of weight badge
        alts.forEach((a, ai_r) => {
          const ai    = allAlts.indexOf(a);
          const store = mode==='US' ? storeUS : storeRIM;
          const raw   = (ai>=0 && store[ai] && store[ai][crit.id]!=null) ? +store[ai][crit.id] : 0;
          const wt    = (gw*raw).toFixed(2);
          const cellX = panelX + WT_W + 4 + ai_r * CELL_W;
          const isFirst = ai_r === 0;
          const altLabel = a.length > 9 ? a.slice(0,8)+'…' : a;

          // Cell background  -  slightly different shade for alternating cols
          svgNodes += `<rect x="${cellX}" y="${nodeY}" width="${CELL_W-2}" height="${ROW_H}"
            rx="5" fill="${ai_r%2===0 ? col_c+'18' : col_c+'0C'}" stroke="${col_c}40" stroke-width="1"/>`;

          // Alt name (top)
          svgNodes += `<text x="${cellX+(CELL_W-2)/2}" y="${nodeCY-7}" text-anchor="middle"
            font-size="8" font-family="monospace" fill="${col_c}" font-weight="600">${_esc(altLabel)}</text>`;

          // Raw score (left of cell bottom)
          svgNodes += `<text x="${cellX+18}" y="${nodeCY+7}" text-anchor="middle"
            font-size="11" font-family="monospace" fill="#0D1F3C" font-weight="700">${raw.toFixed(1)}</text>`;

          // Arrow
          svgNodes += `<text x="${cellX+(CELL_W-2)/2}" y="${nodeCY+7}" text-anchor="middle"
            font-size="9" fill="${col_c}" opacity=".7">→</text>`;

          // Weighted value (right of cell bottom)
          svgNodes += `<text x="${cellX+CELL_W-20}" y="${nodeCY+7}" text-anchor="middle"
            font-size="11" font-family="monospace" fill="${col_c}" font-weight="700">${wt}</text>`;
        });
      }
    });

    // Final scores summary bar below the SVG
    const finalScores = Compute.computeScores();
    const finalSummary = `<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;
        padding:10px 14px;background:var(--bg3);border:1px solid var(--border2);
        border-radius:0 0 8px 8px;border-top:2px solid var(--border2);margin-top:-1px">
      <span style="font-size:10px;font-family:var(--font-mono);color:var(--ink3);
          text-transform:uppercase;letter-spacing:.07em;margin-right:4px">Final Scores:</span>
      ${ranked.map((r, i) => {
        const medal = i===0 ? '🥇' : i===1 ? '🥈' : i===2 ? '🥉' : `${i+1}.`;
        return `<div style="display:flex;align-items:center;gap:5px;padding:5px 12px;
            background:var(--surface);border:1px solid var(--border2);border-radius:20px">
          <span style="font-size:11px">${medal}</span>
          <span style="font-size:12px;font-weight:600;color:var(--ink)">${_esc(r.name)}</span>
          <span style="font-size:13px;font-weight:800;color:var(--accent);
              font-family:var(--font-mono);margin-left:2px">${r.score.toFixed(2)}</span>
        </div>`;
      }).join('')}
    </div>`;

    return `<div>
      <div style="overflow-x:auto;overflow-y:auto;padding:8px 4px 0">
        <svg width="${SVG_W}" height="${SVG_H}" xmlns="http://www.w3.org/2000/svg"
          style="display:block;min-width:${SVG_W}px">
          <g>${svgLines}</g>
          <g>${svgNodes}</g>
        </svg>
      </div>
      ${finalSummary}
    </div>`;
  }

  // Same as _breakdownHTML but uses the sandbox slider weights instead of saved weights
  function _sensBreakdownHTML() {
    if (!_sensWeights) return '';
    const allAlts  = State.getAlts();
    const mode     = State.getMode();
    const storeUS  = State.getScoresUS();
    const storeRIM = State.getScoresRIM();
    const tiers    = State.TIERS.filter(t => State.getLeaves().some(c => c.tier === t));

    function sensGlobalW(c) {
      let w = _sensNormCritW(c), cur = c;
      while (cur.parentId) {
        const p = State.getCrits().find(cc => cc.id === cur.parentId);
        if (!p) break;
        w *= _sensNormCritW(p);
        cur = p;
      }
      const usedTiers = State.TIERS.filter(tt => State.getLeaves().some(lc => lc.tier === tt));
      const tw = State.getTierW();
      const tierSum = usedTiers.reduce((s,tt) => s+(tw[tt]||0), 0) || 1;
      return (tw[c.tier]||0) / tierSum * w;
    }

    const sensScores = _sensComputeScores();
    const sensRanked = [...allAlts.map((a,i) => ({name:a, score:sensScores[i]}))].sort((a,b) => b.score-a.score);
    const alts = sensRanked.map(r => r.name);

    const ROW_H=38, PAD=6, NODE_W=160, GAP=24, WT_W=48, CELL_W=76, COL_W=NODE_W+GAP;

    function countLeaves(crit) {
      const ch = State.getChildren(crit.id);
      return ch.length===0 ? 1 : ch.reduce((s,c) => s+countLeaves(c), 0);
    }
    function layout(crit, col, rowStart) {
      const children = State.getChildren(crit.id);
      const isLeaf = children.length===0;
      const span = isLeaf ? 1 : children.reduce((s,c) => s+countLeaves(c), 0);
      const nodes = [{crit, col, rowStart, rowSpan:span, isLeaf}];
      if (!isLeaf) { let cursor=rowStart; children.forEach(ch => { nodes.push(...layout(ch,col+1,cursor)); cursor+=countLeaves(ch); }); }
      return nodes;
    }

    const tierNodes = tiers.map(t => ({
      id:'tier_'+t, name:t.charAt(0).toUpperCase()+t.slice(1), tier:t, isTier:true,
      children: State.getCrits().filter(c => c.tier===t && !c.parentId)
    }));
    let tierRowStart=0;
    const tierLayouts = tierNodes.map(tn => {
      const span = tn.children.reduce((s,c) => s+countLeaves(c), 0);
      const tierEntry = {crit:tn, col:1, rowStart:tierRowStart, rowSpan:span, isLeaf:false, isTier:true};
      let critNodes=[], cursor=tierRowStart;
      tn.children.forEach(c => { critNodes.push(...layout(c,2,cursor)); cursor+=countLeaves(c); });
      tierRowStart += span;
      return {tierNode:tierEntry, critNodes};
    });

    const totalRows = tierRowStart;
    const rootNode  = {crit:{id:'root',name:'Decision',tier:tiers[0]}, col:0, rowStart:0, rowSpan:totalRows, isLeaf:false, isRoot:true};
    const flatNodes = [rootNode, ...tierLayouts.flatMap(tl => [tl.tierNode, ...tl.critNodes])];
    const maxCol    = Math.max(...flatNodes.map(n => n.col));
    const SVG_H = totalRows*(ROW_H+PAD)+PAD;
    const SVG_W = (maxCol+1)*COL_W + WT_W + 8 + alts.length*CELL_W + 16;

    function yc(row) { return PAD+row*(ROW_H+PAD)+ROW_H/2; }

    let svgLines='', svgNodes='';

    flatNodes.filter(n => !n.isLeaf).forEach(parent => {
      const col_c = State.TIER_COLORS[parent.crit.tier]||'#1A5276';
      const childrenOf = flatNodes.filter(n => n.col===parent.col+1 && n.rowStart>=parent.rowStart && n.rowStart<parent.rowStart+parent.rowSpan);
      if (childrenOf.length>1) {
        const gatherX = parent.col*COL_W+NODE_W+GAP/2;
        const firstCY = yc(childrenOf[0].rowStart+(childrenOf[0].rowSpan-1)/2);
        const lastCY  = yc(childrenOf[childrenOf.length-1].rowStart+(childrenOf[childrenOf.length-1].rowSpan-1)/2);
        svgLines += `<line x1="${gatherX}" y1="${firstCY}" x2="${gatherX}" y2="${lastCY}" stroke="${col_c}" stroke-width="2" stroke-dasharray="4,3" opacity=".5"/>`;
      }
    });

    flatNodes.forEach(node => {
      const {crit,col,rowStart,rowSpan,isLeaf} = node;
      const isTier=!!node.isTier, isRoot=!!node.isRoot;
      const col_c = State.TIER_COLORS[crit.tier]||'#1A5276';
      const nodeX = col*COL_W, nodeCY=yc(rowStart+(rowSpan-1)/2), nodeY=nodeCY-ROW_H/2;

      if (!isRoot) {
        const gatherX=(col-1)*COL_W+NODE_W+GAP/2;
        svgLines += `<line x1="${gatherX}" y1="${nodeCY}" x2="${nodeX}" y2="${nodeCY}" stroke="${col_c}" stroke-width="2" stroke-dasharray="4,3" opacity=".5"/>`;
      }

      const fillCol = isRoot?'#0D1F3C':isTier?col_c:isLeaf?col_c+'EE':col_c+'20';
      const textCol = isRoot||isTier||isLeaf?'#ffffff':col_c;
      const label   = crit.name.length>17?crit.name.slice(0,16)+'…':crit.name;

      svgNodes += `<rect x="${nodeX}" y="${nodeY}" width="${NODE_W}" height="${ROW_H}" rx="7" fill="${fillCol}" stroke="${col_c}" stroke-width="1.8"/>`;
      svgNodes += `<text x="${nodeX+NODE_W/2}" y="${nodeCY}" text-anchor="middle" dominant-baseline="middle" font-size="11" font-family="sans-serif" font-weight="${isRoot||isTier?700:600}" fill="${textCol}">${_esc(label)}</text>`;

      if (isLeaf) {
        const gw=sensGlobalW(crit), gwPct=(gw*100).toFixed(1)+'%';
        const panelX=nodeX+NODE_W+6;
        svgLines += `<line x1="${nodeX+NODE_W}" y1="${nodeCY}" x2="${panelX}" y2="${nodeCY}" stroke="${col_c}" stroke-width="1.5" opacity=".35"/>`;
        svgNodes += `<rect x="${panelX}" y="${nodeY}" width="${WT_W}" height="${ROW_H}" rx="6" fill="${col_c}25" stroke="${col_c}" stroke-width="1.4"/>`;
        svgNodes += `<text x="${panelX+WT_W/2}" y="${nodeCY-7}" text-anchor="middle" font-size="8" font-family="monospace" fill="${col_c}" font-weight="700" opacity=".8">Wt</text>`;
        svgNodes += `<text x="${panelX+WT_W/2}" y="${nodeCY+7}" text-anchor="middle" font-size="12" font-family="monospace" fill="${col_c}" font-weight="800">${gwPct}</text>`;
        alts.forEach((a,ai_r) => {
          const ai=allAlts.indexOf(a), store=mode==='US'?storeUS:storeRIM;
          const raw=(ai>=0&&store[ai]&&store[ai][crit.id]!=null)?+store[ai][crit.id]:0;
          const wt=(gw*raw).toFixed(2), cellX=panelX+WT_W+4+ai_r*CELL_W;
          const altLabel=a.length>9?a.slice(0,8)+'…':a;
          svgNodes += `<rect x="${cellX}" y="${nodeY}" width="${CELL_W-2}" height="${ROW_H}" rx="5" fill="${ai_r%2===0?col_c+'18':col_c+'0C'}" stroke="${col_c}40" stroke-width="1"/>`;
          svgNodes += `<text x="${cellX+(CELL_W-2)/2}" y="${nodeCY-7}" text-anchor="middle" font-size="8" font-family="monospace" fill="${col_c}" font-weight="600">${_esc(altLabel)}</text>`;
          svgNodes += `<text x="${cellX+18}" y="${nodeCY+7}" text-anchor="middle" font-size="11" font-family="monospace" fill="#0D1F3C" font-weight="700">${raw.toFixed(1)}</text>`;
          svgNodes += `<text x="${cellX+(CELL_W-2)/2}" y="${nodeCY+7}" text-anchor="middle" font-size="9" fill="${col_c}" opacity=".7">→</text>`;
          svgNodes += `<text x="${cellX+CELL_W-20}" y="${nodeCY+7}" text-anchor="middle" font-size="11" font-family="monospace" fill="${col_c}" font-weight="700">${wt}</text>`;
        });
      }
    });

    // Final sandbox scores summary
    const finalSummary = `<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;
        padding:10px 14px;background:var(--bg3);border:1px solid var(--border2);
        border-radius:0 0 8px 8px;border-top:2px solid var(--border2);margin-top:-1px">
      <span style="font-size:10px;font-family:var(--font-mono);color:var(--ink3);
          text-transform:uppercase;letter-spacing:.07em;margin-right:4px">Sandbox Final Scores:</span>
      ${sensRanked.map((r, i) => {
        const medal = i===0 ? '🥇' : i===1 ? '🥈' : i===2 ? '🥉' : (i+1)+'.';
        return `<div style="display:flex;align-items:center;gap:5px;padding:5px 12px;
            background:var(--surface);border:1px solid var(--border2);border-radius:20px">
          <span style="font-size:11px">${medal}</span>
          <span style="font-size:12px;font-weight:600;color:var(--ink)">${_esc(r.name)}</span>
          <span style="font-size:13px;font-weight:800;color:var(--accent);
              font-family:var(--font-mono);margin-left:2px">${r.score.toFixed(2)}</span>
        </div>`;
      }).join('')}
    </div>`;

    return `<div>
      <div style="overflow-x:auto;overflow-y:auto;padding:8px 4px 0">
        <svg width="${SVG_W}" height="${SVG_H}" xmlns="http://www.w3.org/2000/svg" style="display:block;min-width:${SVG_W}px">
          <g>${svgLines}</g>
          <g>${svgNodes}</g>
        </svg>
      </div>
      ${finalSummary}
    </div>`;
  }

  function _updateSensBreakdown() {
    const el = document.getElementById('sens-breakdown-table');
    if (el) el.innerHTML = _sensBreakdownHTML();
  }

  // Generate the text summary at the top of the results page
  function _narrativeSummary(ranked) {
    if(!ranked.length) return '';
    const top=ranked[0], basis=State.getBasis(), mode=State.getMode();
    const pct=(top.score/basis*100).toFixed(0);
    // Find the criterion with the highest weighted contribution for the top alternative
    const bd=Compute.breakdown();
    const topBD=bd.find(r=>r.name===top.name);
    let driverText='';
    if(topBD&&topBD.contributions.length){
      const sorted=[...topBD.contributions].sort((a,b)=>b.weighted-a.weighted);
      const top2=sorted.slice(0,2).map(c=>_esc(c.crit));
      driverText=` Its strongest performance was in <strong>${top2.join('</strong> and <strong>')}</strong>.`;
    }
    const margin=ranked.length>1?Math.abs(top.score-ranked[1].score):null;
    const marginText=margin===null?'':margin===0
      ? ` It is <strong>tied</strong> with <strong>${_esc(ranked[1].name)}</strong> . Scores are identical. Use the Magnifying Glass to discriminate.`
      : ` It leads <strong>${_esc(ranked[1].name)}</strong> by a margin of <strong>${margin.toFixed(2)}</strong> points.`;
    const closeText=(Compute.isClose(ranked)&&margin!==0)
      ? ' ⚠ The top two alternatives are very close . Consider using the Magnifying Glass or switching to DISCRIM for finer discrimination.'
      : '';
    return `📊 <strong>${_esc(top.name)}</strong> ranks first with a ${mode==='US'?'DISCUS':'DISCRIM'} score of <strong>${top.score.toFixed(2)}</strong> out of ${basis} (${pct}%).${driverText}${marginText}${closeText}`;
  }

  function _renderChart(ranked,max) {
    const el = document.getElementById('chart-area'); if (!el) return;

    // Build tier contributions per alternative from breakdown()
    const bd = Compute.breakdown();
    const usedTiers = State.TIERS.filter(t => State.getLeaves().some(c => c.tier === t));
    const TIER_COLORS = State.TIER_COLORS;
    const TIER_LABEL = { somatic: 'Somatic', psychic: 'Psychic', pneumatic: 'Pneumatic' };

    // Map breakdown by alt name → tier → contribution sum
    const contribMap = {};
    bd.forEach(alt => {
      contribMap[alt.name] = {};
      usedTiers.forEach(t => {
        contribMap[alt.name][t] = alt.contributions
          .filter(c => c.tier === t)
          .reduce((s, c) => s + c.weighted, 0);
      });
    });

    // Adaptive left margin: base it on the longest alt name so nothing gets clipped
    const pr = 60, pt = 12, pb = 40, rowH = 48, bh = 24;
    const maxNameLen = Math.max(...ranked.map(r => r.name.length), 6);
    const charPx = 7; // approx px per char at font-size 13
    const pl = Math.min(Math.max(maxNameLen * charPx + 16, 80), 220);

    const W = pl + 260 + pr; // total SVG width adapts to name length
    const H = pt + ranked.length * rowH + pb;
    const chartW = W - pl - pr;

    let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" width="${W}" style="display:block;min-width:${W}px">`;

    // Gridlines
    svg += `<line x1="${pl}" y1="${pt}" x2="${pl}" y2="${H-pb}" stroke="#D0D8E8" stroke-width="1"/>`;
    svg += `<line x1="${pl}" y1="${H-pb}" x2="${W-pr}" y2="${H-pb}" stroke="#D0D8E8" stroke-width="1"/>`;
    [0.25, 0.5, 0.75, 1].forEach(f => {
      const x = pl + chartW * f;
      svg += `<line x1="${x}" y1="${pt}" x2="${x}" y2="${H-pb}" stroke="#E8EDF5" stroke-width="1"/>`;
      svg += `<text x="${x}" y="${H-pb+11}" text-anchor="middle" font-size="12" fill="#5A6A7A" font-family="monospace">${(max*f).toFixed(0)}</text>`;
    });

    // Stacked bars, one segment per tier
    ranked.forEach((r, i) => {
      const yc = pt + i * rowH + rowH / 2;
      const contribs = contribMap[r.name] || {};

      // Total bar width derived from r.score directly  -  eliminates floating point drift
      // from summing individual tier segments
      const totalBW = max > 0 ? chartW * r.score / max : 0;
      const tierSum  = usedTiers.reduce((s, t) => s + (contribs[t] || 0), 0) || 1;

      let xOff = 0;
      usedTiers.forEach(t => {
        const val = contribs[t] || 0;
        // Scale each segment as its proportion of the total bar width  -  not of chartW
        const bw = totalBW * val / tierSum;
        if (bw > 0.5) {
          svg += `<rect x="${(pl + xOff).toFixed(1)}" y="${(yc - bh/2).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh}" fill="${TIER_COLORS[t]}" rx="2" opacity="0.88">
            <title>${TIER_LABEL[t]}: ${val.toFixed(2)}</title>
          </rect>`;
          if (bw > 28) {
            svg += `<text x="${(pl + xOff + bw/2).toFixed(1)}" y="${yc+1}" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#fff" font-family="monospace" font-weight="600" style="pointer-events:none">${val.toFixed(1)}</text>`;
          }
        }
        xOff += bw;
      });
      // Full alt name label  -  no truncation, pl adapts to longest name
      svg += `<text x="${pl-8}" y="${yc+1}" text-anchor="end" dominant-baseline="middle" font-size="13" fill="#0D1F3C" font-family="sans-serif" font-weight="600">${_esc(r.name)}</text>`;
      // Total score label at end
      svg += `<text x="${pl + xOff + 4}" y="${yc+1}" dominant-baseline="middle" font-size="12" fill="#2C4470" font-family="monospace">${r.score.toFixed(1)}</text>`;
    });

    // Legend
    const lgY = H - pb + 20;
    let lgX = pl;
    usedTiers.forEach(t => {
      svg += `<rect x="${lgX}" y="${lgY}" width="10" height="10" fill="${TIER_COLORS[t]}" rx="2"/>`;
      svg += `<text x="${lgX+13}" y="${lgY+8}" font-size="12" fill="#555" font-family="sans-serif">${TIER_LABEL[t]}</text>`;
      lgX += 80;
    });

    svg += '</svg>';
    el.innerHTML = svg;
  }

  // ── Advanced Visualisations ───────────────────────────────────────────────
  function _vizTab(tab) {
    _activeVizTab = tab;
    // Reset radar selection when entering the radar tab so it pre-selects top 3
    if (tab === 'parallel') _radarState = null;
    ['heatmap','parallel'].forEach(t => {
      const btn = document.getElementById('viz-tab-' + t);
      if (btn) btn.style.fontWeight = t === tab ? '700' : '';
      if (btn) btn.style.borderBottom = t === tab ? '2px solid var(--accent)' : '';
    });
    _renderAdvViz();
  }

  function _renderAdvViz() {
    const el = document.getElementById('adv-viz-area'); if (!el) return;
    if      (_activeVizTab === 'heatmap')  el.innerHTML = _heatMapSVG();
    else if (_activeVizTab === 'parallel') el.innerHTML = _radarHTML();
  }

  function _toggleRadarAlt(name) {
    if (!_radarState) return;
    if (_radarState.has(name)) _radarState.delete(name);
    else _radarState.add(name);
    // Re-render just the SVG and buttons without full page rebuild
    const el = document.getElementById('adv-viz-area'); if (!el) return;
    el.innerHTML = _radarHTML();
  }

  const _RADAR_ZOOM_MIN = 0.5;
  const _RADAR_ZOOM_MAX = 3;

  function _radarZoomBy(delta) {
    _radarZoom = Math.min(_RADAR_ZOOM_MAX, Math.max(_RADAR_ZOOM_MIN, +(_radarZoom + delta).toFixed(2)));
    const el = document.getElementById('adv-viz-area'); if (!el) return;
    el.innerHTML = _radarHTML();
  }

  function _radarZoomReset() {
    _radarZoom = 1;
    const el = document.getElementById('adv-viz-area'); if (!el) return;
    el.innerHTML = _radarHTML();
  }

  // Ctrl/Cmd + scroll-wheel zoom over the radar chart, without hijacking normal page scroll
  function _radarWheelZoom(ev) {
    if (!(ev.ctrlKey || ev.metaKey)) return; // let the page scroll normally otherwise
    ev.preventDefault();
    _radarZoomBy(ev.deltaY < 0 ? 0.1 : -0.1);
  }

  // ── Advantage Heatmap (Winner vs Each Opponent × Criteria) ─────────────────
  // Build the advantage heatmap SVG
  // Blue = winner ahead, amber = winner behind
  function _heatMapSVG() {
    const leaves = _orderedLeaves();
    const ranked = Compute.ranked();
    const bd     = Compute.breakdown();
    if (ranked.length < 2) return '<p style="color:var(--ink3);font-size:12px;padding:8px">Need at least 2 alternatives to compare.</p>';

    const winner    = ranked[0];
    const opponents = ranked.slice(1);
    const winnerBD  = bd.find(a => a.name === winner.name) || { contributions: [] };

    const nRows = opponents.length;
    const nCols = leaves.length;

    // Fixed coordinate system, large enough that font-size 11 looks small when
    // the SVG scales to fill the card (viewBox units >> rendered px → text shrinks)
    const VW   = 900;
    const pl   = 240, pr = 20, pt = 120, pb = 44;
    const cellW = Math.max(36, Math.floor((VW - pl - pr) / nCols));
    const cellH = 36;
    const VH   = pt + nRows * cellH + pb;

    // Per criterion: max absolute gap for colour scaling
    const critMaxGap = {};
    leaves.forEach(c => {
      const wc   = winnerBD.contributions.find(x => x.crit === c.name);
      const wVal = wc ? wc.weighted : 0;
      critMaxGap[c.id] = Math.max(...opponents.map(opp => {
        const oppBD = bd.find(a => a.name === opp.name) || { contributions: [] };
        const oc = oppBD.contributions.find(x => x.crit === c.name);
        return Math.abs(wVal - (oc ? oc.weighted : 0));
      }), 0.001);
    });

    function gapColor(gap, maxGap) {
      const t = Math.min(Math.abs(gap) / maxGap, 1);
      if (gap >= 0) {
        // Winner ahead: white -> #1A5276
        return `rgb(${Math.round(255+(26-255)*t)},${Math.round(255+(82-255)*t)},${Math.round(255+(118-255)*t)})`;
      } else {
        // Winner behind: white -> #C65D00
        return `rgb(${Math.round(255+(198-255)*t)},${Math.round(255+(93-255)*t)},${Math.round(255+(0-255)*t)})`;
      }
    }

    const svgPixelW = pl + nCols * cellW + pr;
    let svg = `<svg viewBox="0 0 ${Math.max(VW, svgPixelW)} ${VH}" xmlns="http://www.w3.org/2000/svg" width="${Math.max(VW, svgPixelW)}" style="display:block;min-width:${Math.max(VW, svgPixelW)}px">`;

    // Column headers: rotated criterion names
    leaves.forEach((c, ci) => {
      const x   = pl + ci * cellW + cellW / 2;
      const col = State.TIER_COLORS[c.tier] || '#1A5276';
      svg += `<text transform="rotate(-45,${x},${pt-10})" x="${x}" y="${pt-10}" text-anchor="start" font-size="13" fill="${col}" font-family="sans-serif" font-weight="600">${_esc(c.name)}</text>`;
    });

    // Rows
    opponents.forEach((opp, ri) => {
      const y    = pt + ri * cellH;
      const yc   = y + cellH / 2;
      const oppBD = bd.find(a => a.name === opp.name) || { contributions: [] };
      svg += `<text x="${pl-8}" y="${yc+4}" text-anchor="end" font-size="13" fill="var(--ink2)" font-family="sans-serif">${_esc(winner.name)} vs ${_esc(opp.name)}</text>`;

      leaves.forEach((c, ci) => {
        const x    = pl + ci * cellW;
        const wc   = winnerBD.contributions.find(x => x.crit === c.name);
        const wVal = wc ? wc.weighted : 0;
        const oc   = oppBD.contributions.find(x => x.crit === c.name);
        const oVal = oc ? oc.weighted : 0;
        const gap  = wVal - oVal;
        const bg   = gapColor(gap, critMaxGap[c.id]);
        const tCol = Math.abs(gap) / critMaxGap[c.id] > 0.50 ? '#ffffff' : '#0D1F3C';

        svg += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${bg}" stroke="#fff" stroke-width="2">
          <title>${winner.name} vs ${opp.name} - ${c.name}: ${gap>=0?'+':''}${gap.toFixed(2)}</title>
        </rect>`;
        svg += `<text x="${(x+cellW/2).toFixed(1)}" y="${(yc+4).toFixed(1)}" text-anchor="middle" font-size="12" fill="${tCol}" font-family="monospace">${gap>=0?'+':''}${gap.toFixed(2)}</text>`;
      });
    });

    // Legend
    const lgY = VH - pb + 14;
    svg += `<rect x="${pl}" y="${lgY}" width="14" height="14" fill="#1A5276" rx="2"/>`;
    svg += `<text x="${pl+18}" y="${lgY+11}" font-size="13" fill="#555" font-family="sans-serif">Winner ahead</text>`;
    svg += `<rect x="${pl+140}" y="${lgY}" width="14" height="14" fill="#C65D00" rx="2"/>`;
    svg += `<text x="${pl+158}" y="${lgY+11}" font-size="13" fill="#555" font-family="sans-serif">Winner behind</text>`;

    svg += '</svg>';

    const hmW  = Math.max(VW, svgPixelW);
    const scId = 'hm-scroll-' + Date.now();
    const sbId = 'hm-sb-'     + Date.now();
    return `<style>#${scId}::-webkit-scrollbar{display:none}</style>` +
           `<div id="${scId}" style="overflow-x:scroll;overflow-y:auto;max-height:600px;border:1px solid var(--line,#e5e0d0);border-radius:8px 8px 0 0;background:#fff;box-sizing:border-box;scrollbar-width:none;-ms-overflow-style:none" onscroll="(function(sc,sb){var s=document.getElementById(sb);if(s)s.scrollLeft=sc.scrollLeft;})(this,'${sbId}')">` +
           `<div style="min-width:${hmW}px">` + svg + `</div></div>` +
           `<div id="${sbId}" style="overflow-x:auto;overflow-y:hidden;height:14px;border:1px solid var(--line,#e5e0d0);border-top:none;border-radius:0 0 8px 8px;background:#f5f3ef" onscroll="(function(sb,sc){var s=document.getElementById(sc);if(s)s.scrollLeft=sb.scrollLeft;})(this,'${scId}')">` +
           `<div style="width:${hmW + 32}px;height:1px"></div></div>`;
  }

    // ── Parallel Coordinates Plot ────────────────────────────────────────────
  // Build the radar/spider chart
  function _radarHTML() {
    const leaves  = _orderedLeaves();
    const basis   = State.getBasis();
    const bd      = Compute.breakdown();
    const alts    = State.getAlts();
    const ranked  = Compute.ranked();
    const n       = leaves.length;

    if (n < 3)     return '<p style="color:var(--ink3);font-size:12px;padding:8px">Radar chart requires at least 3 criteria.</p>';
    if (!bd.length) return '<p style="color:var(--ink3);font-size:12px;padding:8px">No scores entered yet.</p>';

    const ALT_COLORS = ['#1A5276','#C65D00','#1A7A6E','#0E6B8C','#8C3D00','#2E5E8E','#7A4A1E','#005050','#3A3A7A','#2C1A5C'];

    // Cap axes at 20 by picking the top criteria by global weight.
    // Never split by tier  -  that grouping was not asked for.
    const MAX_AXES  = 50;
    const MAX_POLYS = 5;

    if (!_radarState) {
      _radarState = new Set(ranked.slice(0, Math.min(3, ranked.length)).map(r => r.name));
    }

    // Which leaves to render: top MAX_AXES by global weight, preserving original order
    const sorted     = [...leaves].sort((a, b) => Compute.globalW(b) - Compute.globalW(a));
    const topLeaves  = sorted.slice(0, MAX_AXES);
    const activeLeaves = leaves.filter(c => topLeaves.some(t => t.id === c.id)); // preserve tree order
    const nAxes      = activeLeaves.length;
    const capped     = n > MAX_AXES;

    // Silently cap checked alternatives to MAX_POLYS
    const checkedAlts = Array.from(_radarState).filter(x => typeof x === 'string' && alts.includes(x));
    if (checkedAlts.length > MAX_POLYS) {
      checkedAlts.slice(MAX_POLYS).forEach(x => _radarState.delete(x));
    }

    const R = 165, CX = 210, CY = 200, VW = 420, VH = 400;
    const rings = [0.25, 0.5, 0.75, 1.0];

    // Dynamic label font size and placement radius based on density
    const labelFontSize = nAxes <= 6 ? 11 : nAxes <= 10 ? 10 : nAxes <= 16 ? 9 : 8;
    const labelR        = nAxes <= 8 ? 1.30 : nAxes <= 14 ? 1.33 : 1.36;
    // Dynamic maxChars: derived from arc gap geometry but adjusted for label direction.
    // Labels on the sides (text-anchor:end/start) don't compete with each other - only
    // top/bottom labels (text-anchor:middle) truly constrain length. Use a generous
    // multiplier so full names show whenever physically possible.
    const arcGap   = 2 * (R * labelR) * Math.sin(Math.PI / nAxes);
    const charPx   = labelFontSize * 0.58;
    const maxChars = Math.max(6, Math.floor(arcGap * 0.72 / charPx));

    // Add generous padding inside the viewBox so labels never clip
    const PAD = 80; // px padding around radar ring for labels
    const svgW = (CX + R) * 2 + PAD * 2;  // total viewBox width
    const svgH = (CY + R) * 2 + PAD * 2;  // total viewBox height
    const vbX  = -(CX - (svgW / 2 - R - PAD));  // shift so centre is centred in viewBox
    const vbY  = -(CY - (svgH / 2 - R - PAD));

    // Actual rendered px = viewBox size × zoom, minimum 400
    const rendW = Math.max(Math.round(svgW * _radarZoom), 400);
    const rendH = Math.max(Math.round(svgH * _radarZoom), 380);

    function pt(angleIdx, fraction) {
      const angle = (Math.PI * 2 * angleIdx / nAxes) - Math.PI / 2;
      return { x: CX + R * fraction * Math.cos(angle), y: CY + R * fraction * Math.sin(angle) };
    }

    let svg = `<svg viewBox="${-PAD} ${-PAD} ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" width="${rendW}" height="${rendH}" style="display:block;overflow:visible">`;

    // Ring grid
    rings.forEach(f => {
      const pts = activeLeaves.map((_,i) => { const p=pt(i,f); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; });
      svg += `<polygon points="${pts.join(' ')}" fill="none" stroke="#C8D4E8" stroke-width="${f===1?1.5:0.7}" stroke-dasharray="${f===1?'':'3,3'}"/>`;
      const tp = pt(0, f);
      svg += `<text x="${(tp.x+3).toFixed(1)}" y="${tp.y.toFixed(1)}" font-size="8" fill="#bbb" font-family="monospace" text-anchor="start">${(f*basis).toFixed(0)}</text>`;
    });

    // Spokes
    activeLeaves.forEach((_,i) => {
      const p = pt(i,1);
      svg += `<line x1="${CX}" y1="${CY}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="#C8D4E8" stroke-width="0.8"/>`;
    });

    // Axis labels - truncate based on density; use data-tip on an invisible overlay rect for reliable tooltips
    activeLeaves.forEach((c,i) => {
      const p      = pt(i, labelR);
      const col    = State.TIER_COLORS[c.tier] || '#555';
      const anchor = p.x < CX - 8 ? 'end' : p.x > CX + 8 ? 'start' : 'middle';
      const label  = c.name.length > maxChars ? c.name.slice(0, maxChars - 1) + '\u2026' : c.name;
      const estW   = label.length * labelFontSize * 0.6 + 8;
      const rectX  = anchor === 'end' ? p.x - estW : anchor === 'start' ? p.x : p.x - estW / 2;
      svg += `<g>
        <text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle" font-size="${labelFontSize}" font-weight="600" fill="${col}" font-family="sans-serif">${_esc(label)}</text>
        <rect x="${rectX.toFixed(1)}" y="${(p.y - labelFontSize).toFixed(1)}" width="${estW.toFixed(1)}" height="${(labelFontSize * 2).toFixed(1)}" fill="transparent" data-tip="${_esc(c.name)}" style="cursor:default"/>
      </g>`;
    });

    // Polygons - only checked alternatives
    bd.forEach(alt => {
      if (!_radarState.has(alt.name)) return;
      const col = ALT_COLORS[alts.indexOf(alt.name) % ALT_COLORS.length];
      const pts = activeLeaves.map((c,i) => {
        const contrib = alt.contributions.find(x => x.crit === c.name) || {};
        const raw = contrib.raw != null ? contrib.raw : 0;
        const p = pt(i, Math.min(raw / basis, 1));
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      });
      svg += `<polygon points="${pts.join(' ')}" fill="${col}" fill-opacity="0.15" stroke="${col}" stroke-width="2" stroke-linejoin="round"/>`;
      activeLeaves.forEach((c,i) => {
        const contrib = alt.contributions.find(x => x.crit === c.name) || {};
        const raw = contrib.raw != null ? contrib.raw : 0;
        const p = pt(i, Math.min(raw / basis, 1));
        svg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="${col}" fill-opacity="0.9"><title>${_esc(alt.name)}, ${_esc(c.name)}: ${raw.toFixed(1)}</title></circle>`;
      });
    });
    svg += '</svg>';

    // Note shown when criteria count exceeds MAX_AXES
    const capNote = capped
      ? `<p style="text-align:center;font-size:10px;color:var(--ink3);font-family:var(--font-mono);margin-bottom:8px">Showing top ${MAX_AXES} of ${n} criteria by global weight for readability.</p>`
      : '';

    // Zoom wrapper
    const zoomPct     = Math.round(_radarZoom * 100);
    const isZoomed    = Math.abs(_radarZoom - 1.0) > 0.05;
    const zoomControls = `<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:8px">
      <button class="btn btn-sm" onclick="UI._radarZoomBy(-0.1)" ${_radarZoom<=_RADAR_ZOOM_MIN?'disabled':''} style="font-size:13px;line-height:1;padding:4px 10px">−</button>
      <button class="btn btn-sm" onclick="UI._radarZoomReset()" style="font-size:11px;font-family:var(--font-mono);min-width:48px">${zoomPct}%</button>
      <button class="btn btn-sm" onclick="UI._radarZoomBy(0.1)" ${_radarZoom>=_RADAR_ZOOM_MAX?'disabled':''} style="font-size:13px;line-height:1;padding:4px 10px">+</button>
      ${isZoomed ? `<button class="btn btn-sm" onclick="UI._radarZoomReset()" style="font-size:11px;padding:4px 10px;background:var(--accent2);color:#fff;border-color:var(--accent2)">↺ Reset</button>` : ''}
      <span style="font-size:10px;color:var(--ink3);font-family:var(--font-mono);margin-left:4px">Scroll to pan · Ctrl+scroll to zoom</span>
    </div>`;
    const chartW = rendW;
    const chartH = rendH;
    const scId   = 'radar-scroll-' + Date.now(); // unique id for scroll sync
    const sbId   = 'radar-sb-'     + Date.now();
    const zoomedSvg = zoomControls +
      `<style>#${scId}::-webkit-scrollbar{display:none}</style>` +
      `<div id="${scId}" style="overflow-x:scroll;overflow-y:auto;max-height:540px;border:1px solid var(--line,#e5e0d0);border-radius:8px 8px 0 0;background:#fff;padding:16px;box-sizing:border-box;cursor:grab;text-align:center;scrollbar-width:none;-ms-overflow-style:none" onwheel="UI._radarWheelZoom(event)" onscroll="(function(sc,sb){var s=document.getElementById(sb);if(s)s.scrollLeft=sc.scrollLeft;})(this,'${sbId}')">` +
      `<div style="display:inline-block;min-width:${chartW}px;min-height:${chartH}px">` +
      svg + `</div></div>` +
      `<div id="${sbId}" style="overflow-x:auto;overflow-y:hidden;height:14px;border:1px solid var(--line,#e5e0d0);border-top:none;border-radius:0 0 8px 8px;background:#f5f3ef;margin-bottom:4px" onscroll="(function(sb,sc){var s=document.getElementById(sc);if(s)s.scrollLeft=sb.scrollLeft;})(this,'${scId}')">` +
      `<div style="width:${chartW + 32}px;height:1px"></div></div>`;

    // Legend with cap enforcement
    const activeCnt = Array.from(_radarState).filter(x=>typeof x==='string'&&alts.includes(x)).length;
    const warnMsg   = activeCnt >= MAX_POLYS
      ? `<p style="text-align:center;font-size:10px;color:var(--error,#D93636);font-family:var(--font-mono);margin-top:4px">Max ${MAX_POLYS} alternatives shown at once for readability.</p>`
      : '';
    let legend = `<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:10px;padding:0 8px">`;
    alts.forEach((name, ai) => {
      const col      = ALT_COLORS[ai % ALT_COLORS.length];
      const on       = _radarState.has(name);
      const rank     = ranked.findIndex(r => r.name === name) + 1;
      const disabled = !on && activeCnt >= MAX_POLYS;
      legend += `<button onclick="UI._toggleRadarAlt('${_esc(name)}')" ${disabled?'disabled title="Deselect one first"':''} style="display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:20px;border:2px solid ${col};background:${on?col:'transparent'};color:${on?'#fff':col};font-size:10px;font-family:sans-serif;font-weight:600;cursor:${disabled?'not-allowed':'pointer'};opacity:${disabled?'0.4':'1'};transition:all .15s;white-space:nowrap">
        <span style="width:8px;height:8px;border-radius:50%;border:2px solid ${on?'rgba(255,255,255,.7)':col};background:${on?'rgba(255,255,255,.35)':'transparent'};display:inline-block;flex-shrink:0"></span>
        #${rank} ${_esc(name)}
      </button>`;
    });
    legend += `</div>${warnMsg}<p style="text-align:center;font-size:10px;color:var(--ink3);font-family:var(--font-mono);margin-top:6px">Click to show or hide. Max ${MAX_POLYS} at once. Hover axis labels to see full names.</p>`;

    return `<div>${capNote}${zoomedSvg}${legend}</div>`;
  }

  // (radarSetTier removed - tier split no longer used)

  // ── Sensitivity sandbox ─────────────────────────────────────────────────
  // sensitivity uses a local copy of weights so State is never touched
  let _sensOrigWeights = null;
  let _sensWeights = null;

  function _sensNormCritW(crit) {
    const sibs = State.getSiblings(crit.id);
    const sum  = sibs.reduce((s,c) => s + (_sensWeights[c.id]||0), 0) || 1;
    return (_sensWeights[crit.id]||0) / sum;
  }

  // same as compute.js but using sandbox weights
  function _sensComputeScores() {
    const mode   = State.getMode();
    const leaves = State.getLeaves();
    const alts   = State.getAlts();
    const basis  = State.getBasis();

    function localW(c) {
      let w = _sensNormCritW(c), cur = c;
      while (cur.parentId) {
        const p = State.getCrits().find(cc => cc.id === cur.parentId);
        if (!p) break;
        w *= _sensNormCritW(p);
        cur = p;
      }
      return w;
    }

    function tierW(t) {
      const usedTiers = State.TIERS.filter(tt => leaves.some(c => c.tier === tt));
      const tw = State.getTierW();
      const sum = usedTiers.reduce((s,tt) => s + (tw[tt]||0), 0) || 1;
      return (tw[t]||0) / sum;
    }

    if (mode === 'US') {
      const sus = State.getScoresUS();
      return alts.map((_,ai) =>
        State.TIERS.reduce((total, t) => {
          const tLeaves = leaves.filter(c => c.tier === t);
          if (!tLeaves.length) return total;
          const ts = tLeaves.reduce((s,c) => {
            const v = (sus[ai] && sus[ai][c.id] != null) ? +sus[ai][c.id] : 0;
            return s + localW(c) * v;
          }, 0);
          return total + tierW(t) * ts;
        }, 0)
      );
    } else {
      const rim = State.getScoresRIM();
      return alts.map((_,ai) => {
        const tierScores = {};
        State.TIERS.forEach(t => {
          const tLeaves = leaves.filter(c => c.tier === t);
          if (!tLeaves.length) return;
          let p = 1;
          tLeaves.forEach(c => {
            const v = (rim[ai] && rim[ai][c.id] != null) ? +rim[ai][c.id] : 0;
            p *= Math.pow(v > 0 ? v / basis : 0.001, localW(c));
          });
          tierScores[t] = p * basis;
        });
        let p = 1;
        State.TIERS.forEach(t => {
          if (tierScores[t] == null) return;
          p *= Math.pow(tierScores[t] > 0 ? tierScores[t] / basis : 0.001, tierW(t));
        });
        return p * basis;
      });
    }
  }

  function _sensRanked() {
    const scores = _sensComputeScores(), alts = State.getAlts();
    return [...alts.map((a,i) => ({name:a, score:scores[i], idx:i}))]
      .sort((a,b) => b.score - a.score);
  }

  function _sensSetNormW(critId, normVal) {
    const crit = State.getCrits().find(c => c.id === critId);
    if (!crit) return;
    const sibs = State.getSiblings(critId).filter(c => c.id !== critId);
    const sibSum = sibs.reduce((s,c) => s + (_sensWeights[c.id]||0), 0) || 1;
    const sibScale = 1 - normVal;                // what siblings share together
    sibs.forEach(c => {
      _sensWeights[c.id] = (_sensWeights[c.id]||0) / sibSum * sibScale;
    });
    _sensWeights[critId] = normVal;
  }

  // Breakeven: binary-search in NORMALISED weight space for the criterion.
  // Find the weight value at which the top alternative would be overtaken
  // Uses binary search - couldn't find a closed-form formula
  function _breakeven(critId) {
    if (!_sensWeights) return 'N/A';
    const snap = Object.assign({}, _sensWeights);
    const r0 = _sensRanked();
    if (r0.length < 2) { Object.assign(_sensWeights, snap); return 'N/A'; }
    const topName = r0[0].name;

    function tryNorm(nw) {
      Object.assign(_sensWeights, snap);
      _sensSetNormW(critId, nw);
      return _sensRanked()[0].name;
    }

    // Check if any flip exists across the full 0-1 range before binary searching
    const currentNorm = _sensNormCritW(State.getCrits().find(c => c.id === critId) || {id: critId});
    let flipExists = false;
    const probes = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    for (const p of probes) {
      if (tryNorm(p) !== topName) { flipExists = true; break; }
    }
    if (!flipExists) {
      Object.assign(_sensWeights, snap);
      return '-';
    }

    // Binary search across full 0→1 to find the first weight value that flips the leader
    // Search downward from current first, then upward, take the closer one
    let found = null;

    // Downward search: from currentNorm down to 0
    if (tryNorm(0) !== topName) {
      let lo = 0, hi = currentNorm;
      for (let i = 0; i < 32; i++) {
        const mid = (lo + hi) / 2;
        if (tryNorm(mid) !== topName) { found = mid; hi = mid; } else lo = mid;
      }
    }

    // Upward search: from currentNorm up to 1 - take if closer or no downward found
    if (tryNorm(1) !== topName) {
      let lo = currentNorm, hi = 1, upFound = null;
      for (let i = 0; i < 32; i++) {
        const mid = (lo + hi) / 2;
        if (tryNorm(mid) !== topName) { upFound = mid; hi = mid; } else lo = mid;
      }
      if (upFound !== null) {
        // Take whichever flip point is closer to current weight
        if (found === null || Math.abs(upFound - currentNorm) < Math.abs(found - currentNorm)) {
          found = upFound;
        }
      }
    }

    Object.assign(_sensWeights, snap);
    if (found === null) return '-';
    if (found < 0.02) return '~0 (unstable)';
    if (found > 0.98) return '~1 (stable)';
    return found.toFixed(2);
  }

  // Build the tornado chart (sensitivity bar chart)
  // Shows which criteria have most influence on the ranking
  function _renderTornado() {
    const el = document.getElementById('tornado-chart'); if (!el) return;
    const leaves = State.getLeaves();
    const r0 = _sensRanked(); if (!r0.length) return;
    const topName = r0[0].name;

    // Snapshot sandbox so sweeps don't accumulate
    const snap = Object.assign({}, _sensWeights);

    // For each criterion sweep its normalised weight 0→1 (correct for both
    // DISCUS and DISCRIM), record the score range of the current top alt.
    const bars = leaves.map(c => {
      let lo = Infinity, hi = -Infinity;
      [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1].forEach(nw => {
        Object.assign(_sensWeights, snap);
        _sensSetNormW(c.id, nw);
        const r = _sensRanked();
        const topScore = (r.find(x => x.name === topName) || r[0]).score;
        lo = Math.min(lo, topScore);
        hi = Math.max(hi, topScore);
      });
      Object.assign(_sensWeights, snap); // restore after each criterion
      return { name: c.name, tier: c.tier, range: hi - lo, lo, hi };
    }).sort((a,b) => b.range - a.range);

    const W=320, BH=18, GAP=5, PL=80, PR=16, PT=8;
    const H = PT + bars.length * (BH + GAP);
    const maxRange = bars[0]?.range || 1;
    let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block">`;
    bars.forEach((b,i) => {
      const y = PT + i * (BH + GAP);
      const bw = Math.max(2, (W-PL-PR) * b.range / maxRange);
      const col = State.TIER_COLORS[b.tier] || '#1868C2';
      const nm = b.name.length > 13 ? b.name.slice(0,12)+'…' : b.name;
      svg += `<rect x="${PL}" y="${y}" width="${bw}" height="${BH}" fill="${col}" rx="3" opacity=".85"/>`;
      svg += `<text x="${PL-4}" y="${y+BH/2+1}" text-anchor="end" dominant-baseline="middle" font-size="11" fill="#0D1F3C" font-family="sans-serif">${nm}</text>`;
      svg += `<text x="${PL+bw+4}" y="${y+BH/2+1}" dominant-baseline="middle" font-size="10" fill="${col}" font-family="monospace">±${b.range.toFixed(2)}</text>`;
    });
    svg += '</svg>';
    el.innerHTML = svg;
  }

  // Called every time a sensitivity slider moves
  function _liveSens(critId, val) {
    _sensSetNormW(critId, val);
    // Update slider label
    const lbl = document.getElementById(`slv-${critId}`); if (lbl) lbl.textContent = val.toFixed(2);
    // Update breakeven (normalised space)
    const be = document.getElementById(`be-${critId}`); if (be) be.textContent = _breakeven(critId);
    // Recompute rankings using sandbox
    const r = _sensRanked();
    const topEl = document.getElementById('sens-top');
    const prevTop = topEl ? topEl.textContent : '';
    const newTop = r[0]?.name || '-';
    const topChanged = prevTop && prevTop !== '-' && prevTop !== newTop;
    if (topEl) topEl.textContent = newTop;
    const scEl = document.getElementById('sens-score'); if (scEl) scEl.textContent = (r[0]?.score||0).toFixed(2);
    const mgEl = document.getElementById('sens-margin'); if (mgEl) mgEl.textContent = r.length > 1 ? Math.abs(r[0].score - r[1].score).toFixed(2) : '-';
    // Highlight Top Ranked card if leader changed
    const topCard = topEl?.closest('.scard');
    if (topCard && topChanged) {
      topCard.style.transition = 'background .2s, color .2s';
      topCard.style.background = 'var(--accent,#1A5276)';
      // Make both label and value white so text is readable on blue background
      const lbl = topCard.querySelector('.scard-l');
      const val = topCard.querySelector('.scard-v');
      if (lbl) lbl.style.color = 'rgba(255,255,255,.75)';
      if (val) val.style.color = '#ffffff';
      clearTimeout(topCard._ht);
      topCard._ht = setTimeout(() => {
        topCard.style.background = '';
        if (lbl) lbl.style.color = '';
        if (val) val.style.color = '';
      }, 2000);
    }
    // Update ranking bars
    const max = r[0]?.score || State.getBasis();
    r.forEach((alt,i) => {
      const bar = document.querySelector(`.rbar-i.${['b1','b2','b3','bn'][Math.min(i,3)]}`);
      const scoreEl = document.querySelectorAll('.rscore')[i];
      if (bar) bar.style.width = (max > 0 ? alt.score / max * 100 : 0).toFixed(0) + '%';
      if (scoreEl) scoreEl.textContent = alt.score.toFixed(1);
    });
    // Re-render tornado
    _renderTornado();
    // Update sensitivity breakdown table live
    _updateSensBreakdown();
  }

  function _resetSensWeights() {
    if (!_sensOrigWeights) return;
    _sensWeights = Object.assign({}, _sensOrigWeights);
    _renderStep4();
  }

  // Run sensitivity analysis and update all the charts
  function _runSens() {}

  let _refineModalCallback = null;
  function openRefineModal(title, body, inputPlaceholder, onConfirm) {
    const modal=document.getElementById('refineModal');
    const titleEl=document.getElementById('refineModalTitle');
    const bodyEl=document.getElementById('refineModalBody');
    const inp=document.getElementById('refineModalInput');
    const confirmBtn=document.getElementById('refineModalConfirm');
    if(!modal) return;
    titleEl.textContent=title;
    bodyEl.innerHTML=body;
    if(inputPlaceholder){ inp.style.display=''; inp.placeholder=inputPlaceholder; inp.value=''; setTimeout(()=>inp.focus(),80); }
    else inp.style.display='none';
    _refineModalCallback=onConfirm;
    confirmBtn.onclick=()=>{ const v=inputPlaceholder?inp.value.trim():null; closeRefineModal(); if(onConfirm) onConfirm(v); };
    modal.style.display='flex';
  }
  function closeRefineModal() {
    const modal=document.getElementById('refineModal'); if(modal) modal.style.display='none';
    _refineModalCallback=null;
  }

  // Handle the refinement panel buttons (Stage 7 of Brugha cycle)
  function _refine(type) {
    Session.autoSnapshot('Pre-refinement checkpoint');
    if(type==='scores') return goStep(3);
    if(type==='weights') return goStep(2);
    if(type==='set') {
      _openModifySetModal();
    }
  }

  // Build and open the "Modify Alternatives" panel
  function _openModifySetModal() {
    // Current alternatives list with ✕ Remove buttons
    const altListHTML = State.getAlts().map((a, i) =>
      `<div style="display:flex;align-items:center;justify-content:space-between;
          padding:8px 12px;background:var(--surface2);border:1px solid var(--border2);
          border-radius:7px;margin-bottom:6px">
        <span style="font-size:14px;font-weight:600;color:var(--ink)">${i+1}. ${_esc(a)}</span>
        <button onclick="UI._refineRemoveDirect(${i})"
          style="padding:4px 10px;background:var(--error-l);color:var(--error);
            border:1px solid var(--error);border-radius:6px;font-size:12px;font-weight:700;
            cursor:pointer;font-family:inherit">✕ Remove</button>
      </div>`
    ).join('') || `<p style="color:var(--ink3);font-size:13px">No alternatives. Add one below.</p>`;

    // Previously removed alternatives with ↩ Re-add buttons
    const removedHTML = _removedAlts.length === 0 ? '' :
      `<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border2)">
        <div style="font-size:11px;font-weight:700;color:var(--ink3);text-transform:uppercase;
            letter-spacing:.07em;margin-bottom:8px;font-family:var(--font-mono)">
          ↩ Previously Removed : Restore with Scores
        </div>
        ${_removedAlts.map((r, ri) =>
          `<div style="display:flex;align-items:center;justify-content:space-between;
              padding:8px 12px;background:var(--accent-l);border:1px solid var(--accent);
              border-radius:7px;margin-bottom:6px;opacity:.9">
            <div>
              <span style="font-size:14px;font-weight:600;color:var(--ink)">${_esc(r.name)}</span>
              <span style="font-size:11px;color:var(--ink3);font-family:var(--font-mono);margin-left:8px">
                ${r.hasScores ? 'scores saved' : 'no scores'}
              </span>
            </div>
            <button onclick="UI._refineRestore(${ri})"
              style="padding:4px 10px;background:var(--accent);color:#fff;border:none;
                border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">
              ↩ Re-add
            </button>
          </div>`
        ).join('')}
      </div>`;

    openRefineModal(
      'Modify Set of Alternatives',
      `<p style="font-size:13px;color:var(--ink2);margin:0 0 12px">
        Remove alternatives with ✕. Removed alternatives are saved below - restore them with ↩ Re-add.
        DISCUS scores are always retained. DISCRIM scores are re-proportioned on remove and restore.
       </p>
       ${altListHTML}
       ${removedHTML}
       <div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--border2)">
         <button class="btn btn-sm btn-gold" onclick="UI._refineAdd()">+ Add New Alternative</button>
       </div>`,
      null, null
    );
    document.getElementById('refineModalConfirm').style.display='none';
  }
  // Remove an alternative and save its scores so it can be restored
  function _refineRemoveDirect(i) {
    const name = State.getAlts()[i];
    if (!name) return;
    Session.autoSnapshot(`Before removing alternative "${name}"`);

    // Save this alternative's scores before removal so it can be restored later
    const usStore  = State.getScoresUS();
    const rimStore = State.getScoresRIM();
    const origStore= State.getScoreOrigin();
    const savedUS  = JSON.parse(JSON.stringify(usStore[i]  || {}));
    const savedRIM = JSON.parse(JSON.stringify(rimStore[i] || {}));
    const savedOrig= JSON.parse(JSON.stringify(origStore[i]|| {}));
    const hasScores = Object.values(savedUS).some(v=>v>0) || Object.values(savedRIM).some(v=>v>0);

    // DISCRIM: re-proportion remaining row sums to still equal basis
    if (State.getMode() === 'RIM') {
      const b = State.getBasis();
      State.getLeaves().forEach(c => {
        const othersSum = State.getAlts().reduce((s, _, ai) => {
          if (ai === i) return s;
          return s + ((rimStore[ai] && rimStore[ai][c.id] != null) ? rimStore[ai][c.id] : 0);
        }, 0);
        if (othersSum <= 0) return;
        const scale = b / othersSum;
        State.getAlts().forEach((_, ai) => {
          if (ai === i) return;
          const cur = (rimStore[ai] && rimStore[ai][c.id] != null) ? rimStore[ai][c.id] : 0;
          State.setScore(ai, c.id, Math.round(cur * scale * 10) / 10);
        });
      });
    }

    State.removeAlt(i);

    // Add to the removed cache (most recently removed first)
    _removedAlts.unshift({ name, scoresUS: savedUS, scoresRIM: savedRIM, scoreOrigin: savedOrig, hasScores });

    toast(`Removed "${name}" ✓ - restore it using ↩ Re-add`);

    if (State.getAlts().length === 0) { closeRefineModal(); goStep(1); return; }
    _renderStep4();
    setTimeout(() => _openModifySetModal(), 80);
  }
  // Restore a previously removed alternative with its saved scores
  function _refineRestore(ri) {
    const entry = _removedAlts[ri];
    if (!entry) return;
    const { name, scoresUS, scoresRIM, scoreOrigin } = entry;

    // Check for name conflict
    if (State.getAlts().some(a => a.trim().toLowerCase() === name.trim().toLowerCase())) {
      toast(`⚠ "${name}" already exists as an alternative.`);
      return;
    }

    Session.autoSnapshot(`Before restoring alternative "${name}"`);

    // Add the alternative back (appended at end)
    State.addAlt(name);
    const newAi = State.getAlts().length - 1;

    // Restore DISCUS scores
    const leaves = State.getLeaves();
    leaves.forEach(c => {
      const v = (scoresUS && scoresUS[c.id] != null) ? scoresUS[c.id] : 0;
      State.setScore(newAi, c.id, v, 'US');
      State.setScoreOrigin(newAi, c.id, (scoreOrigin && scoreOrigin[c.id]) || (v > 0 ? 'user' : ''));
    });

    // Restore / adjust DISCRIM scores
    if (State.getMode() === 'RIM') {
      const b = State.getBasis();
      // First restore saved RIM scores for the new alternative
      leaves.forEach(c => {
        const savedV = (scoresRIM && scoresRIM[c.id] != null) ? scoresRIM[c.id] : 0;
        State.setScore(newAi, c.id, savedV, 'RIM');
      });
      // Now re-proportion: each row must still sum to basis
      const rimStore = State.getScoresRIM();
      leaves.forEach(c => {
        const rowSum = State.getAlts().reduce((s, _, ai) =>
          s + ((rimStore[ai] && rimStore[ai][c.id] != null) ? rimStore[ai][c.id] : 0), 0);
        if (Math.abs(rowSum - b) < 0.05) return; // already valid
        if (rowSum <= 0) return;
        const scale = b / rowSum;
        State.getAlts().forEach((_, ai) => {
          const cur = (rimStore[ai] && rimStore[ai][c.id] != null) ? rimStore[ai][c.id] : 0;
          State.setScore(ai, c.id, Math.round(cur * scale * 10) / 10);
        });
      });
    }

    // Remove from the removed cache
    _removedAlts.splice(ri, 1);

    toast(`Restored "${name}" ✓ with saved scores`);
    _renderStep4();
    setTimeout(() => _openModifySetModal(), 80);
  }
  // Show the inline add-alternative form inside the modify modal
  function _refineAdd() {
    // Show an inline name-entry form inside the modify modal
    // rather than opening a second modal (which loses context)
    const container = document.getElementById('refineModalContent') ||
                      document.querySelector('.refine-modal-body') ||
                      document.querySelector('.modal-body');

    // Build inline add form directly in the existing modify-set modal
    const addFormHTML = `
      <div id="refineAddForm" style="margin-top:14px;padding:14px;background:var(--accent-l);
          border:1px solid var(--accent);border-radius:8px">
        <div style="font-size:13px;font-weight:700;color:var(--ink);margin-bottom:8px">
          Add a New Alternative
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <input id="refineAddInput" type="text" placeholder="Enter alternative name..."
            style="flex:1;padding:8px 12px;border:1.5px solid var(--accent);border-radius:7px;
              font-size:13px;font-family:inherit;background:var(--surface)"
            onkeydown="if(event.key==='Enter')UI._refineAddConfirm()">
          <button onclick="UI._refineAddConfirm()" style="padding:8px 16px;background:var(--accent);
              color:#fff;border:none;border-radius:7px;font-size:13px;font-weight:700;
              cursor:pointer;font-family:inherit;white-space:nowrap">Add & Score</button>
          <button onclick="(function(){var f=document.getElementById('refineAddForm');if(f)f.remove();})()"
            style="padding:8px 12px;background:transparent;border:1px solid var(--border);
              color:var(--ink3);border-radius:7px;font-size:13px;cursor:pointer;font-family:inherit">
            Cancel
          </button>
        </div>
        <div id="refineAddError" style="font-size:12px;color:var(--error);margin-top:6px;display:none"></div>
        <div style="font-size:11px;color:var(--ink3);margin-top:6px;font-family:var(--font-mono)">
          After adding, you will be taken to the Scoring page to enter scores for this alternative.
          DISCRIM rows will be re-proportioned automatically.
        </div>
      </div>`;

    // Find the add button and insert form after it
    const addBtn = document.querySelector('#refineModal button[onclick*="_refineAdd"]') ||
                   document.querySelector('#refineModal .btn-gold');
    if (addBtn && addBtn.parentNode) {
      // Remove any existing form first
      const existing = document.getElementById('refineAddForm');
      if (existing) existing.remove();
      addBtn.insertAdjacentHTML('afterend', addFormHTML);
      setTimeout(() => document.getElementById('refineAddInput')?.focus(), 50);
    }
  }

  // Validate the new alternative name and add it to the decision
  // Then navigate to scoring so the user can enter scores for it
  function _refineAddConfirm() {
    const input = document.getElementById('refineAddInput');
    const errEl = document.getElementById('refineAddError');
    if (!input) return;
    const v = input.value.trim();

    // Validate — same rules as Step 1 setup
    if (!v) {
      if (errEl) { errEl.textContent = 'Please enter a name for the alternative.'; errEl.style.display = ''; }
      input.focus();
      return;
    }
    if (v.length > 50) {
      if (errEl) { errEl.textContent = 'Name must be 50 characters or fewer.'; errEl.style.display = ''; }
      input.focus();
      return;
    }
    const exists = State.getAlts().some(a => a.trim().toLowerCase() === v.toLowerCase());
    if (exists) {
      if (errEl) { errEl.textContent = `"${v}" already exists as an alternative. Please use a different name.`; errEl.style.display = ''; }
      input.select();
      return;
    }

    // Valid — add to state
    Session.autoSnapshot(`Before adding alternative "${v}"`);
    State.addAlt(v);

    // Re-proportion DISCRIM rows to include the new alternative (equal share by default)
    if (State.getMode() === 'RIM') {
      const b = State.getBasis();
      const alts = State.getAlts();
      const n = alts.length;
      const newAi = n - 1;
      const rimStore = State.getScoresRIM();
      State.getLeaves().forEach(c => {
        // Give the new alt a proportional share and scale down the others
        const othersSum = alts.slice(0, n-1).reduce((s,_,ai) =>
          s + ((rimStore[ai] && rimStore[ai][c.id] != null) ? rimStore[ai][c.id] : 0), 0);
        const newShare = b / n;
        const scale = othersSum > 0 ? (b - newShare) / othersSum : 1;
        alts.slice(0, n-1).forEach((_,ai) => {
          const cur = (rimStore[ai] && rimStore[ai][c.id] != null) ? rimStore[ai][c.id] : 0;
          State.setScore(ai, c.id, Math.round(cur * scale * 10) / 10);
        });
        State.setScore(newAi, c.id, Math.round(newShare * 10) / 10);
      });
    }

    toast(`Added "${v}" ✓ - now enter scores below`);
    closeRefineModal();
    // Navigate to scoring page so user enters scores for the new alternative
    goStep(3);
    // Scroll to highlight the new alternative column (brief flash)
    setTimeout(() => {
      const scoreNote = document.getElementById('scoreNote');
      const main = document.getElementById('mainContent');
      if (scoreNote && main) {
        main.scrollTo({ top: 0, behavior: 'smooth' });
        scoreNote.style.boxShadow = '0 0 0 3px var(--accent)';
        setTimeout(() => { scoreNote.style.boxShadow = ''; }, 2000);
      }
    }, 350);
  }
  function _refineRemove() {
    closeRefineModal();
    const names=State.getAlts().map((a,i)=>`${i+1}. ${a}`).join('<br>');
    openRefineModal('Remove Alternative',`<strong>Current alternatives:</strong><br>${names}<br><br>Enter the exact name to remove:`, 'Alternative name…', v=>{
      if(!v) return;
      const i=State.getAlts().indexOf(v);
      if(i<0){ openRefineModal('Not Found',`"${v}" was not found in the alternatives list.`,null,null); document.getElementById('refineModalConfirm').textContent='OK'; return; }
      State.removeAlt(i); toast(`Removed "${v}" ✓`); goStep(3);
    });
    document.getElementById('refineModalConfirm').textContent='Remove';
  }
  // Toggle between DISCUS and DISCRIM scoring methods
  function _switchMode() {
    Session.autoSnapshot(`Before switching to ${State.getMode()==='US'?'DISCRIM':'DISCUS'}`);
    State.setMode(State.getMode()==='US'?'RIM':'US');
    const newMode = State.getMode()==='US'?'DISCUS':'DISCRIM';
    toast(`Switched to ${newMode} ✓`);
    goStep(3);
    // Scroll to and flash the mode banner so the user sees what changed
    setTimeout(() => {
      const note = document.getElementById('scoreNote');
      if (!note) return;
      note.scrollIntoView({ behavior:'smooth', block:'center' });
      note.style.transition = 'box-shadow .2s, border-color .2s';
      note.style.boxShadow = '0 0 0 3px var(--accent)';
      note.style.borderColor = 'var(--accent)';
      setTimeout(() => {
        note.style.boxShadow = '';
        note.style.borderColor = '';
      }, 1800);
    }, 320);
  }
  // Start a completely fresh analysis (with confirmation prompt)
  function _startNew() {
    openRefineModal(
      'Start New Analysis',
      'This will clear all current alternatives, criteria, weights and scores. Unsaved changes will be lost.',
      null,
      ()=>{ State.reset(); State.ensure(); _removedAlts = []; document.getElementById('hdrSessionName').textContent='Unsaved session'; goStep(1); }
    );
    document.getElementById('refineModalConfirm').textContent='Start New';
  }

  /* Modal */
  function openSaveModal() {
    const inp=document.getElementById('sessionNameInput');
    if(inp&&State.getMeta().sessionName!=='Unsaved session') inp.value=State.getMeta().sessionName;
    document.getElementById('saveModal').classList.add('open');
    if(inp) inp.focus();
  }
  function closeSaveModal() {
    document.getElementById('saveModal').classList.remove('open');
    const panel=document.getElementById('sharePickerPanel');
    if(panel){ panel.style.display='none'; }
    const btn=document.getElementById('btnShareToggle');
    if(btn){ btn.style.background=''; }
    const ri=document.getElementById('shareRecipientInput');
    if(ri){ ri.value=''; }
  }
  function closeModalOnBackdrop(e) { if(e.target===document.getElementById('saveModal')) closeSaveModal(); }

  /* Session history */
  function renderSessionHistory(history) {
    const el=document.getElementById('sessionHistory'); if(!el) return;
    if(!history||!history.length){el.innerHTML='<div class="sb-empty">No saved versions yet</div>';return;}
    el.innerHTML=history.map((v,i)=>`
      <div class="session-item ${i===0?'current':''}" onclick="Session.loadVersion(${v.id})" role="listitem" tabindex="0"
        onkeydown="if(event.key==='Enter'||event.key===' ')Session.loadVersion(${v.id})">
        <div class="sess-name">${_esc(v.name)}</div>
        <div class="sess-meta">${new Date(v.savedAt).toLocaleString()}</div>
        ${v.note?`<div class="sess-meta" style="font-style:italic">${_esc(v.note)}</div>`:''}
        <div class="sess-tags">
          <span class="sess-tag">${v.alts} alts</span>
          <span class="sess-tag">${v.crits} crits</span>
          <span class="sess-tag">${v.mode}</span>
          <span class="sess-tag">Step ${v.step}</span>
        </div>
      </div>`).join('');
  }

  /* Toast */
  let _toastTimer=null;
  function toast(msg) {
    const el=document.getElementById('toast'); if(!el) return;
    el.textContent=msg; el.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer=setTimeout(()=>el.classList.remove('show'),3000);
  }

  return {
    goStep, openSaveModal, closeSaveModal, closeModalOnBackdrop,
    renderSessionHistory, toast,
    _addAlt, _removeAlt, _startEditAlt, _finishEditAlt, _cancelEditAlt,
    _addCrit, _removeCrit, _startEditCrit, _finishEditCrit,
    _toggleCritGroup, _showSubAdd, _hideSubAdd, _addSubCrit,
    _critListHTMLPublic,
    _refreshModeNote, _loadTpl,
    _updTierW, _equalTierW, _normTierW,
    _updCritW, _equalCritW, _normCritW, _proceedToScoring,
    _setScore, _fillRandom, _clearScores, _updateRimHints,
    _vizTab, _renderAdvViz, _toggleRadarAlt, _radarZoomBy, _radarZoomReset, _radarWheelZoom,
    _runSens, _liveSens, _resetSensWeights, _renderTornado, _updateSensBreakdown, _refine, _refineAdd, _refineAddConfirm, _refineRemove, _refineRemoveDirect, _refineRestore, _openModifySetModal,
    clearRemovedAlts: () => { _removedAlts = []; },
    _switchMode, _startNew, _validateAndScore,
    openRefineModal, closeRefineModal, _donutDrillHTML, _renderDonutChart,
    _enterMagnify, _exitMagnify,
  };
})();
