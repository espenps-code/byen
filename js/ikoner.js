/* =========================================================
   PIKSELIKONER – egentegnet grafikk (ikke fra Minecraft)
   Ikon.vare(vare) gir en <svg> for en vare i katalogen.
   Vil du bruke egne bilder: legg en 'bilde'-URL på varen i katalogen.
   ========================================================= */
const Ikon = (() => {
  /* ---- 8×8-mønstre for klosser ---- */
  const tre = (a, b, c, e) => ({ pal: { a, b, c, e }, rows: ['aaeaaaab', 'abaaaaaa', 'aaaaabaa', 'cccccccc', 'aabaaaea', 'eaaaaaaa', 'aaaaaaba', 'cccccccc'] });
  const flekk = (a, b, c) => ({ pal: { a, b, c }, rows: ['aaaaaaaa', 'aabaaaca', 'aaaaaaaa', 'acaaabaa', 'aaaaaaaa', 'abaaaaaa', 'aaaacaab', 'aaaaaaaa'] });
  const TILES = {
    birch_planks: tre('#e6d8a8', '#d4c28a', '#b8a36a', '#efe4bd'),
    dark_oak_planks: tre('#5a3c22', '#4a3019', '#33200f', '#6a4a2c'),
    cherry_planks: tre('#e7b3ad', '#d69c96', '#b97a74', '#f1cbc6'),
    oak_planks: tre('#b8925a', '#a47e48', '#836034', '#c8a46c'),
    spruce_planks: tre('#7a5634', '#6a4828', '#4e341b', '#8a6640'),
    white_concrete: flekk('#eceeee', '#dfe3e3', '#f6f7f7'),
    gray_concrete: flekk('#4d5157', '#45494e', '#575b61'),
    stone_bricks: { pal: { a: '#8f8f8f', b: '#7a7a7a', c: '#5f5f5f', e: '#a3a3a3' }, rows: ['aaaeaaac', 'abaaabac', 'cccccccc', 'aacaaaae', 'baceaaba', 'cccccccc', 'aaaeaaac', 'abaaabac'] },
    gravel: { pal: { a: '#8a8580', b: '#6f6a66', c: '#a39e98', e: '#5c5854' }, rows: ['abacaeab', 'caabacaa', 'aeacabca', 'bacaaeab', 'acabcaaa', 'eaacabae', 'abcaeaca', 'caabaacb'] },
    scaffolding: { pal: { a: '#d9b56a', b: '#b8924a', c: 'none' }, rows: ['aaaaaaaa', 'abccccba', 'acbccbca', 'accbbcca', 'accbbcca', 'acbccbca', 'abccccba', 'aaaaaaaa'] },
    glass: { pal: { a: '#cfe9f3', b: '#ffffff', c: '#e8f6fb' }, rows: ['aaaaaaaa', 'abcccccca'.slice(0, 8), 'acbcccca', 'accbccca', 'acccccca', 'acccccca', 'acccccca', 'aaaaaaaa'] },
    bookshelf: { pal: { a: '#9c7442', b: '#c0392b', c: '#2e6fb0', d: '#3f8a2c', e: '#e0c25a', f: '#6b4a2b' }, rows: ['aaaaaaaa', 'fbcdebcf', 'fbcdebcf', 'aaaaaaaa', 'fcdbecdf', 'fcdbecdf', 'aaaaaaaa', 'aaaaaaaa'] },
    grass_top: flekk('#6ab04c', '#5a9a3e', '#7cc35c'),
    grass_side: { pal: { a: '#8a5a34', b: '#6ab04c', c: '#74492a', d: '#5a9a3e' }, rows: ['bbdbbdbb', 'bdbbbbdb', 'abaabaab', 'aacaaaca', 'caaaacaa', 'aacaaaaa', 'acaacaac', 'aaaaaaaa'] },
    smooth_stone: flekk('#b0b0b0', '#a2a2a2', '#bdbdbd')
  };

  function kube(top, side, hoyde = 8) {
    const t = TILES[top], s = TILES[side || top];
    const flate = (tile, m, skygge, h) => {
      let r = `<g transform="matrix(${m})">`;
      tile.rows.slice(8 - h).forEach((rad, y) => [...rad].forEach((ch, x) => {
        const f = tile.pal[ch];
        if (f && f !== 'none') r += `<rect x="${x}" y="${y}" width="1.03" height="1.03" fill="${f}"/>`;
      }));
      if (skygge) r += `<rect width="8" height="${h}" fill="#000" opacity="${skygge}"/>`;
      return r + '</g>';
    };
    const dy = (8 - hoyde) * 4;
    return `<svg viewBox="0 0 64 70" shape-rendering="crispEdges" aria-hidden="true">`
      + flate(t, `4,2,-4,2,32,${4 + dy}`, 0, 8)
      + flate(s, `4,2,0,4,0,${20 + dy}`, 0.12, hoyde)
      + flate(s, `4,-2,0,4,32,${36 + dy}`, 0.25, hoyde)
      + `</svg>`;
  }

  /* ---- 16×16-figurer. Bokstaver = farger i paletten, '.' = gjennomsiktig ---- */
  const S = {
    dor: ['...dddddddddd', '...dwwwwwwwwd', '...dwggwwggwd', '...dwggwwggwd', '...dwwwwwwwwd', '...dwwwwwwwwd', '...dwddwwddwd', '...dwddwwddwd', '...dwwwwwwkwd', '...dwwwwwwwwd', '...dwddwwddwd', '...dwddwwddwd', '...dwwwwwwwwd', '...dwwwwwwwwd', '...dddddddddd'],
    trapp: ['', '', '........bbbbbbbb', '........aaaaaaaa', '........aaaaaaaa', '........aaaaaaaa', '........aaaaaaaa', '........cccccccc', 'bbbbbbbbaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaa', 'cccccccccccccccc'],
    gjerde: ['', '', '..aa........aa', '..ab........ab', '..ab........ab', '..aaaaaaaaaaaa', '..abbbbbbbbbab', '..ab........ab', '..ab........ab', '..aaaaaaaaaaaa', '..abbbbbbbbbab', '..ab........ab', '..ab........ab', '..ab........ab', '..cc........cc'],
    grind: ['', '', '.aa..........aa', '.ab..........ab', '.abaaaaaaaaaaab', '.abbbbbbabbbbbb', '.ab....ab....ab', '.ab....ab....ab', '.abaaaaaaaaaaab', '.abbbbbbabbbbbb', '.ab..........ab', '.ab..........ab', '.cc..........cc'],
    luke: ['', '', '', '', '.aaaaaaaaaaaaaa', '.abbbbbbbbbbbba', '.ab..bb..bb..ba', '.abbbbbbbbbbbba', '.ab..bb..bb..ba', '.abbbbbbbbbbbba', '.ab..bb..bb..ba', '.abbbbbbbbbbbba', '.aaaaaaaaaaaaaa'],
    rute: ['', '..aaaaaaaaaaaa', '..abccccccccca', '..acbcccccccca', '..accbccccccca', '..acccbcccccca', '..acccccccccca', '..acccccccccca', '..acccccccbcca', '..accccccccbca', '..acccccccccba', '..acccccccccca', '..acccccccccca', '..aaaaaaaaaaaa'],
    stige: ['', '...a........a', '...aaaaaaaaaa', '...a........a', '...a........a', '...aaaaaaaaaa', '...a........a', '...a........a', '...aaaaaaaaaa', '...a........a', '...a........a', '...aaaaaaaaaa', '...a........a', '...a........a'],
    skilt: ['', '', '.bbbbbbbbbbbbbb', '.baaaaaaaaaaaab', '.bacccccccccab', '.baaaaaaaaaaaab', '.baccccccccaaab', '.baaaaaaaaaaaab', '.bbbbbbbbbbbbbb', '.......bb', '.......bb', '.......bb', '.......bb', '.......cc'],
    fakkel: ['', '', '.......y', '......yoy', '......yoy', '.......o', '.......a', '.......a', '.......a', '.......a', '.......a', '.......a', '.......a', '.......b'],
    lys: ['', '', '.......y', '......yoy', '......yoy', '.......k', '......hRRr', '......hRRr', '......RRRr', '......RRRr', '......RRRr', '......RRRr', '......RRRr', '......RRRr'],
    endestav: ['', '', '......gggg', '......gwsg', '......gwsg', '.......ws', '.......ws', '.......ws', '.......ws', '.......ws', '.......ws', '.......ws', '......bbbb', '......bbbb'],
    lykt: ['', '.......dd', '......d..d', '.......dd', '.....dddddd', '....dDDDDDDd', '....dyyooyyd', '....dyooooyd', '....dyooooyd', '....dyyooyyd', '....dDDDDDDd', '.....dddddd'],
    seng: ['', '', '', '', '', '', '..ppp', '..pppRRRRRRRRRR', '.wwwwRRRRRRRRRR', '.wwwwrrrrrrrrrr', '.bbbbbbbbbbbbbb', '.b............b', '.b............b'],
    kiste: ['', '', '', '.dddddddddddddd', '.daaaaaaaaaaaad', '.daaaaaaaaaaaad', '.dccccccccccccd', '.dddddddkkddddd', '.daaaaaakkaaaad', '.daaaaaaaaaaaad', '.daaaaaaaaaaaad', '.daaaaaaaaaaaad', '.dddddddddddddd'],
    tonne: ['', '', '...dddddddddd', '..daaaaaaaaaad', '..daaaaaaaaaad', '..kkkkkkkkkkkk', '..daaaaaaaaaad', '..daaaaaaaaaad', '..daaaaaaaaaad', '..kkkkkkkkkkkk', '..daaaaaaaaaad', '..daaaaaaaaaad', '...dddddddddd'],
    ovn: ['', '', '.dddddddddddddd', '.daaaaaaaaaaaad', '.daaaaaaaaaaaad', '.daakkkkkkkkaad', '.daakkkkkkkkaad', '.daakooyyookaad', '.daakoyyyyokaad', '.daaaaaaaaaaaad', '.daaaaaaaaaaaad', '.dddddddddddddd'],
    leirbaal: ['', '', '', '.......y', '......yoy', '.....yoooy', '.....oyyyo', '......ooo', '...aab..baa', '..aaabbbbaaa', '.bbaaa..aaabb', '.bb........bb'],
    teppe: ['', '', '', '', '', '', '', '', '', '', '.bbbbbbbbbbbbbb', '.baaaaaaaaaaaab', '.baaaaaaaaaaaab', '.bbbbbbbbbbbbbb'],
    potte: ['', '', '', '', '', '', '....dddddddd', '....daaaaaad', '....kkkkkkkk', '.....aaaaaa', '.....aaaaaa', '.....aaaaaa', '......aaaa'],
    ramme: ['', '..dddddddddddd', '..daaaaaaaaaad', '..dacccccccccad'.slice(0, 15), '..daccccccccad', '..daccccccccad', '..daccccccccad', '..daccccccccad', '..daccccccccad', '..daccccccccad', '..daaaaaaaaaad', '..dddddddddddd'],
    maleri: ['', '.dddddddddddddd', '.daaaaaaaaaaaad', '.dasssssssyssad', '.dassssssyyysad', '.dassssssssssad', '.dassgggssssad', '.dasggggggsssad', '.daggggggggggad', '.daggggggggggad', '.daaaaaaaaaaaad', '.dddddddddddddd'],
    kjott: ['', '', '', '', '.......aaa', '.....aaaaaaa', '....aaabaaaaa', '....aaaaaaabaa', '.....aaaaaaaaa', '......aaaaaaa', '.....kk.aaaa', '....kk', '...kk'],
    fisk: ['', '', '', '', '', '...........b', '..aaaaaaaa.bb', '.aakaaaaaaabbb', '.aaaaaaaaaabbb', '..cccccccc.bb', '...........b'],
    brod: ['', '', '', '', '', '....bbbbbbb', '..bbBBBBBBBbb', '.bBBkBBkBBkBBb', '.bBBBBBBBBBBBb', '.bBBBBBBBBBBBb', '..bbbbbbbbbbb'],
    eple: ['', '', '.......g', '......gl', '....aaaaaaa', '...aaakaaaaa', '...aakaaaaaa', '...aaaaaaaaa', '...aaaaaaaab', '...aaaaaaabb', '....aaaaabb', '.....aaaab'],
    gulrot: ['', '', '..........g.g', '...........gl', '..........gl', '.........aa', '........aaa', '.......aaa', '......aab', '.....aaa', '....aab', '...aa', '..a'],
    kake: ['', '', '', '', '', '...r.....r', '..wwwwwwwwwwww', '..wwwrwwwwrwww', '..kkkkkkkkkkkk', '..aaaaaaaaaaaa', '..aaaaaaaaaaaa', '..aaaaaaaaaaaa', '..bbbbbbbbbbbb'],
    botte: ['', '', '', '', '..dddddddddddd', '..dccccccccccd', '...daaaaaaaad', '...daaaaaaaad', '....daaaaaad', '....daaaaaad', '.....daaaad', '.....dddddd'],
    oks: ['', '', '', '........dd', '.......daad', '......dkaaad', '.......kaad', '......k.dd', '.....k', '....k', '...k', '..k', '.k'],
    hakke: ['', '', '', '.....ddddd', '...dda...add', '..dd...k...dd', '.d....k.....d', '.....k', '....k', '...k', '..k', '.k'],
    spade: ['', '', '', '..........dd', '.........daad', '........daaad', '.........daad', '........k.dd', '.......k', '......k', '.....k', '....k', '...k'],
    krafse: ['', '', '', '.......ddddd', '......ddaaad', '.......k...d', '......k', '.....k', '....k', '...k', '..k', '.k'],
    stang: ['', '', '.............k', '............k.c', '...........k..c', '..........k...c', '.........k....c', '........k.....c', '.......k......c', '......k.......d', '.....k', '....k', '...k'],
    blomst: ['', '', '......R.R.R', '......RRRRR', '......RRRRR', '.......RrR', '........g', '........g', '......l.g', '.....llgg', '......lggl', '........gll', '........g', '........g'],
    prestekrage: ['', '', '.......w', '.....w.w.w', '......www', '....wwyyyww', '......www', '.....w.w.w', '.......g', '.......g', '.....llg', '.......gll', '.......g', '.......g'],
    solsikke: ['', '.....y.y.y', '....yyyyyyy', '...yykkkkyy', '...yykbbkyy', '...yykbbkyy', '...yykkkkyy', '....yyyyyyy', '.....y.y.y', '........g', '......llg', '........gll', '........g', '........g'],
    busk: ['', '', '....R..R.R', '...RRRRRRRR', '..RRrRRRrRRR', '..RRRRRRRRRR', '...RRrRRRRR', '....lgglgl', '...llgglggl', '.....ggg', '......g', '......g', '......g'],
    ungtre: ['', '', '......ll', '....llllll', '...lllgllll', '...llgllgll', '....llllll', '.....llll', '.......b', '.......b', '......lb', '.......bl', '.......b', '.......b'],
    beinmel: ['', '', '', '', '', '', '', '.......a', '......aaa', '.....aabaa', '....aaaaaba', '...aabaaaaaa', '..aaaaaabaaaa'],
    smaragd: ['', '', '.....aaaaa', '....abbbbba', '...abccbbbba', '...abcbbbbba', '...abbbbbbba', '....abbbbba', '.....abbba', '......aba', '.......a'],
    helle: ['', '', '', '', '', '', '', '', '.aaaaaaaaaaaaaa', '.bbbbbbbbbbbbbb', '.bbbbbbbbbbbbbb', '.bbbbbbbbbbbbbb', '.cccccccccccccc']
  };

  function figur(navn, pal) {
    let r = '';
    S[navn].forEach((rad, y) => [...String(rad).padEnd(16, '.')].slice(0, 16).forEach((ch, x) => {
      if (ch !== '.' && pal[ch]) r += `<rect x="${x}" y="${y + 1}" width="1.03" height="1.03" fill="${pal[ch]}"/>`;
    }));
    return `<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
  }

  const TREFARGER = {
    oak: ['#b8925a', '#836034'], dark_oak: ['#5a3c22', '#33200f'], birch: ['#e6d8a8', '#b8a36a'],
    spruce: ['#7a5634', '#4e341b'], cherry: ['#e7b3ad', '#b97a74'], normal_stone: ['#a8a8a8', '#767676'], stone: ['#a0a0a0', '#6f6f6f'],
    stone_brick: ['#8f8f8f', '#5f5f5f'], deepslate_tile: ['#4a4a52', '#2c2c32']
  };
  const FARGER = {
    white: ['#f2f2f2', '#c9c9c9'], red: ['#d23b3b', '#a82828'], blue: ['#2f5fbf', '#21458e'],
    green: ['#5a9a2e', '#3f6e1f'], yellow: ['#f2c230', '#c39418'], pink: ['#f08cb3', '#c9688c'],
    gray: ['#5b5f66', '#3d4045'], light_gray: ['#a6a8ab', '#7d7f82']
  };
  const SENGFARGE = { 0: 'white', 14: 'red', 13: 'green', 11: 'blue' };

  function forMc(mc, data) {
    // Klosser
    if (TILES[mc]) return kube(mc);
    if (mc === 'grass_block') return kube('grass_top', 'grass_side');
    if (mc === 'smooth_stone_slab') return kube('smooth_stone', 'smooth_stone', 4);
    // Treverk
    const tre = Object.keys(TREFARGER).sort((x, y) => y.length - x.length).find(t => mc.startsWith(t + '_'));
    const [a, c] = TREFARGER[tre || 'oak'];
    if (mc.endsWith('_stairs')) return figur('trapp', { a, b: a, c });
    if (mc.endsWith('_fence_gate') || mc === 'fence_gate') return figur('grind', { a, b: c, c });
    if (mc.endsWith('_fence')) return figur('gjerde', { a, b: c, c });
    if (mc.endsWith('_door')) return figur('dor', { d: c, w: a, g: '#bfe3f2', k: '#2b2b2b' });
    if (mc === 'wooden_door') return figur('dor', { d: '#6b4a2b', w: '#b08452', g: '#bfe3f2', k: '#3b2a18' });
    if (mc === 'trapdoor') return figur('luke', { a: '#6b4a2b', b: '#b08452' });
    // Farget
    const farge = Object.keys(FARGER).sort((x, y) => y.length - x.length).find(f => mc.startsWith(f + '_'));
    if (mc.endsWith('_candle')) { const [R, r] = FARGER[farge]; return figur('lys', { y: '#ffd23f', o: '#ff8a1f', k: '#3a3a3a', R, r, h: '#ffffff55' }); }
    if (mc.endsWith('_carpet')) { const [aa, b] = FARGER[farge]; return figur('teppe', { a: aa, b }); }
    if (mc === 'bed') { const [R, r] = FARGER[SENGFARGE[data] || 'red']; return figur('seng', { p: '#f4f4f4', R, r, w: '#e8e8e8', b: '#8a5a2e' }); }
    const fast = {
      glass_pane: ['rute', { a: '#9cc9d9', b: '#ffffff', c: '#dff2f9' }],
      ladder: ['stige', { a: '#9c7442' }],
      oak_sign: ['skilt', { a: '#c8a46c', b: '#836034', c: '#5a3c22' }],
      torch: ['fakkel', { y: '#ffd23f', o: '#ff8a1f', a: '#7a5634', b: '#4e341b' }],
      end_rod: ['endestav', { w: '#fbf8f0', s: '#b9b2a2', g: '#ffd95e', b: '#7e6f96' }],
      lantern: ['lykt', { d: '#3d4148', D: '#6b717b', y: '#ffd23f', o: '#ff9a2e' }],
      chest: ['kiste', { d: '#5a3c22', a: '#b8925a', c: '#836034', k: '#c9c9c9' }],
      barrel: ['tonne', { d: '#5a3c22', a: '#9c7442', k: '#4d5157' }],
      furnace: ['ovn', { d: '#555', a: '#8f8f8f', k: '#2b2b2b', o: '#ff8a1f', y: '#ffd23f' }],
      campfire: ['leirbaal', { y: '#ffd23f', o: '#ff8a1f', a: '#7a5634', b: '#4e341b' }],
      flower_pot: ['potte', { d: '#8a4a2e', a: '#b5653e', k: '#6e3a22' }],
      frame: ['ramme', { d: '#6b4a2b', a: '#9c7442', c: '#efe4bd' }],
      painting: ['maleri', { d: '#6b4a2b', a: '#9c7442', s: '#8fd0f0', y: '#ffd23f', g: '#5a9a2e' }],
      coal: ['beinmel', { a: '#2b2b2b', b: '#555' }],
      chicken: ['kjott', { a: '#f2c0b0', b: '#e8a090', k: '#efe4bd' }],
      porkchop: ['kjott', { a: '#f08c8c', b: '#ffd0d0', k: '#efe4bd' }],
      beef: ['kjott', { a: '#c83b3b', b: '#f0a0a0', k: '#efe4bd' }],
      mutton: ['kjott', { a: '#d65a5a', b: '#f4c0c0', k: '#efe4bd' }],
      rabbit: ['kjott', { a: '#e8a8a0', b: '#f4d0c8', k: '#efe4bd' }],
      cod: ['fisk', { a: '#c8b48a', b: '#a8946a', c: '#e8dcc0', k: '#2b2b2b' }],
      salmon: ['fisk', { a: '#d65a4a', b: '#a8443a', c: '#f0a090', k: '#2b2b2b' }],
      bread: ['brod', { B: '#c98a3d', b: '#8a5a24', k: '#e7b66a' }],
      apple: ['eple', { a: '#d8323b', b: '#9e1f27', k: '#ff8a8a', g: '#6b4a2b', l: '#5fb043' }],
      carrot: ['gulrot', { a: '#f08a24', b: '#c86a14', g: '#3f8a2c', l: '#5fb043' }],
      cake: ['kake', { w: '#f8f4ec', r: '#d8323b', k: '#e8dcc0', a: '#c98a3d', b: '#8a5a24' }],
      water_bucket: ['botte', { d: '#6f6f6f', a: '#c9c9c9', c: '#3d7bd8' }],
      iron_axe: ['oks', { d: '#7d7f82', a: '#d8d8d8', k: '#7a5634' }],
      iron_pickaxe: ['hakke', { d: '#7d7f82', a: '#d8d8d8', k: '#7a5634' }],
      iron_shovel: ['spade', { d: '#7d7f82', a: '#d8d8d8', k: '#7a5634' }],
      iron_hoe: ['krafse', { d: '#7d7f82', a: '#d8d8d8', k: '#7a5634' }],
      fishing_rod: ['stang', { k: '#7a5634', c: '#dddddd', d: '#9a9a9a' }],
      poppy: ['blomst', { R: '#d8323b', r: '#2b2b2b', g: '#3f8a2c', l: '#5fb043' }],
      blue_orchid: ['blomst', { R: '#3aa8e0', r: '#1e78b0', g: '#3f8a2c', l: '#5fb043' }],
      allium: ['blomst', { R: '#b46ad8', r: '#8a44b0', g: '#3f8a2c', l: '#5fb043' }],
      red_tulip: ['blomst', { R: '#d8323b', r: '#9e1f27', g: '#3f8a2c', l: '#5fb043' }],
      pink_tulip: ['blomst', { R: '#f0a0c0', r: '#c9688c', g: '#3f8a2c', l: '#5fb043' }],
      oxeye_daisy: ['prestekrage', { w: '#ffffff', y: '#f2c230', g: '#3f8a2c', l: '#5fb043' }],
      sunflower: ['solsikke', { y: '#f2c230', k: '#8a5a24', b: '#5a3c22', g: '#3f8a2c', l: '#5fb043' }],
      lilac: ['busk', { R: '#c890e0', r: '#a068c0', g: '#3f8a2c', l: '#5fb043' }],
      rose_bush: ['busk', { R: '#d8323b', r: '#9e1f27', g: '#3f8a2c', l: '#5fb043' }],
      peony: ['busk', { R: '#f0b0d0', r: '#d088b0', g: '#3f8a2c', l: '#5fb043' }],
      oak_sapling: ['ungtre', { l: '#4f9a2e', g: '#3a7a20', b: '#7a5634' }],
      spruce_sapling: ['ungtre', { l: '#2f5e3a', g: '#234a2c', b: '#5a3c22' }],
      birch_sapling: ['ungtre', { l: '#8ac85a', g: '#6aa83e', b: '#e6d8a8' }],
      bone_meal: ['beinmel', { a: '#f4f4f0', b: '#d8d8d0' }],
      emerald: ['smaragd', { a: '#1e8a4a', b: '#3ccf74', c: '#b8f5cf' }]
    };
    if (fast[mc]) return figur(fast[mc][0], fast[mc][1]);
    return figur('kiste', { d: '#5a3c22', a: '#b8925a', c: '#836034', k: '#c9c9c9' });
  }

  return {
    vare(v) {
      if (v && v.bilde) return `<img src="${String(v.bilde).replace(/"/g, '')}" alt="" loading="lazy">`;
      return forMc(v.mc, v.data);
    },
    mc: forMc,
    smaragd: () => forMc('emerald')
  };
})();
