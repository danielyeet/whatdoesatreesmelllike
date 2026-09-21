// ============================================================
// THE NOTES — one entry per fragrance
//
// What `notes.js` reads. Nothing here is written in a page's markup:
// there are ninety-odd fragrances on this site and the markup is the
// owner's to edit, so the notes live in one file that can be filled in
// over several rounds without touching a single page.
//
// A KEY is the page's own `window.HOUSE_NOTES` and the part's number,
// joined by a colon — "pineward:01", "individual:06". The number is
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
  // THE INDIVIDUAL FRAGRANCES — works/individual-fragrances.html
  // The ones that belong to no house on the Houses view.
  // ============================================================
  "individual:01": {
    top: ["Balsamic Vinegar", "Cherry", "Citrus", "Milk"],
    mid: ["Cinnamon", "Cloves", "Pepper"],
    base: ["Woody Notes", "Caramel", "Smoke", "Oak"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Lussur/CV99-128462.html" },
  },

  "individual:02": {
    flat: ["Chrysanthemum", "Green Notes", "Violet", "Soil Tincture", "Incense", "Plum Tree"],
    note: "The 2015 Limited Edition is listed with a pyramid; this is the 2011 original, which is not.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Serge-Lutens/De-Profundis-13274.html" },
  },

  "individual:03": {
    flat: ["Basil", "Beeswax", "Caraway", "Cashmeran", "Castoreum", "Cedarwood",
           "Chamomile", "Clary Sage", "Cloves", "Costus", "Cypress",
           "Cypriol Oil or Nagarmotha", "Elemi", "Fir", "Galbanum", "Goat Hair",
           "Guaiac Wood", "Incense", "Jasmine", "Labdanum", "Lavender", "Marjoram",
           "Mushroom", "Musk", "Nutmeg", "Opoponax", "Oregano", "Patchouli", "Pepper",
           "Rosemary", "Saffron", "Sage", "Sandalwood", "Spruce", "Styrax", "Thyme",
           "Tobacco", "Vetiver", "Wormwood"],
    note: "Forty notes and no division. Prin Lomros says the composition uses over a hundred ingredients.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Prissana/Haxan-51725.html" },
  },

  "individual:04": {
    flat: ["Tobacco", "Tobacco Leaf", "Honey", "Smoke", "Plum", "Amber",
           "Oriental Notes", "White Tobacco", "Peach", "Citruses"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Dior/Tobacolor-65551.html" },
  },

  // "individual:05" is the one the owner's list skipped — they numbered
  // 1, 2, 3, 4, 6, 7 and then called them "the seven". The slot is kept
  // so their numbering is theirs; the fragrance is still to come.

  "individual:06": {
    top: ["Raspberry", "Apple", "Violet", "Orange Blossom"],
    mid: ["Rose", "Jasmine", "Iris"],
    base: ["Cedar", "Cypress", "Amber", "Pine Tree"],
    note: "The 2017 eau de parfum. The 2024 Extrait is a different composition.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Ramon-Monegal/Flamenco-44233.html" },
  },

  "individual:07": {
    top: ["Lemon", "Orange", "Tangerine", "Ginger", "Pepper"],
    mid: ["Sea Notes", "Tiare Flower", "Pine Tree", "Mimosa", "Vetiver"],
    base: ["Sea Salt", "White Musk", "Amber"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Mancera/French-Riviera-74636.html" },
  },

  // ============================================================
  // ALMOST HUMAN — works/almost-human.html
  //
  // NOT ONE OF THE FIVE HAS A PYRAMID, and that is the house rather
  // than a gap in the research: it presents its fragrances as an
  // "olfactory landscape" instead of a top/mid/base, and Fragrantica
  // lists them the same way. Recording them as pyramids would be
  // inventing a structure the house has gone out of its way not to use.
  // ============================================================
  "almost-human:01": {
    flat: ["Woody Notes", "Smoke", "Spices", "Citrus"],
    note: "The house sets its fragrances out as an olfactory landscape rather than a pyramid.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Almost-Human/Burning-Bridges-122262.html" },
  },
  "almost-human:02": {
    flat: ["Ozonic Notes", "Skin", "Amber"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Almost-Human/Dear-Future-122266.html" },
  },
  "almost-human:03": {
    flat: ["Sand", "Resin", "Solar Notes", "Dust", "Dry Wood", "Rose"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Almost-Human/Desert-Hope-122264.html" },
  },
  "almost-human:04": {
    flat: ["Resins", "Ash", "Smoke", "Animal Notes", "Herbal Notes", "Earthy Notes"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Almost-Human/Ritual-Code-122265.html" },
  },
  "almost-human:05": {
    flat: ["Soil Tincture", "Rain Notes", "Concrete", "Green Accord", "Airy Note", "Solar Notes"],
    note: "The house's own account of it is wet concrete, green mist, warm soil steam, fading sunlight and quiet air — an olfactory landscape rather than a pyramid.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Almost-Human/Silent-Rain-122263.html" },
  },

  // ============================================================
  // ADAR — works/adar.html
  //
  // This house DOES divide, and its own site is where the division is
  // — which is the source the owner asked for first.
  // ============================================================
  "adar:01": {
    top: ["Fig Leaf", "Icy Ginger", "Ozone"],
    mid: ["Saffron", "Leathery Osmanthus", "Mineral Accords"],
    base: ["Mineral Ambers", "Haitian Vetiver", "Smoky Resins", "Ambergris"],
    source: { name: "ADAR Perfumes", url: "https://adarperfumes.com/products/amber-zero-essence-of-dephts" },
  },
  "adar:03": {
    top: ["Japanese Honeysuckle", "Carob Pods", "Sea Salt"],
    mid: ["Black Honey", "Tobacco Leaf", "Candle Wax"],
    base: ["Amber Oud", "Burnt Almond", "Petrified Driftwood"],
    source: { name: "ADAR Perfumes", url: "https://adarperfumes.com/products/incantu-drops-of-styx" },
  },
  "adar:06": {
    flat: ["Musk", "Aquatic Notes", "Coumarin", "Vanilla", "Heliotrope", "Citruses", "Orange Blossom"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/ADAR/Alta-Luna-115895.html" },
  },

  "adar:05": {
    top: ["Banana", "Mint", "Saffron"],
    mid: ["Tuberose", "Jasmine", "Ylang Ylang"],
    base: ["Tobacco", "Incense", "Tonka Bean", "Civet"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/ADAR/Alpha-11-115893.html" },
  },
  "adar:07": {
    top: ["Pink Pepper", "Yuzu", "Quince", "Absinthe"],
    mid: ["Saffron", "Green Tea Flowers", "Black Cherry", "Murumuru Butter", "Myrrh"],
    base: ["Tonka Bean", "Maninka"],
    source: { name: "ADAR Perfumes", url: "https://adarperfumes.com/products/adhd-neuro-elixir" },
  },
  "adar:11": {
    flat: ["Dark Chocolate", "Birch Tar", "Clary Sage", "Honey Absolute", "Ambergris"],
    note: "The house names these in its own description of the fragrance; it publishes no pyramid for it.",
    source: { name: "ADAR Perfumes", url: "https://adarperfumes.com/" },
  },

  // ============================================================
  // GRANDE PARFUMS — works/grande-parfums.html
  // ============================================================
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
  // PINEWARD — works/pineward.html
  //
  // THIS HOUSE PUBLISHES NO PYRAMIDS AT ALL. Its own Master Scent List
  // and Fragrantica both give one undivided list per fragrance, so
  // every entry below is flat. That is the house, not a gap in the
  // research — setting any of these out as Top / Mid / Base would be
  // three claims nobody has made.
  // ============================================================
  "pineward:01": {
    flat: ["Poplar Bud", "Pine Needles", "Ambrette", "Crushed Leaves", "Cedar"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Bindebole-66467.html" },
  },
  "pineward:02": {
    flat: ["Pine Needles", "Mint", "Cedar", "Resins", "Moss"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Boreal-64599.html" },
  },
  "pineward:03": {
    flat: ["Larch", "Resin", "Agarwood (Oud)", "Hemlock", "Sandalwood", "Cherimoya"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Brokilaen-75637.html" },
  },
  "pineward:04": {
    flat: ["Oak", "Smoke", "Cedar", "Vanilla", "Pine Needles"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Cotswold-75633.html" },
  },
  "pineward:05": {
    flat: ["Fir", "Leather", "Myrrh", "Smoke", "Patchouli", "Pine Needles", "Oolong Tea", "Opoponax", "Oakmoss"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Eldritch-72485.html" },
  },
  "pineward:07": {
    flat: ["Dried Rose", "Leather", "Smoke", "Incense", "Oud", "Mushroom", "Myrrh", "Tobacco", "Blood", "Cedar"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Funerie-83384.html" },
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
    flat: ["Wool", "Honey", "Lavender", "Amber", "Sweet Grass", "Raspberry", "Beeswax", "Brown Sugar"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Bucolic-99956.html" },
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
    flat: ["Pine", "Silver Fir", "Carnation", "Oakmoss", "Hay", "Patchouli", "Lavender", "Chamomile", "Juniper", "Geranium", "Tobacco", "Bergamot", "Sandalwood", "Amber", "Vetiver"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Nocturnis-83390.html" },
  },
  "pineward:11": {
    flat: ["Soil Tincture", "Pine Needles", "Juniper", "Vetiver", "Myrtle"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Oxylus-83380.html" },
  },
  "pineward:17": {
    flat: ["Hay", "Raisin", "Bread", "Acorn", "Vanilla", "Tonka", "Nutmeg", "Grass", "Hazelnut Cocoa Spread", "Oakmoss", "Himalayan Nard (Jatamansi)", "Cardamom"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Hayride-83387.html" },
  },
  "pineward:18": {
    flat: ["Honey", "Hay", "Apricot", "Wheat", "Beeswax", "Grains", "Blackberry", "Bran", "Oat", "Propolis", "Rose Jam", "Tea", "Bourbon Vetiver", "Oakmoss"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Pastoral-83391.html" },
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
    flat: ["Ginger", "Cinnamon", "Cloves", "Nutmeg", "Wheat Absolute", "Molasses Distillate", "Brown Sugar", "Black Walnut", "Milk Accord", "Butter", "Vanilla", "Icing"],
    note: "The 2025 Icing Edition, which is what the house lists.",
    source: { name: "Pineward", url: "https://www.pinewardperfume.com/shop/p/gingerbread" },
  },

  "pineward:24": {
    flat: ["Cloves", "Rum", "Cinnamon", "Agarwood (Oud)", "Hazelnut"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Revelries-75631.html" },
  },
  "pineward:26": {
    flat: ["Sea Water", "Seaweed", "Cypress", "Juniper", "Eucalyptus", "Juniper Berries", "Mushroom", "Ambergris", "Moss", "Water Pepper", "Sandalwood"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Coastal-Veil-83189.html" },
  },
  "pineward:27": {
    flat: ["Neroli", "Ginger", "Bergamot", "Rosemary", "Blood Orange", "Oakmoss", "Himalayan Cedar", "Leather"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Gingermoss-83376.html" },
  },
  "pineward:28": {
    flat: ["Subalpine Fir", "Bergamot", "Black Pepper", "Cedar Leaf (Thuja)", "Sandalwood", "Vetiver", "Ambrette", "Moss"],
    source: { name: "Pineward, Master Scent List", url: "https://pinewardperfume.com/pages/master-scent-list" },
  },
  "pineward:29": {
    flat: ["Green Apple", "Sandalwood", "Benzoin", "Cedar", "Patchouli"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Akero-99961.html" },
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
    flat: ["Pine", "Fir", "Citron", "Vetiver", "Musk", "White Tobacco"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Greymist-83374.html" },
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
    flat: ["Cedarmoss", "Oakmoss", "Moss", "Lime", "Green Tea", "Lemon Verbena", "Ivy", "Peppermint", "Cypress", "Pine", "Cedarwood", "Water Lily"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Ivymoss-83377.html" },
  },

  "pineward:41": {
    flat: ["Tomato Leaf", "Grass", "Orange Blossom", "Wildflowers", "Oakmoss", "Wheat", "Balsam Fir"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Meadowmoss-83378.html" },
  },
  "pineward:42": {
    flat: ["Chocolate", "Peppermint", "Patchouli", "Vanilla", "Spices", "Resins", "Malt", "Cedar"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Mint-Cocoa-99948.html" },
  },
  "pineward:44": {
    flat: ["Ponderosa Resin", "Ponderosa Needles", "Cedar", "Vanilla", "Strawberry", "Cinnamon", "Butterscotch", "Beeswax", "Raisin Cookies"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Ponderosa-83393.html" },
  },
  "pineward:45": {
    flat: ["Parchment", "Paper", "Leather", "Tobacco", "Black Tea", "Sandalwood", "Cedar", "Orris Root", "Rice", "Ambrette", "Coffee", "Oakmoss", "Nagarmotha"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Tome-115784.html" },
  },
  "pineward:46": {
    flat: ["Tobacco", "Lapsang Souchong Tea", "Molasses", "Honey", "Raisin"],
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Treacle-71217.html" },
  },
  "pineward:47": {
    flat: ["Labdanum", "Vanilla", "Clove", "Ambergris", "Fir", "Cypress"],
    note: "Fragrantica lists a 2021 and a 2025 Velvetine; these are the 2021.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Velvetine-75632.html" },
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
    flat: ["Moss", "Silver Fir", "Lichen", "Pine Needles"],
    note: "Fanghorn II, not the 2020 Fanghorn, which is a different fragrance with its own notes.",
    source: { name: "Fragrantica", url: "https://www.fragrantica.com/perfume/Pineward-Perfumes/Fanghorn-II-126423.html" },
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

};
