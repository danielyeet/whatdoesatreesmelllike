// ============================================================
// THE NOTES — one entry per fragrance
//
// What `notes.js` reads. Nothing here is written in a page's markup:
// there are ninety-odd fragrances on this site and the markup is the
// owner's to edit, so the notes live in one file that can be filled in
// over several rounds without touching a single page.
//
// A KEY is the page's own `window.HOUSE_NOTES` and the part's number,
// joined by a colon — "pineward:01", "individual:05". The number is
// the one in the markup, so renumbering a house means renumbering here
// in the same turn.
//
// AN ENTRY IS ONE OF TWO SHAPES, and which one is not a choice:
//
//   A PYRAMID   { top: [...], mid: [...], base: [...] }
//               only when the source actually divides them.
//
//   A FLAT LIST { flat: [...] }
//               when the source gives one undivided list, which is
//               commoner than you would think — Pineward, Serge Lutens
//               and Dior all do it. The owner allowed for this in as
//               many words: "unless the source states that there is no
//               division between top mid and base".
//
// Both carry `source: { name, url }`, and may carry a `note` for
// anything that needs saying about the entry itself.
//
// THE ONE RULE HERE: never write a pyramid a source did not state.
// A review's prose is not a pyramid. This matters because it has
// already nearly gone wrong: a search for Haxan's notes came back with
// a confident Top / Heart / Base that had been assembled out of
// reviewers' impressions on Basenotes, while the actual source gives
// forty notes and no division at all. If the only thing to be found is
// somebody's account of how it smells, the entry stays missing —
// `notes.js` says so on the page, which is the honest answer.
//
// A FRAGRANCE WITH NO ENTRY is not an error. It gets the button and a
// panel saying the notes have not been found yet, and the console says
// which numbers are still wanted.
// ============================================================
window.FRAGRANCE_NOTES = {

  // ============================================================
  // THE INDIVIDUAL FRAGRANCES — individual-fragrances/individual-fragrances.html
  // The ones that belong to no house on the Houses view.
  // ============================================================
  "individual:01": {
    top: ["Balsamic Vinegar", "Cherry", "Citrus", "Milk"],
    mid: ["Cinnamon", "Cloves", "Pepper"],
    base: ["Woody Notes", "Caramel", "Smoke", "Oak"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Lussur/CV99-128462.html" },
  },

  "individual:02": {
    version: "2011 original",
    flat: ["Chrysanthemum", "Green Notes", "Violet", "Soil Tincture", "Incense", "Plum Tree"],
    note: "Serge Lutens publishes no note list for it — the house rarely does — so this is the fallback. The 2015 Limited Edition is listed with a pyramid; this one is not.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Serge-Lutens/De-Profundis-13274.html" },
  },

  "individual:03": {
    flat: ["Lavender (three natural oils)", "Birch", "Cedar", "Fir", "Guaiac", "Cypriol",
           "Sandalwood", "Wormwood", "Styrax", "Pine Needle", "Saffron", "Thyme",
           "Rosemary", "Black Pepper", "Nutmeg", "Caraway", "Cinnamon", "Violet Leaf",
           "Tobacco", "Mushroom", "Basil", "Marjoram", "Vetiver", "Goat Hair", "Seaweed"],
    say: "The perfumer\u2019s own account",
    note: "The perfumer\u2019s own account of it, which names these and says the composition uses over a hundred ingredients. Neither list is a pyramid: this fragrance is not published as one.",
    source: { name: "PRIN (Prin Lomros)", url: "https://prinlomros.com/product/haxan/" },
    // AND THE SECOND HALF, which the owner asked for by hand: "the
    // upper part is the owners account, and then the bottom half is
    // the interpreted notes sourced from fragrantica". Thirty-nine of
    // them, read off the owner's own screenshot of the page rather
    // than out of a search summary — the one entry on the site whose
    // fallback list was seen rather than reported.
    also: {
      say: "Interpreted notes",
      flat: ["Chamomile", "Balsam Fir", "Mushroom", "Goat Hair Tincture", "Spruce", "Cypress", "Galbanum", "Lavender", "Wormwood", "Beeswax", "Styrax", "Marjoram", "Rosemary", "Costus", "Thyme", "Castoreum", "Basil", "Cypriol Oil or Nagarmotha", "Vetiver", "Clary Sage", "Sage", "Musk", "Cedar", "Oregano", "Cashmeran", "Incense", "Labdanum", "Caraway", "Guaiac Wood", "Patchouli", "Elemi", "Nutmeg", "Tobacco", "Cloves", "Black Pepper", "Jasmine", "Australian Sandalwood", "Opoponax", "Saffron"],
      source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Prissana/Haxan-77361.html" },
    },
  },

  "individual:04": {
    flat: ["Tobacco", "Tobacco Leaf", "Honey", "Smoke", "Plum", "Amber",
           "Oriental Notes", "White Tobacco", "Peach", "Citruses"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Dior/Tobacolor-65551.html" },
  },

  // THE GAP IS CLOSED. The owner's list skipped a fifth — they numbered
  // 1, 2, 3, 4, 6, 7 and called them "the seven" — and an empty slot
  // was kept for a round in case one was meant to be there. On
  // 2026-09-22 they asked for it removed and the ones below moved up,
  // so what follows is Flamenco EDP at 05 and French Riviera at 06.

  "individual:05": {
    version: "2017 eau de parfum",
    top: ["Raspberry", "Apple", "Violet", "Orange Blossom"],
    mid: ["Rose", "Jasmine", "Iris"],
    base: ["Cedar", "Cypress", "Amber", "Pine Tree"],
    note: "The 2024 Extrait is a different composition.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Ramon-Monegal/Flamenco-44233.html" },
  },

  "individual:06": {
    top: ["Lemon", "Orange", "Tangerine", "Ginger", "Pepper"],
    mid: ["Sea Notes", "Tiare Flower", "Pine Tree", "Mimosa", "Vetiver"],
    base: ["Sea Salt", "White Musk", "Amber"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Mancera/French-Riviera-74636.html" },
  },

  // VELVET FOG, the seventh, added 2026-09-24. The owner sent its notes
  // with the fragrance — top neroli; heart lavender, ylang-ylang; base
  // orris, vetiver, sandalwood, honey — and Fragrantica divides them
  // the same way. The house's own page (casagoa.ro/velvet-fog) could not
  // be reached to check whether it publishes them, so the source named
  // is the one that could be; if the house's page does, it goes first.
  "individual:07": {
    top: ["Neroli"],
    mid: ["Lavender", "Ylang-Ylang"],
    base: ["Orris", "Vetiver", "Sandalwood", "Honey"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/CASA-GOA/Velvet-Fog-103840.html" },
  },

  // HOUSE OF ELLIXIRZ, the eighth, added 2026-09-25 at the owner's word:
  // "add the following perfume as 008. it is called house of ellixirz
  // from Matca". THE HOUSE'S OWN PAGE FIRST, as ever — and Matca divides
  // them, so this is a pyramid. The page itself could not be opened from
  // here (the address is blocked), so the notes were read through a
  // search held to matcanaturals.com alone; the link is the product page
  // the owner gave, without the search engine's tracking tag on the end.
  // Fragrantica's reading names the same materials with small
  // differences ("Rose Oil", "Birch", "Cypriol Oil or Nagarmotha") and
  // is not used, because the house publishes its own.
  "individual:08": {
    top: ["Lemon", "Petitgrain"],
    mid: ["Cassia", "Rose Absolute"],
    base: ["Nagarmotha", "Tobacco", "Leather", "Birch Tar", "Vanilla", "Caramel"],
    source: { name: "Matca", url: "https://www.matcanaturals.com/en-eu/products/house-of-ellixirz" },
  },

  // ============================================================
  // ALMOST HUMAN — houses/almost-human.html
  //
  // NOT ONE OF THE FIVE HAS A PYRAMID, and that is the house rather
  // than a gap in the research: it presents its fragrances as an
  // "olfactory landscape" instead of a top/mid/base, and Fragrantica
  // lists them the same way. Recording them as pyramids would be
  // inventing a structure the house has gone out of its way not to use.
  // ============================================================
  "almost-human:01": {
    landscape: {
      flat: ["Burning Silence", "Glowing Dust", "Cracked Ground", "Dry Heat", "Clear Light Ahead"],
      source: { name: "Almost Human", url: "https://almosthuman.store/products/burning-bridges" },
    },
    flat: ["Woody Notes", "Smoke", "Spices", "Citrus"],
    note: "The house publishes an olfactory landscape rather than notes — it is on its own button above. These are the fallback\u2019s reading of the same fragrance.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Almost-Human/Burning-Bridges-122262.html" },
  },
  "almost-human:02": {
    landscape: {
      flat: ["Soft Ozone", "Glowing Skin", "Digital Warmth", "Soft Amber Light", "Distant Calm"],
      source: { name: "Almost Human", url: "https://almosthuman.store/products/dear-future" },
    },
    flat: ["Ozonic Notes", "Skin", "Amber"],
    note: "The house publishes an olfactory landscape rather than notes — it is on its own button above. These are the fallback\u2019s reading of the same fragrance.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Almost-Human/Dear-Future-122266.html" },
  },
  "almost-human:03": {
    landscape: {
      flat: ["Sun-Burnt Sand", "Dry Woods", "Resin Heat", "Rose Dust", "Distant Cool Light"],
      source: { name: "Almost Human", url: "https://almosthuman.store/products/desert-hope" },
    },
    flat: ["Sand", "Resin", "Solar Notes", "Dust", "Dry Wood", "Rose"],
    note: "The house publishes an olfactory landscape rather than notes — it is on its own button above. These are the fallback\u2019s reading of the same fragrance.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Almost-Human/Desert-Hope-122264.html" },
  },
  "almost-human:04": {
    landscape: {
      flat: ["Smoked Herbs", "Warm Resins", "Dry Earth", "Animal Heat", "Fading Ash"],
      source: { name: "Almost Human", url: "https://almosthuman.store/products/ritual-code" },
    },
    flat: ["Resins", "Ash", "Smoke", "Animal Notes", "Herbal Notes", "Earthy Notes"],
    note: "The house publishes an olfactory landscape rather than notes — it is on its own button above. These are the fallback\u2019s reading of the same fragrance.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Almost-Human/Ritual-Code-122265.html" },
  },
  "almost-human:05": {
    landscape: {
      flat: ["Wet Concrete", "Green Mist", "Warm Soil Steam", "Fading Sunlight", "Quiet Air"],
      source: { name: "Almost Human", url: "https://almosthuman.store/products/silent-rain" },
    },
    flat: ["Soil Tincture", "Rain Notes", "Concrete", "Green Accord", "Airy Note", "Solar Notes"],
    note: "The house publishes an olfactory landscape rather than notes — it is on its own button above. These are the fallback\u2019s reading of the same fragrance.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Almost-Human/Silent-Rain-122263.html" },
  },

  // ============================================================
  // ADAR — houses/adar.html
  //
  // This house DOES divide, and its own site is where the division is
  // — which is the source the owner asked for first.
  // ============================================================
  "adar:01": {
    top: ["Fig Leaf", "Icy Ginger", "Ozone"],
    mid: ["Saffron", "Leathery Osmanthus", "Mineral Accords"],
    base: ["Mineral Ambers", "Haitian Vetiver", "Smoky Resins", "Ambergris"],
    note: "The house\u2019s own prose frames it as an event rather than a smell: \u201cthe moment of creation and the instant of protection, captured in drops\u201d \u2014 beginning \u201cnot with warmth, but with its absolute opposite: the vacuum before the Big Bang, the frozen split-second before a shield is raised.\u201d",
    source: { name: "ADAR Perfumes", url: "https://adarperfumes.com/products/amber-zero-essence-of-dephts" },
  },
  "adar:03": {
    top: ["Japanese Honeysuckle", "Carob Pods", "Sea Salt"],
    mid: ["Black Honey", "Tobacco Leaf", "Candle Wax"],
    base: ["Amber Oud", "Burnt Almond", "Petrified Driftwood"],
    note: "The house names its materials as stories: an ambered oud \u201csmuggled into Messina\u2019s port in a coffin-shaped crate\u201d, a burnt almond that is \u201cthe scent of torrone crumbled\u201d, and a petrified driftwood \u201cwashed ashore from Ulysses\u2019 shipwreck\u201d. It calls the formula \u201cextreme, confrontational, and artistically raw \u2014 not for casual wear.\u201d",
    source: { name: "ADAR Perfumes", url: "https://adarperfumes.com/products/incantu-drops-of-styx" },
  },
  "adar:06": {
    flat: ["Musk", "Aquatic Notes", "Coumarin", "Vanilla", "Heliotrope", "Citruses", "Orange Blossom"],
    note: "The house\u2019s own line is \u201cthe scent of the sea and the stars, with skin glistening with the dew of grapefruit and aldehydes\u201d \u2014 an image rather than a list, so the notes here are the fallback\u2019s.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/ADAR/Alta-Luna-115895.html" },
  },

  "adar:05": {
    top: ["Banana", "Mint", "Saffron"],
    mid: ["Tuberose", "Jasmine", "Ylang Ylang"],
    base: ["Tobacco", "Incense", "Tonka Bean", "Civet"],
    note: "The house calls it \u201cThe Alchemist\u2019s Banquet\u201d and says it smells of \u201csaffron, banana, and mint, with a hint of something unnameable\u201d \u2014 but publishes no divided list, so this is the fallback\u2019s.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/ADAR/Alpha-11-115893.html" },
  },
  "adar:07": {
    top: ["Pink Pepper", "Yuzu", "Quince", "Absinthe"],
    mid: ["Saffron", "Green Tea Flowers", "Black Cherry", "Murumuru Butter", "Myrrh"],
    base: ["Tonka Bean", "Maninka"],
    note: "The house\u2019s own prose is the fragrance\u2019s argument: it \u201cdances between worlds \u2014 the tremors of synapses by day and listening to the murmurs of moss-covered rocks by night\u201d, the paradox of \u201ca mind that runs like wildfire yet finds peace in the eye of the storm.\u201d",
    source: { name: "ADAR Perfumes", url: "https://adarperfumes.com/products/adhd-neuro-elixir" },
  },
  "adar:11": {
    flat: ["Dark Chocolate", "Birch Tar", "Clary Sage", "Honey Absolute", "Ambergris"],
    note: "The house names these in its own description of the fragrance; it publishes no pyramid for it.",
    source: { name: "ADAR Perfumes", url: "https://adarperfumes.com/" },
  },
  "adar:02": {
    top: ["Galbanum", "Lime", "Violet Leaf", "Marine Accord"],
    mid: ["Ylang-Ylang", "Neroli", "Myrrh", "Clary Sage"],
    base: ["Absolute Vetiver", "Cedar Wood Tincture", "Tonka Bean", "Leather Accord"],
    note: "The house's own list, and its own prose: \u201cthe charged silence of the moment before the storm, that suspended moment when the air becomes denser, when the horizon darkens, and when the invisible architecture of energy begins to unfold.\u201d",
    source: { name: "ADAR Perfumes", url: "https://adarperfumes.com/products/aetherialism-storm-breath" },
  },
  "adar:04": {
    flat: ["Smoky Oud", "Jasmine", "Bitter Orange", "Sandalwood", "Ambergris"],
    note: "Named in the house's own prose rather than as a note list — a thousand-year-old smoky oud, lunar jasmine, bitter orange, ancient sandalwood, sealed with a tear of ambergris.",
    source: { name: "ADAR Perfumes", url: "https://adarperfumes.com/products/against-all-odds" },
  },
  "adar:08": {
    top: ["Electric Bergamot", "Black Pepper", "Frozen Pine Needles"],
    mid: ["Petrichor Accord", "Clear Orchid", "Mineral Accord"],
    base: ["Dark Patchouli", "Rose Absolute", "White Amber", "Smoked Palo Santo", "Oakmoss Absolute"],
    note: "The house divides it by the glyph on the bottle: the opening is \u201cthe arrow\u2019s tip \u2014 penetrating and clear\u201d, the heart \u201cthe semicircle \u2014 receptive and nurturing\u201d, and the base the root code itself, \u201cfoundational and algorithmic\u201d. The owner supplied this one from the house\u2019s own page, which is why it is here and the two beside it are not.",
    source: { name: "ADAR Perfumes", url: "https://adarperfumes.com/products/root-code" },
  },
  "adar:09": {
    top: ["Cold Night Air", "Frankincense"],
    mid: ["Cedarwood", "Sawn Resin", "Dry Moss", "Rose", "Clean Bright Oud"],
    base: ["Myrrh", "Aged Parchment Accord", "Skin"],
    note: "Named in the house's own prose, which divides it into an opening, a heart and a base.",
    source: { name: "ADAR Perfumes", url: "https://adarperfumes.com/products/lignum-dei-the-wood-of-god-essence-of-hope-micro-batch-77-pieces" },
  },
  "adar:10": {
    missing: "No information as of yet.",
    note: "The house has no page for it that names a material, and no prose to quote either \u2014 which is the only one of the eleven that is true of.",
    source: { name: "ADAR Perfumes", url: "https://adarperfumes.com/" },
  },

  // ============================================================
  // ATARAXIA — houses/ataraxia.html
  //
  // EVERY ONE OF THESE IS TWO LISTS, which the owner asked for by name
  // ("split the exact same way as they were with haxan"): the HOUSE'S
  // OWN account above and Fragrantica's below. The two really do differ
  // here — Ataraxia names its raw materials while the fallback lists
  // the fragrance's conceptual notes, and on Deity and Amaretto Jazz
  // the two lists are not even the same words.
  // ============================================================
  "ataraxia:01": {
    say: "The house\u2019s own notes",
    top: ["Amaretto", "Holy Bread"],
    mid: ["Black Cherry Liquor", "Amaretto", "Honey", "Candle Wax"],
    base: ["Hazelnut Chocolate", "Cognac", "Almond", "Dusty Sofa", "Passionflower", "Cacao Butter", "Honeycomb", "Vanilla Caviar", "Tobacco Absolute"],
    note: "A collaboration with Toskovat\u2019. The house\u2019s own line for it: \u201clike drinking a sweet, honeyed Amaretto Sour in hell\u201d, in \u201ca burning jazz club filled with warmth and desire\u201d, with a sacramental bread accord round it \u2014 \u201ca quiet symbol of baptism, of salvation through pleasure.\u201d",
    source: { name: "Ataraxia Perfumery", url: "https://ataraxiaperfumery.com/products/amaretto-jazz-in-the-melting-room" },
    also: {
      say: "Interpreted notes",
      top: ["Amaretto", "Bread"],
      mid: ["Amaretto", "Candle Wax", "Liquor", "Honey", "Black Cherry"],
      base: ["Honeycomb", "Dust", "Almond", "Cognac", "Cocoa", "Tobacco", "Chocolate", "Hazelnut", "Butter", "Vanilla Caviar", "Passion Flower"],
      source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Ataraxia-Perfumery/Amaretto-Jazz-in-the-Melting-Room-100361.html" },
    },
  },
  "ataraxia:02": {
    say: "The house\u2019s own notes",
    top: ["Honey", "Japanese Plum", "Cherry Jam", "Chantilly Cream", "Golden Berry"],
    mid: ["Condensed Milk", "Tobacco Absolute", "Tobacco Blonde", "Cocoa Butter", "Beeswax Absolute", "Snowdrops"],
    base: ["Olibanum Absolute", "Labdanum Absolute", "Dark Cocoa", "Vanilla", "Tonka", "Amber", "Benzoin", "Elemi", "Myrrh", "Gold", "Patchouli", "Dates", "Nectar"],
    note: "The house\u2019s own list names materials the fallback\u2019s does not \u2014 Japanese plum for loquat, cocoa butter for cocoa, and a note it simply calls Gold. It says the formula carries \u201ca very high concentration of absolutes and naturals that gives it an abyssal depth\u201d.",
    source: { name: "Ataraxia Perfumery", url: "https://ataraxiaperfumery.com/products/deity" },
    also: {
      say: "Interpreted notes",
      top: ["Honey", "Cherry Jam", "Chantilly Cream", "Goldenberry", "Japanese Loquat"],
      mid: ["Beeswax", "Blonde Tobacco", "Tobacco", "Cocoa", "Condensed Milk", "Snowdrops"],
      base: ["Myrrh", "Dark Chocolate", "Olibanum", "Amber", "Vanilla", "Benzoin", "Labdanum", "Elemi", "Dates", "Tonka", "Nectar", "Dark Patchouli"],
      source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Ataraxia-Perfumery/Deity-119626.html" },
    },
  },
  "ataraxia:03": {
    say: "The house\u2019s own notes",
    missing: "Not disclosed yet.",
    note: "The owner asked for this one to say so rather than to stand on the fallback alone: the house has published no note list for it. What is below is Fragrantica\u2019s reading, and it is the only account there is.",
    source: { name: "Ataraxia Perfumery", url: "https://ataraxiaperfumery.com/" },
    also: {
      say: "Interpreted notes",
      top: ["Porcelain", "Lipstick", "Iris", "Raspberry", "Soda Bubbles"],
      mid: ["Blush", "Velvet", "Iris Butter", "Candle Wax", "White Chocolate", "Orris"],
      base: ["Makeup Palette", "Lip Gloss", "Eye Pencil", "Instant Film Accord", "Myrrh"],
      source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Ataraxia-Perfumery/My-Doll-s-Makeup-142160.html" },
    },
  },
  "ataraxia:04": {
    say: "The house\u2019s own notes",
    flat: ["Myrrh", "Marigold EO", "Rose", "Cypriol", "Hay Absolute", "Natural Birch Tar", "Seaweed", "Cumin Seed Oil", "Tuberose"],
    note: "The two halves say different KINDS of thing here, and that is why both are worth having: the house names the raw materials it is built from, and the fallback names what it is supposed to smell OF. The house says it was made \u201cnot to be worn, but to be cherished, experienced, and collected as it evolves over time\u201d \u2014 no preservatives, so it goes on maturing.",
    source: { name: "Ataraxia Perfumery", url: "https://ataraxiaperfumery.com/products/spinal-fluid" },
    also: {
      say: "Interpreted notes",
      top: ["Steam", "Fire", "Salty Tears", "Gasoline"],
      mid: ["Rotten Flesh", "Dried Blood", "Spinal Fluid"],
      base: ["Ash", "Clear Skies", "Bluebell Flowers"],
      source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Ataraxia-Perfumery/Spinal-Fluid-115343.html" },
    },
  },
  "ataraxia:05": {
    say: "The house\u2019s own notes",
    flat: ["Dark Chocolate", "Spice", "Dusty Antiques"],
    note: "Named in the house\u2019s own description rather than as a list: it was made \u201cto smell as whispers of a vampire\u2019s lair\u201d, of dark chocolate, spice and dusty antiques. The divided list below is the fallback\u2019s.",
    source: { name: "Ataraxia Perfumery", url: "https://ataraxiaperfumery.com/products/vestibule" },
    also: {
      say: "Interpreted notes",
      // CORRECTED BY THE OWNER, 2026-09-24, off the page itself: the first
      // reading had "Chocolate" for the chocolate bar, "Chocolate
      // Truffle" and "Cake" for the one chocolate cake, "Beer" for root
      // beer, and "Old House" for an antique shop.
      top: ["Chocolate Bar", "Carolina Reaper"],
      mid: ["Chocolate Cake (Amandină)", "Red Hot Chilli", "Wasabi", "Pollen", "Antique Shop", "Turmeric", "Root Beer"],
      base: ["Cocoa Pod", "Edamame", "Pistachio", "Old Book", "Halva", "Potato"],
      source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Ataraxia-Perfumery/Vestibule-100362.html" },
    },
  },

  // ============================================================
  // LES ABSTRAITS — houses/les-abstraits.html
  //
  // Every one of these comes off the house's own site, which publishes
  // a divided list for all four. The house is one perfumer's: every
  // composition is Antoine Lie's.
  // ============================================================
  "abstraits:01": {
    top: ["Orris", "Iris", "African Ginger"],
    mid: ["Cacao", "Olibanum", "Cardamom"],
    base: ["Tonka Bean", "Musk", "Sandalwood"],
    note: "The one the owner already mentions in Grande Parfums\u2019 Vintage Memoir, written up here at last.",
    source: { name: "Les Abstraits", url: "https://lesabstraits.com/products/belle-ame" },
  },
  "abstraits:02": {
    top: ["Pine Tar", "Galbanum", "Birch Tar", "Mint", "Clove"],
    mid: ["Leather", "Violet Leaf", "Tuberose"],
    base: ["Oakmoss", "Hyrax", "Vetiver", "Patchouli"],
    note: "Built round the image of cinders and embers \u2014 Moroccan mint, galbanum, charred resins and burnt fruits.",
    source: { name: "Les Abstraits", url: "https://lesabstraits.com/products/des-cendres" },
  },
  "abstraits:03": {
    top: ["Bulgarian Rose Absolute", "Turkish Rose Absolute", "Iris Pallida", "Frankincense"],
    mid: ["Clove", "Cumin", "Saffron"],
    base: ["Castoreum Absolute", "Patchouli Aceh", "Atlas Cedar", "Spanish Labdanum", "Opoponax", "Myrrh"],
    note: "The house\u2019s first fragrance, and its own image for it is \u201cthe exquisite pain\u201d: a single rose melting like red beeswax into cumin, incense, myrrh and patchouli.",
    source: { name: "Les Abstraits", url: "https://lesabstraits.com/products/la-douleur-exquise" },
  },
  "abstraits:04": {
    top: ["Bergamot (Ionian Coast)", "Lemon (Italy)", "Neroli", "Orange Blossom", "Baie Rose", "Cardamom", "Clove", "Cinnamon (Ceylon)", "Artemisia", "Juniper"],
    mid: ["Geranium (Morocco)", "Clary Sage Absolute (France)", "Carnation", "Violet", "Lavender de Provence"],
    base: ["Cedar Moss Absolute (Morocco)", "Vetiver (Haiti)", "Patchouli (Aceh)", "Costus", "Musk", "Benzoin", "Tonka Bean", "Vanilla"],
    note: "A floral foug\u00e8re, and the house names the region of nearly every material rather than just the material \u2014 which is unusual enough to be worth keeping as it writes them.",
    source: { name: "Les Abstraits", url: "https://lesabstraits.com/products/philosophers-walk" },
  },

  // ============================================================
  // GRANDE PARFUMS — houses/grande-parfums.html
  // ============================================================
  "grande:05": {
    missing: "I could not find this fragrance online.",
  },
  "grande:09": {
    top: ["Scorched Pineapple", "Soft Tobacco Leaf"],
    mid: ["Apple Tarte Tatin Accord"],
    base: ["Tonka Bean", "Vetiver", "Oakmoss", "Beeswax"],
    note: "The house's own page gives no note list for it, so this is the fallback.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Grande/Hot-Stuff-114957.html" },
  },
  "grande:11": {
    flat: ["Balsam of Peru", "Strawberry", "Raspberry", "Black Tea", "Cinnamon", "Tobacco", "Apple", "Cloves", "Bark", "Tea", "Taif Rose", "Guatemalan Cardamom", "Raisins", "Indian Saffron", "Ambergris", "Labdanum", "Rose Petals", "Masala Chai", "Musk", "Castoreum", "Dried Fruits", "Cambodian Oud", "Beeswax", "Vanilla", "Tonka Bean", "Amber", "Tobacco Flower"],
    note: "The house's own page gives no note list for it, so this is the fallback — and the fallback gives one undivided list of twenty-seven.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.fr/parfum/Grande/Karak-Shisha-133545.html" },
  },
  "grande:14": {
    top: ["Jasmine Tea", "Peach", "Lemon", "Bergamot"],
    mid: ["Iris", "Iris Butter", "Violet Leaf", "Jasmine Sambac", "Ylang Ylang", "Geranium", "Tuberose", "Jasmine", "Rose de Mai", "Carnation", "Moroccan Rose", "Gardenia"],
    base: ["Musk", "Ambergris", "Sandalwood", "Clove", "Vetiver", "Madagascar Vanilla", "Oakmoss", "Benzoin", "Civet", "Siam", "Dark Patchouli", "Tolu Balsam", "Tonka Bean", "Cedarwood", "Labdanum"],
    note: "The house's own page describes it but gives no divided list, so this is the fallback. The owner's standout of the house.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Grande/Vintage-Memoir-124251.html" },
  },
  "grande:15": {
    top: ["Orange Blossom", "Green Mandarin", "Pear", "Guava", "Ginger", "African CO2"],
    mid: ["Baby Green Mango", "Moroccan Tea Absolute", "Lily of the Valley", "Woody Notes", "Raspberry", "Brazilian Orange"],
    base: ["White Musk"],
    note: "The house's own page lists the top notes but writes the heart and the base as prose, so the divided list is the fallback's.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Grande/White-Label-117529.html" },
  },
  "grande:06": {
    top: ["Incense", "Spices", "Iris", "Red Berries", "Clementine", "Saffron", "Orange"],
    mid: ["Blackberry", "Dried Fruits", "Blueberry", "Liquor", "Plum", "Raisin",
          "Plum Blossom", "Sugar Cane", "Toffee", "Lily-of-the-Valley", "Strawberry",
          "Myrrh", "Fig", "Tiare Flower", "Cinnamon", "Red Rose", "Jasmine Sambac", "Fir"],
    base: ["Amber", "Tonka Bean", "Vanilla", "Guaiac Wood", "Opoponax", "Castoreum",
           "Labdanum", "Benzoin", "Teak Wood", "Cedarwood", "Musk", "Patchouli"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Grande/Cuore-100855.html" },
  },
  "grande:12": {
    top: ["Frankincense", "CO2 Extracts", "Litchi", "Sparkling Water"],
    mid: ["Olibanum", "Dates", "Rose"],
    base: ["Frankincense", "Olibanum", "Amber", "Musk"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Grande/Mystical-Incense-114955.html" },
  },

  "grande:01": {
    top: ["Raspberry", "Pink Pepper", "Sugar Cane", "Cinnamon", "Saffron", "Clove"],
    mid: ["Chocolate", "White Chocolate", "Ylang Ylang", "Brandy", "Suede", "Honey", "Oud", "Oak"],
    base: ["Leather", "Musk", "Peru Balsam", "Tonka Bean", "Cedarwood", "Labdanum", "Vanilla", "Benzoin", "Tobacco", "Honey", "Oud", "Mysore Sandalwood", "Haitian Vetiver", "Cambodian Oud"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Grande/5-Years-Anniversary-124250.html" },
  },
  "grande:02": {
    top: ["Coffee CO2", "Allspice", "Myrrh"],
    mid: ["Coffee", "Rhum Agricole", "Cognac", "Tobacco", "Beeswax", "Raisin", "Myrtle", "Rose", "Nutmeg", "Lily of the Valley", "Cedarwood"],
    base: ["Labdanum", "Resins", "Siam Benzoin", "Amber", "Castoreum", "Madagascar Vanilla", "Tolu Balsam", "Peru Balsam", "Patchouli", "Guaiac Wood", "Tonka Bean", "Ambergris", "Opoponax", "Australian Sandalwood", "Musk"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Grande/Ambresso-91330.html" },
  },
  "grande:03": {
    top: ["Cambodian Oud"],
    mid: ["Assam Oud", "Oud", "Thailand Oud", "Siam"],
    base: ["Oud", "Laotian Oud", "Malaysian Oud", "Musk", "CO2 Extracts"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Grande/Ancient-Oud-124253.html" },
  },
  "grande:07": {
    top: ["Lemon", "Pear", "Peach", "Pink Pepper"],
    mid: ["Yellow Flowers", "Freesia", "Caramel", "Lily of the Valley"],
    base: ["Vanilla Absolute", "Musk", "Cedarwood", "Myrrh"],
    note: "Fragrantica lists this as Dreaming Maldive, singular.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Grande/Dreaming-Maldive-82597.html" },
  },
  "grande:08": {
    top: ["Blood Orange", "Grapefruit", "Sicilian Lemon"],
    mid: ["Lily-of-the-Valley", "Raspberry Leaf", "Neroli", "Tuberose", "Magnolia", "Jasmine Sambac", "White Rose", "Red Rose"],
    base: ["Tuberose", "Cashmeran", "Amber", "Patchouli", "Tonka Bean", "Vanilla", "Musk", "Dark Patchouli"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Grande/Giardino-di-Sorrento-106626.html" },
  },
  "grande:10": {
    top: ["Bergamot", "Orange Blossom", "Rosemary"],
    mid: ["Cloves", "Cypriol Oil or Nagarmotha", "Geranium", "Cedarwood"],
    base: ["Dark Patchouli", "Vetiver", "White Musk", "Labdanum", "Benzoin", "Guaiac Wood", "Amyris"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Grande/Intimate-Spell-82598.html" },
  },
  "grande:13": {
    top: ["Brown Sugar", "Raspberry Leaf", "Spices", "Rhum Agricole"],
    mid: ["Vanilla", "Guaiac Wood", "Heliotrope", "Lily of the Valley"],
    base: ["Castoreum", "Tonka Bean", "Madagascar Vanilla", "Vanilla Sauce", "Fenugreek", "Deer Musk", "Olibanum"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Grande/Vanilla-Ash-133544.html" },
  },

  // ============================================================
  // PINEWARD — houses/pineward.html
  //
  // THIS HOUSE PUBLISHES NO PYRAMIDS AT ALL. Its own Master Scent List
  // and Fragrantica both give one undivided list per fragrance, so
  // every entry below is flat. That is the house, not a gap in the
  // research — setting any of these out as Top / Mid / Base would be
  // three claims nobody has made.
  // ============================================================
  "pineward:01": {
    flat: ["Poplar Bud", "Citrus", "Pine Needles", "Ambrette", "Crushed Leaves", "Cedar"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:02": {
    flat: ["Pine Needles", "Mint", "Cedar", "Resins", "Moss"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:03": {
    flat: ["Black Hemlock Needles", "Larch Cones", "Sandarac Resin", "Momi", "Sandalwood", "Vietnamese Oud"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:04": {
    flat: ["Cedar", "Smoke", "Oakwood", "Ponderosa Pine Needles", "Vanilla"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:05": {
    flat: ["Leather", "Myrrh", "Patchouli", "Fir", "Oolong Tea", "Opoponax", "Smoke", "Pine Needles", "Salvia Absolute", "Oakmoss"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:07": {
    flat: ["Morel Mushroom", "Decayed Rose", "Leather", "Tobacco", "Smoke", "Pineboard", "Incense", "Sweet Myrrh", "Blood Cedar", "Dried Needles", "Rotting Wood (Oud)"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:08": {
    flat: ["Lemon Peel", "Juniper", "Rosemary", "Lavender", "Juniper Berry", "Sandalwood", "Patchouli"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Juniperus-99963.html" },
  },
  "pineward:09": {
    flat: ["Fir Balsam", "Black Hemlock", "Lapsang Souchong", "Moss", "Incense", "Bitter Myrrh"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:13": {
    flat: ["Baked Apple", "Pine", "Frankincense", "Fir", "Spices", "Resin", "Myrrh", "Cedar", "Amber", "Himalayan Nard (Jatamansi)", "Ambergris", "Poplar"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Sturbridge-99964.html" },
  },
  "pineward:14": {
    flat: ["Orange", "Fir", "Pine", "Ginger", "Clove", "Musk", "Oakmoss", "Anise", "Vetiver"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/White-Fir-83392.html" },
  },
  "pineward:15": {
    flat: ["Sheep Wool", "Lanolin", "Raspberry", "Lavender", "Honey", "Brown Sugar", "Amber", "Beeswax", "Sweetgrass"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:16": {
    flat: ["Hay", "Honey", "Oat", "Wheat", "Hazelnut", "Almond", "Lavender", "Grass", "Indian Saffron"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Hayloft-83386.html" },
  },
  "pineward:19": {
    flat: ["Hay", "Oatmeal", "Hazelnut", "Bergamot", "Lavender", "Herbal Tea", "Westfarthing Leaf (Tobacco)", "Seed Cake", "Jasmine", "Orris", "Honey"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:25": {
    flat: ["Sweet Yuzu", "Bergamot", "Juniper Berry", "Ivy", "Eucalyptus", "Waterlily", "Goldenrod", "Heliotrope", "Seaweed", "Cedar", "Oakmoss"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },

  "pineward:10": {
    flat: ["Pine", "Juniper", "Bergamot", "Carnation", "Geranium", "Chamomile", "Hay", "Tobacco", "Silver Fir", "Lavender", "Amber", "Vetiver", "Sandalwood", "Oakmoss", "Patchouli"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:11": {
    flat: ["Pine Needles", "Juniper Scales", "Vetiver", "Myrtle", "Soil", "Swamp Water"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:17": {
    flat: ["Hay", "Hot Cocoa", "Vanilla", "Sweet Vernalgrass", "Bison Grass", "Acorn Nut Bread", "Nutmeg", "Cardamom", "Spikenard", "Raisin", "Tonka", "Oakmoss"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:18": {
    flat: ["Apricot Preserve", "Blackberry Jam", "Raw Honey", "Propolis", "Beeswax", "Sweetgrass", "Hay Bales", "Bran Wheat", "Oat Grains", "Bourbon Vetiver", "Maté Tea", "Oakmoss"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:20": {
    flat: ["Beeswax", "Tobacco", "Hay", "Maple", "Barley", "Hops", "Peat", "Pine Needles", "Poplar Buds"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Steading-64597.html" },
  },
  "pineward:21": {
    flat: ["Cranberry", "Nutmeg", "Balsam Fir", "Plum", "Cloves", "Blood Orange"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Christmas-Wine-64601.html" },
  },
  "pineward:22": {
    version: "2025 Icing Edition",
    flat: ["Ginger", "Cinnamon", "Cloves", "Nutmeg", "Wheat Absolute", "Molasses Distillate", "Brown Sugar", "Black Walnut", "Milk Accord", "Butter", "Vanilla", "Icing"],
    note: "The most recent of the Gingerbreads, and the one the house lists.",
    source: { name: "Pineward", url: "https://www.pinewardperfume.com/shop/p/gingerbread" },
  },
  "pineward:23": {
    version: "2025 Edition",
    flat: ["Cranberry", "Champaca", "Cherry Compote", "Raspberry", "Fir Balsam", "Chocolate", "Davana Attar", "Oakmoss", "Tolu Balsam", "Rose", "Sandalwood", "Frankincense"],
    note: "The 2025 Edition, which the house says carries more red champaca absolute, a finer cocoa absolute, storax from Liquidambar orientalis and Mysore sandalwood. The 2021 is a shorter list without the storax, tolu, rose or sandalwood.",
    source: { name: "Pineward", url: "https://pinewardperfume.com/products/gluhwein" },
  },

  "pineward:24": {
    flat: ["Cloves", "Rum", "Cinnamon", "Agarwood (Oud)", "Hazelnut"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Revelries-75631.html" },
  },
  "pineward:26": {
    flat: ["Juniper Berries", "Juniper Needles", "Sea Water", "Bladderwrack", "Coastal Cypress", "Oyster Mushroom", "Water Pepper", "Blue Gum Eucalyptus", "Pacific Ambergris", "Irish Sea Moss", "Sandalwood"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:27": {
    flat: ["Fresh Ginger", "Neroli Blossom", "Bergamot Peel", "Blood Orange", "Himalayan Cedar", "Rosemary", "Leather", "Oakmoss"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:28": {
    flat: ["Subalpine Fir", "Bergamot", "Black Pepper", "Cedar Leaf (Thuja)", "Sandalwood", "Vetiver", "Ambrette", "Moss"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:29": {
    flat: ["Green Apple", "Benzoin", "Patchouli", "Sandalwood", "Cedar"],
    source: { name: "Pineward", url: "https://pinewardperfume.com/products/akero" },
  },
  "pineward:30": {
    flat: ["Fresh Red Apple", "Tobacco", "Fir Balsam", "Rum Resin", "Dried Fruits"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:31": {
    flat: ["Fir", "Balsam Fir", "Spruce", "Black Tea", "Smoke", "Chamomile", "Incense", "Musk", "Lavender", "Vanilla", "Oakmoss"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Caravansary-93734.html" },
  },
  "pineward:32": {
    flat: ["Suede", "Leather", "Clementine", "Tobacco Leaf", "Ambergris", "Pine", "Saffron", "Passionfruit", "Blood Orange", "Fir", "Sandalwood", "Cedar", "Cedarwood", "Jasmine", "White Lotus"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Clemenpine-83188.html" },
  },
  "pineward:33": {
    flat: ["Coffee", "Tobacco", "Cedar", "Patchouli", "Resins", "Spices", "Frankincense", "Guaiac Wood", "Vanilla"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Coffee-Tabac-99924.html" },
  },
  "pineward:34": {
    flat: ["Clementine", "Juniper", "Tomato Leaf", "Vetiver", "Sandalwood", "Ambergris"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Delfin-o-83372.html" },
  },
  "pineward:35": {
    flat: ["Noble Fir", "Scotch Pine", "Expressed Citron", "Blond Tobacco", "Botanical Musk", "Vetiver"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },

  "pineward:36": {
    flat: ["Cedar Planks", "Sawdust", "Smouldering Logs", "Edelwood Oil", "Amber", "Black Walnut", "Mahogany", "Labdanum"],
    source: { name: "Pineward", url: "https://pinewardperfume.com/products/gristmill" },
  },
  "pineward:38": {
    flat: ["Cypress", "White Grapefruit", "Juniper", "Nootka", "Seaweed", "Pine", "Cedar", "Sandalwood"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Icefall-83388.html" },
  },
  "pineward:39": {
    flat: ["Climbing Ivy", "Green Tea", "Spearmint", "Lime Rind", "Lemon Verbena", "Waterlily", "Emerald Cypress", "Mugo Pine", "Cedarwood", "Oakmoss", "Treemoss", "Cedarmoss"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },

  "pineward:41": {
    flat: ["Oakmoss", "Alpine Sandwort", "Wild Grass", "Green Wheat", "Orange Blossom", "Fir Balsam", "Tomato Leaf", "Azure Bluet", "Mountain Wildflowers"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:42": {
    flat: ["Chocolate", "Peppermint", "Patchouli", "Vanilla", "Spices", "Resins", "Malt", "Cedar"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Mint-Cocoa-99948.html" },
  },
  "pineward:44": {
    flat: ["Ponderosa Resin", "Ponderosa Needles", "Cedarwood", "Bourbon Vanilla", "Strawberry", "Cinnamon Attar", "Butterscotch", "Beeswax", "Raisin Cookies"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:45": {
    flat: ["Parchment", "Paper", "Leather", "Tobacco", "Black Tea", "Sandalwood", "Cedar", "Orris Root", "Rice", "Ambrette", "Coffee", "Oakmoss", "Nagarmotha"],
    note: "Left on the fallback on purpose: a search of the house's own list came back with Cotswold's notes and Cotswold's description under this name, which is a conflation rather than a source.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Tome-115784.html" },
  },
  "pineward:46": {
    flat: ["Tobacco", "Lapsang Souchong Tea", "Molasses", "Honey", "Raisin"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Treacle-71217.html" },
  },
  "pineward:47": {
    version: "2025 revision",
    flat: ["Ambergris", "Cypress", "Vanilla", "Clove", "Labdanum", "Fir", "Dragon\u2019s Blood Resin", "Sandalwood", "Tonkin Musk", "Vintage Mousse de Saxe"],
    note: "The January 2025 revision, which the house calls a complete rework: a new cypress supplier, a custom vintage Mousse de Saxe base, Mysore sandalwood and dragon\u2019s blood resin. The 2021 has none of those last four.",
    source: { name: "Pineward", url: "https://pinewardperfume.com/products/velvetine" },
  },

  "pineward:37": {
    flat: ["Juniper", "Wet Stone", "Musk", "Ambrette", "Bluebell", "Lichen", "Watercress", "Yarrow", "Pine"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Holy-Cross-126424.html" },
  },
  "pineward:40": {
    flat: ["Cold-Pressed Lime", "Black Cherry", "Ginger Root", "Rum", "Cola", "Neroli Blossom", "Bitter Orange", "Sugar", "Vanilla", "Nutmeg", "Coriander", "Cinnamon"],
    source: { name: "Pineward", url: "https://pinewardperfume.com/products/lime-cola" },
  },

  "pineward:06": {
    flat: ["Silver Fir", "Moss", "Lichen", "Pine Needles", "Wet Soil", "Damp Vegetation"],
    note: "Fanghorn II, not the 2020 Fanghorn: the house made it to replace the original after one of the key ingredients became unavailable, so they are two fragrances rather than two versions.",
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:12": {
    flat: ["Sandarac", "Tamarack", "Balsam", "Snoqualmie Forest Evergreens"],
    note: "The house names these in its own description rather than as a note list.",
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:43": {
    flat: ["Mint", "Mango", "Litchi", "Ambergris", "Cassis", "Rhubarb", "Sandalwood"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Noki-83375.html" },
  },

  "grande:04": {
    top: ["Saffron", "Cherry", "Cocoa"],
    mid: ["Dark Chocolate", "Osmanthus", "Jasmine", "Rose"],
    base: ["Sandalwood", "Vanilla", "Amberwood"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Grande/Choco-Powder-124252.html" },
  },

  // ============================================================
  // TOMBSTONE — houses/tombstone.html
  //
  // The house's own site first, as always; it publishes a divided list
  // for Sweet Coffin and No Need to Come By. For Sing at My Funeral it
  // names the top and the heart and only DESCRIBES the base ("earthy
  // and woody elements"), so the house's two tiers stand above and
  // Fragrantica's full list below — the arrangement Haxan and Ataraxia
  // use. 3 Feet 5 and Evergrow have no page on the house's site that
  // could be found, so theirs are the fallback's.
  // ============================================================
  "tombstone:01": {
    top: ["Heliotrope"],
    mid: ["Jasmine", "Mimosa"],
    base: ["Orris", "Smoke"],
    note: "The house\u2019s own site has no page for it that could be found, so this is the fallback. The name is a height: three feet five, a child of five to seven \u2014 the age, the house says, of a first conscious meeting with death.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/TOMBSTONE/3-Feet-5-103665.html" },
  },
  "tombstone:02": {
    top: ["Galbanum", "Bergamot"],
    mid: ["Rose", "Labdanum", "Orris"],
    base: ["Oakmoss", "Patchouli", "Musk"],
    note: "The house\u2019s own site has no page for it that could be found, so this is the fallback. A green chypre, on decay feeding what grows next \u2014 the house\u2019s card for it reads \u201cFade and flourish, forever growing\u201d.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/TOMBSTONE/Evergrow-103666.html" },
  },
  "tombstone:03": {
    top: ["Mint", "Thyme", "Pepper", "Turpentine"],
    mid: ["Myrrh", "Olibanum", "Jasmine"],
    base: ["Patchouli", "Tonka Beans", "Sandalwood"],
    source: { name: "TOMBSTONE", url: "https://tombstonefragrances.shop/products/no-need-to-come-by-1" },
  },
  "tombstone:04": {
    say: "The house\u2019s own notes",
    top: ["Mint", "Honey", "Neroli"],
    mid: ["Jasmine", "Lily of the Valley", "Orris"],
    note: "The house names no materials for the base; it says only that it is \u201cearthy and woody elements, marking a warm return to the earth\u201d. The full list below is the fallback\u2019s. The perfumer, Yenchi Lin, pictures her own funeral with a light spirit and a joyful air.",
    source: { name: "TOMBSTONE", url: "https://tombstonefragrances.shop/products/sing-at-my-funeral-1" },
    also: {
      say: "Interpreted notes",
      top: ["Honey", "Neroli", "Mint"],
      mid: ["Lily", "Jasmine", "Orris"],
      base: ["Amber", "Cedarwood", "Vetiver"],
      source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/TOMBSTONE/Sing-at-My-Funeral-103669.html" },
    },
  },
  "tombstone:05": {
    top: ["Willow Bark", "Apricot"],
    mid: ["Moldy Cedarwood", "Nutmeg"],
    base: ["Dead Water"],
    note: "Xiao Lan\u2019s, \u201cto illustrate the sweet coffin she wishes to return to\u201d \u2014 dusty and rotten-woody, with nutmeg running from top to bottom.",
    source: { name: "TOMBSTONE", url: "https://tombstonefragrances.shop/products/product_96dfccf6-9558-1964-5d89-1505be7abf53" },
  },

  // ============================================================
  // QIMU & MUSICIANS — houses/qimu-and-musicians.html
  //
  // Vocal's list is off the house's own page. The other three have none
  // that could be CHECKED: the house's site could not be read from here,
  // no fallback carries them, and the one list that turned up for
  // Drummer came from a search summary that the page it named did not
  // bear out. A list nobody can check is the one thing this file does
  // not carry, so they say so and name the house's page, which is where
  // the lists will be.
  // ============================================================
  "qimu:01": {
    missing: "No information as of yet.",
    note: "Nothing that could be checked names its materials.",
    source: { name: "Qimu & Musicians", url: "https://qimunmusicians.com/collections/all" },
  },
  "qimu:02": {
    top: ["Mint", "Lily of the Valley"],
    mid: ["Saffron", "Violet"],
    base: ["Orris", "Musk"],
    source: { name: "Qimu & Musicians", url: "https://qimunmusicians.com/products/vocal" },
  },
  "qimu:03": {
    missing: "No information as of yet.",
    note: "Nothing that could be checked names its materials.",
    source: { name: "Qimu & Musicians", url: "https://qimunmusicians.com/collections/all" },
  },
  "qimu:04": {
    missing: "No information as of yet.",
    note: "Nothing that could be checked names its materials.",
    source: { name: "Qimu & Musicians", url: "https://qimunmusicians.com/collections/all" },
  },

};
