// compute.js
// This file handles all the maths for DISC-MCDM scoring
// Written for UCD MSc Business Analytics capstone project, Group 4

const Compute = (() => {

  // Figure out the normalised weight for a tier
  // (only considers tiers that actually have leaf criteria)
  function normTierW(t) {
    const tw = State.getTierW();
    const usedTiers = State.TIERS.filter(tt => State.getLeaves().some(c => c.tier === tt));
    const total = usedTiers.reduce((sum, tt) => sum + (tw[tt] || 0), 0) || 1;
    return (tw[t] || 0) / total;
  }

  // Normalised weight of a criterion within its sibling group
  function normCritW(crit) {
    const siblings = State.getSiblings(crit.id);
    const critW = State.getCritW();
    const total = siblings.reduce((sum, c) => sum + (critW[c.id] || 0), 0) || 1;
    return (critW[crit.id] || 0) / total;
  }

  // Global weight = tier weight * all ancestor local weights * own local weight
  // This is what actually determines how much a criterion affects the final score
  function globalW(crit) {
    let w = normCritW(crit);
    let current = crit;

    // Walk up the parent chain multiplying weights
    while (current.parentId) {
      const parent = State.getCrits().find(c => c.id === current.parentId);
      if (!parent) break;
      w *= normCritW(parent);
      current = parent;
    }

    return normTierW(crit.tier) * w;
  }

  // DISCUS scoring - simple weighted sum
  // Each alternative is scored independently, no interaction between alts
  function computeDISCUS() {
    const leaves = State.getLeaves();
    const alts = State.getAlts();
    const scores = State.getScoresUS();

    return alts.map((alt, altIndex) => {
      return State.TIERS.reduce((totalScore, tier) => {
        const tierLeaves = leaves.filter(c => c.tier === tier);
        if (!tierLeaves.length) return totalScore;

        // Add up weighted scores for all criteria in this tier
        const tierScore = tierLeaves.reduce((tierSum, crit) => {
          // Need the local weight within the tier hierarchy
          let localW = normCritW(crit);
          let cur = crit;
          while (cur.parentId) {
            const parent = State.getCrits().find(p => p.id === cur.parentId);
            if (!parent) break;
            localW *= normCritW(parent);
            cur = parent;
          }
          const rawScore = (scores[altIndex] && scores[altIndex][crit.id] != null)
            ? +scores[altIndex][crit.id] : 0;
          return tierSum + localW * rawScore;
        }, 0);

        return totalScore + normTierW(tier) * tierScore;
      }, 0);
    });
  }

  // DISCRIM scoring - geometric mean / power function
  // Allocations across alternatives for each criterion must sum to basis
  function computeDISCRIM() {
    const leaves = State.getLeaves();
    const alts = State.getAlts();
    const basis = State.getBasis();
    const scores = State.getScoresRIM();

    return alts.map((alt, altIndex) => {
      // First compute a tier-level score for each tier
      const tierScores = {};

      State.TIERS.forEach(tier => {
        const tierLeaves = leaves.filter(c => c.tier === tier);
        if (!tierLeaves.length) return;

        let product = 1;
        tierLeaves.forEach(crit => {
          // Local weight within tier
          let localW = normCritW(crit);
          let cur = crit;
          while (cur.parentId) {
            const p = State.getCrits().find(cc => cc.id === cur.parentId);
            if (!p) break;
            localW *= normCritW(p);
            cur = p;
          }
          const rawScore = (scores[altIndex] && scores[altIndex][crit.id] != null)
            ? +scores[altIndex][crit.id] : 0;
          // Use a small epsilon for zero scores to avoid log(0)
          const ratio = rawScore > 0 ? rawScore / basis : 0.001;
          product *= Math.pow(ratio, localW);
        });

        tierScores[tier] = product * basis;
      });

      // Now combine tier scores with tier weights (also a power function)
      let finalProduct = 1;
      State.TIERS.forEach(tier => {
        if (tierScores[tier] == null) return;
        const ratio = tierScores[tier] > 0 ? tierScores[tier] / basis : 0.001;
        finalProduct *= Math.pow(ratio, normTierW(tier));
      });

      return finalProduct * basis;
    });
  }

  // Pick the right scoring function based on current mode
  function computeScores() {
    return State.getMode() === 'US' ? computeDISCUS() : computeDISCRIM();
  }

  // Return alternatives sorted by score, best first
  function ranked() {
    const scores = computeScores();
    const alts = State.getAlts();
    return alts
      .map((name, i) => ({ name, score: scores[i], idx: i }))
      .sort((a, b) => b.score - a.score);
  }

  // Generate breakdown data for the results page
  // Shows how each criterion contributes to each alternative's score
  function breakdown() {
    const leaves = State.getLeaves();
    const alts = State.getAlts();
    const mode = State.getMode();
    const usScores = State.getScoresUS();
    const rimScores = State.getScoresRIM();
    const basis = State.getBasis();

    if (mode === 'US') {
      // DISCUS: contribution = global weight * raw score
      return alts.map((altName, altIndex) => ({
        name: altName,
        contributions: leaves.map(crit => {
          const gw = globalW(crit);
          const raw = (usScores[altIndex] && usScores[altIndex][crit.id] != null)
            ? +usScores[altIndex][crit.id] : 0;
          return { crit: crit.name, tier: crit.tier, raw, globalW: gw, weighted: gw * raw };
        })
      }));
    } else {
      // DISCRIM: proportional share approach
      // Since it's a power function not additive, we allocate the final score
      // proportionally to show a breakdown that still sums correctly
      const finalScores = computeDISCRIM();

      return alts.map((altName, altIndex) => {
        const finalScore = finalScores[altIndex];

        // Calculate tier scores (same as in computeDISCRIM)
        const tierScores = {};
        State.TIERS.forEach(tier => {
          const tierLeaves = leaves.filter(c => c.tier === tier);
          if (!tierLeaves.length) return;
          let p = 1;
          tierLeaves.forEach(crit => {
            let localW = normCritW(crit);
            let cur = crit;
            while (cur.parentId) {
              const pp = State.getCrits().find(cc => cc.id === cur.parentId);
              if (!pp) break;
              localW *= normCritW(pp);
              cur = pp;
            }
            const v = (rimScores[altIndex] && rimScores[altIndex][crit.id] != null)
              ? +rimScores[altIndex][crit.id] : 0;
            p *= Math.pow(v > 0 ? v / basis : 0.001, localW);
          });
          tierScores[tier] = p * basis;
        });

        // Build contributions list
        const contributions = leaves.map(crit => {
          const raw = (rimScores[altIndex] && rimScores[altIndex][crit.id] != null)
            ? +rimScores[altIndex][crit.id] : 0;
          const gw = globalW(crit);

          let localW = normCritW(crit);
          let cur = crit;
          while (cur.parentId) {
            const pp = State.getCrits().find(cc => cc.id === cur.parentId);
            if (!pp) break;
            localW *= normCritW(pp);
            cur = pp;
          }

          const nTW = normTierW(crit.tier);
          const tierLeaves = leaves.filter(cc => cc.tier === crit.tier);
          const tierLocalWSum = tierLeaves.reduce((s, cc) => {
            let lw = normCritW(cc);
            let cu = cc;
            while (cu.parentId) {
              const pp = State.getCrits().find(ccc => ccc.id === cu.parentId);
              if (!pp) break;
              lw *= normCritW(pp);
              cu = pp;
            }
            return s + lw;
          }, 0) || 1;

          const weighted = (localW / tierLocalWSum) * nTW * finalScore;
          return { crit: crit.name, tier: crit.tier, raw, globalW: gw, weighted };
        });

        // Force the contributions to sum exactly to the final score
        const contribTotal = contributions.reduce((s, c) => s + c.weighted, 0) || 1;
        contributions.forEach(c => {
          c.weighted = (c.weighted / contribTotal) * finalScore;
        });

        return { name: altName, contributions };
      });
    }
  }

  // Row sum for DISCRIM validation (checks if a criterion row sums to basis)
  function rimRowSum(leafIds, altIndex) {
    const rim = State.getScoresRIM();
    return leafIds.reduce((sum, id) => {
      return sum + ((rim[altIndex] && rim[altIndex][id] != null) ? +rim[altIndex][id] : 0);
    }, 0);
  }

  // Check if top two alternatives are very close (within 5% of basis)
  // Used to trigger the Magnifying Glass suggestion
  function isClose(rankedAlts) {
    if (rankedAlts.length < 2) return false;
    return Math.abs(rankedAlts[0].score - rankedAlts[1].score) < State.getBasis() * 0.05;
  }

  return { normTierW, normCritW, globalW, computeScores, ranked, breakdown, rimRowSum, isClose };
})();
