// templates.js - pre-built decision templates (scores on 0-10 scale)

const Templates = (() => {
  const _data = {

    /* ── 1. Supplier Selection (O'Brien & Brugha 2010 structure) ── */
    supplier:{
      label:'🏭 Supplier Selection',
      alts:['Alpha Ltd','Beta Corp','Gamma Inc','Delta GmbH'],
      crits:[
        {key:'q',   name:'Enhanced Quality',          tier:'somatic',   parentKey:null},
        {key:'q1',  name:'Unit Cost',                 tier:'somatic',   parentKey:'q'},
        {key:'q2',  name:'Quality Score',             tier:'somatic',   parentKey:'q'},
        {key:'q3',  name:'Lead Time',                 tier:'somatic',   parentKey:'q'},
        {key:'cx',  name:'Customer Experience',       tier:'psychic',   parentKey:null},
        {key:'cx1', name:'Relationship',              tier:'psychic',   parentKey:'cx'},
        {key:'cx2', name:'Flexibility',               tier:'psychic',   parentKey:'cx'},
        {key:'rev', name:'Revenue & Sustainability',  tier:'pneumatic', parentKey:null},
        {key:'rv1', name:'Sustainability',            tier:'pneumatic', parentKey:'rev'},
        {key:'rv2', name:'Ethics Score',              tier:'pneumatic', parentKey:'rev'},
      ],
      tierW:{somatic:0.40, psychic:0.30, pneumatic:0.30},
      critW:{'q':1.0,'q1':0.45,'q2':0.30,'q3':0.25,'cx':1.0,'cx1':0.55,'cx2':0.45,'rev':1.0,'rv1':0.55,'rv2':0.45},
      scoresUS:{
        0:[4.5,8.5,7.2,8.0,6.0,6.5, 7.5,6.5,6.5,7.0],
        1:[7.5,7.2,8.0,6.5,7.8,7.0, 5.0,7.2,7.8,7.0],
        2:[6.0,9.0,6.5,7.2,8.5,8.0, 8.5,9.0,8.5,8.0],
        3:[5.5,7.8,8.8,9.0,9.0,7.5, 6.0,7.0,7.0,7.5]
      }
    },

    /* ── 2. Project Prioritisation ── */
    project:{
      label:'📋 Project Prioritisation',
      alts:['Project Alpha','Project Beta','Project Gamma','Project Delta'],
      crits:[
        {key:'fin',  name:'Financial Returns',  tier:'somatic',   parentKey:null},
        {key:'f1',   name:'NPV (€M)',            tier:'somatic',   parentKey:'fin'},
        {key:'f2',   name:'Payback Period',      tier:'somatic',   parentKey:'fin'},
        {key:'f3',   name:'Resource Cost',       tier:'somatic',   parentKey:'fin'},
        {key:'str',  name:'Strategic Value',     tier:'psychic',   parentKey:null},
        {key:'s1',   name:'Strategic Fit',       tier:'psychic',   parentKey:'str'},
        {key:'s2',   name:'Team Capability',     tier:'psychic',   parentKey:'str'},
        {key:'esg',  name:'ESG & Impact',        tier:'pneumatic', parentKey:null},
        {key:'e1',   name:'ESG Score',           tier:'pneumatic', parentKey:'esg'},
        {key:'e2',   name:'Social Impact',       tier:'pneumatic', parentKey:'esg'},
      ],
      tierW:{somatic:0.35, psychic:0.35, pneumatic:0.30},
      critW:{'fin':1.0,'f1':0.40,'f2':0.30,'f3':0.30,'str':1.0,'s1':0.60,'s2':0.40,'esg':1.0,'e1':0.50,'e2':0.50},
      scoresUS:{
        0:[8.5,7.0,6.5, 8.0,7.5, 9.0,7.2],
        1:[7.0,8.0,7.5, 6.8,8.5, 6.5,8.0],
        2:[9.0,6.0,8.0, 7.5,7.0, 7.8,6.8],
        3:[6.0,9.0,8.5, 8.5,6.5, 8.5,9.0]
      }
    },

    /* ── 3. Facility Location (Kakeneno & Brugha 2017 structure) ── */
    location:{
      label:'📍 Facility Location',
      alts:['Dublin','Cork','Galway','Limerick'],
      crits:[
        {key:'feas', name:'Feasibility',        tier:'somatic',   parentKey:null},
        {key:'fe1',  name:'Land Cost',          tier:'somatic',   parentKey:'feas'},
        {key:'fe2',  name:'Infrastructure',     tier:'somatic',   parentKey:'feas'},
        {key:'fe3',  name:'Labour Pool',        tier:'somatic',   parentKey:'feas'},
        {key:'acc',  name:'Acceptability',      tier:'psychic',   parentKey:null},
        {key:'ac1',  name:'Community Support',  tier:'psychic',   parentKey:'acc'},
        {key:'ac2',  name:'Govt Support',       tier:'psychic',   parentKey:'acc'},
        {key:'del',  name:'Deliverables',       tier:'pneumatic', parentKey:null},
        {key:'de1',  name:'Env. Impact',        tier:'pneumatic', parentKey:'del'},
        {key:'de2',  name:'Growth Potential',   tier:'pneumatic', parentKey:'del'},
      ],
      tierW:{somatic:0.40, psychic:0.30, pneumatic:0.30},
      critW:{'feas':1.0,'fe1':0.35,'fe2':0.35,'fe3':0.30,'acc':1.0,'ac1':0.50,'ac2':0.50,'del':1.0,'de1':0.55,'de2':0.45},
      scoresUS:{
        0:[4.5,9.0,8.5, 7.0,6.0, 5.5,7.0],
        1:[7.0,7.2,6.5, 8.0,7.8, 7.5,6.5],
        2:[8.0,6.0,5.5, 8.5,8.2, 8.8,7.8],
        3:[6.5,6.8,7.0, 7.5,8.0, 7.2,8.5]
      }
    },

    /* ── 4. Internship Selection ── */
    internship:{
      label:'🎓 Internship Selection',
      alts:['Internship A','Internship B','Internship C'],
      crits:[
        {key:'dev',  name:'Career Development',      tier:'somatic',   parentKey:null},
        {key:'d1',   name:'Learning Opportunities',  tier:'somatic',   parentKey:'dev'},
        {key:'d2',   name:'Career Growth Potential', tier:'somatic',   parentKey:'dev'},
        {key:'d3',   name:'Compensation',            tier:'somatic',   parentKey:'dev'},
        {key:'org',  name:'Organisation Fit',        tier:'psychic',   parentKey:null},
        {key:'o1',   name:'Company Reputation',      tier:'psychic',   parentKey:'org'},
        {key:'o2',   name:'Work-Life Balance',       tier:'psychic',   parentKey:'org'},
        {key:'exp',  name:'Experience Quality',      tier:'pneumatic', parentKey:null},
        {key:'e1',   name:'Flexibility',             tier:'pneumatic', parentKey:'exp'},
        {key:'e2',   name:'Team Culture',            tier:'pneumatic', parentKey:'exp'},
      ],
      tierW:{somatic:0.50, psychic:0.30, pneumatic:0.20},
      critW:{'dev':1.0,'d1':0.40,'d2':0.35,'d3':0.25,'org':1.0,'o1':0.55,'o2':0.45,'exp':1.0,'e1':0.50,'e2':0.50},
      scoresUS:{
        0:[8.0,7.5,6.0, 7.0,8.0, 7.5,8.0],
        1:[6.5,8.5,8.5, 8.5,7.0, 6.0,7.0],
        2:[7.5,6.5,7.0, 6.5,8.5, 8.5,8.5]
      }
    },

    /* ── 5. Master's Programme Selection ── */
    masters:{
      label:"🎓 Master's Programme",
      alts:['Programme A','Programme B','Programme C'],
      crits:[
        {key:'acad', name:'Academic Quality',        tier:'somatic',   parentKey:null},
        {key:'a1',   name:'Course Quality',          tier:'somatic',   parentKey:'acad'},
        {key:'a2',   name:'University Reputation',   tier:'somatic',   parentKey:'acad'},
        {key:'a3',   name:'Employability',           tier:'somatic',   parentKey:'acad'},
        {key:'prac', name:'Practical Factors',       tier:'psychic',   parentKey:null},
        {key:'p1',   name:'Tuition Cost',            tier:'psychic',   parentKey:'prac'},
        {key:'p2',   name:'Location',                tier:'psychic',   parentKey:'prac'},
        {key:'enr',  name:'Enrichment',              tier:'pneumatic', parentKey:null},
        {key:'e1',   name:'Research Opportunities',  tier:'pneumatic', parentKey:'enr'},
        {key:'e2',   name:'Student Experience',      tier:'pneumatic', parentKey:'enr'},
      ],
      tierW:{somatic:0.50, psychic:0.30, pneumatic:0.20},
      critW:{'acad':1.0,'a1':0.40,'a2':0.35,'a3':0.25,'prac':1.0,'p1':0.50,'p2':0.50,'enr':1.0,'e1':0.55,'e2':0.45},
      scoresUS:{
        0:[9.0,8.0,8.5, 6.0,7.5, 8.5,7.5],
        1:[7.5,9.0,7.0, 8.5,8.0, 6.0,8.0],
        2:[8.0,7.5,9.0, 7.5,6.5, 7.5,9.0]
      }
    },

    /* ── 6. Student Housing Decision (Branigan & Brugha 2013) ── */
    housing:{
      label:'🏠 Student Housing',
      alts:['Housing A','Housing B','Housing C'],
      crits:[
        {key:'cost', name:'Cost & Access',        tier:'somatic',   parentKey:null},
        {key:'c1',   name:'Monthly Rent',         tier:'somatic',   parentKey:'cost'},
        {key:'c2',   name:'Distance to Campus',   tier:'somatic',   parentKey:'cost'},
        {key:'c3',   name:'Transport Access',     tier:'somatic',   parentKey:'cost'},
        {key:'qual', name:'Quality & Safety',     tier:'psychic',   parentKey:null},
        {key:'q1',   name:'Safety',               tier:'psychic',   parentKey:'qual'},
        {key:'q2',   name:'Room Quality',         tier:'psychic',   parentKey:'qual'},
        {key:'life', name:'Lifestyle',            tier:'pneumatic', parentKey:null},
        {key:'l1',   name:'Amenities',            tier:'pneumatic', parentKey:'life'},
        {key:'l2',   name:'Social Environment',   tier:'pneumatic', parentKey:'life'},
      ],
      tierW:{somatic:0.50, psychic:0.30, pneumatic:0.20},
      critW:{'cost':1.0,'c1':0.45,'c2':0.30,'c3':0.25,'qual':1.0,'q1':0.55,'q2':0.45,'life':1.0,'l1':0.50,'l2':0.50},
      scoresUS:{
        0:[8.5,6.0,7.0, 8.5,9.0, 7.0,6.5],
        1:[6.0,8.5,8.0, 7.0,7.5, 8.0,8.5],
        2:[7.5,7.5,6.5, 9.0,8.0, 8.5,9.0]
      }
    },

    /* ── 7. Software Vendor Selection ── */
    software:{
      label:'💻 Software Vendor',
      alts:['Vendor A','Vendor B','Vendor C'],
      crits:[
        {key:'func', name:'Functionality',         tier:'somatic',   parentKey:null},
        {key:'f1',   name:'Feature Completeness',  tier:'somatic',   parentKey:'func'},
        {key:'f2',   name:'Ease of Use',           tier:'somatic',   parentKey:'func'},
        {key:'f3',   name:'Cost',                  tier:'somatic',   parentKey:'func'},
        {key:'tech', name:'Technical Fit',         tier:'psychic',   parentKey:null},
        {key:'t1',   name:'Integration Capability',tier:'psychic',   parentKey:'tech'},
        {key:'t2',   name:'Security',              tier:'psychic',   parentKey:'tech'},
        {key:'supp', name:'Support & Growth',      tier:'pneumatic', parentKey:null},
        {key:'s1',   name:'Vendor Support',        tier:'pneumatic', parentKey:'supp'},
        {key:'s2',   name:'Scalability',           tier:'pneumatic', parentKey:'supp'},
      ],
      tierW:{somatic:0.50, psychic:0.30, pneumatic:0.20},
      critW:{'func':1.0,'f1':0.40,'f2':0.35,'f3':0.25,'tech':1.0,'t1':0.55,'t2':0.45,'supp':1.0,'s1':0.50,'s2':0.50},
      scoresUS:{
        0:[8.0,9.0,7.0, 8.5,8.0, 9.0,7.5],
        1:[9.0,7.5,8.5, 7.0,9.0, 7.5,8.5],
        2:[7.5,8.0,9.5, 9.0,7.5, 8.0,9.0]
      }
    },

    /* ── 8. Employee Recruitment ── */
    recruitment:{
      label:'👔 Employee Recruitment',
      alts:['Candidate A','Candidate B','Candidate C'],
      crits:[
        {key:'skill', name:'Skills & Experience',   tier:'somatic',   parentKey:null},
        {key:'sk1',   name:'Technical Skills',      tier:'somatic',   parentKey:'skill'},
        {key:'sk2',   name:'Experience',            tier:'somatic',   parentKey:'skill'},
        {key:'inter', name:'Interpersonal',         tier:'psychic',   parentKey:null},
        {key:'i1',    name:'Communication Skills',  tier:'psychic',   parentKey:'inter'},
        {key:'i2',    name:'Cultural Fit',          tier:'psychic',   parentKey:'inter'},
        {key:'pot',   name:'Potential',             tier:'pneumatic', parentKey:null},
        {key:'p1',    name:'Leadership Potential',  tier:'pneumatic', parentKey:'pot'},
        {key:'p2',    name:'Problem Solving',       tier:'pneumatic', parentKey:'pot'},
      ],
      tierW:{somatic:0.45, psychic:0.35, pneumatic:0.20},
      critW:{'skill':1.0,'sk1':0.55,'sk2':0.45,'inter':1.0,'i1':0.50,'i2':0.50,'pot':1.0,'p1':0.50,'p2':0.50},
      scoresUS:{
        0:[9.0,7.5, 8.0,7.0, 7.5,8.5],
        1:[7.0,9.0, 9.0,8.5, 8.5,7.0],
        2:[8.0,8.0, 7.5,9.0, 9.0,9.0]
      }
    }
  };

  const getAll = () => Object.entries(_data).map(([key,v])=>({key,label:v.label}));

  function load(key) {
    const t=_data[key]; if(!t) return false;
    State.loadTemplate(t);
    return true;
  }

  return { getAll, load };
})();
