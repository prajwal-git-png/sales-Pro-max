// Complete ISP Handbook Catalog for Bajaj Electricals & Morphy Richards (Reliance Digital)
// Extracted from official ISP Quick Reference Handbook FY 2026-27

export interface HandbookProduct {
  name: string;
  category: string;
  brand: 'BAJAJ' | 'MORPHY RICHARDS';
  bajajCode: string;
  articleCode: string;
  description: string;
  power?: string;
  jars?: string;
  capacity?: string;
  warranty?: string;
  color?: string;
  keyFeatures: string[];
}

export const ISP_HANDBOOK_PRODUCTS: HandbookProduct[] = [
  // SECTION 01: Mixer Grinders & Food Processors
  {
    name: 'Style Mix',
    category: 'Mixer Grinders & Food Processors',
    brand: 'BAJAJ',
    bajajCode: '410650',
    articleCode: '494622897',
    description: 'BAJAJ MIXER GRINDER 5J 1000W STYLE MIX',
    power: '1000W',
    jars: '5 Jars',
    warranty: '2Y / 5Y Motor',
    color: 'Sahara Beige',
    keyFeatures: [
      'Premium design with metallic finish',
      'Low noise & high performance, cool-touch jar cladding',
      'Continuous 10kg dosa batter grinding',
      '2.2L multi-purpose jar with gear technology',
      '1.5L juicer jar with fruit filter & food pusher',
      '5 key functions: slicing, chopping, grating, kneading, citrus juicing'
    ]
  },
  {
    name: 'GX 18 Pro',
    category: 'Mixer Grinders & Food Processors',
    brand: 'BAJAJ',
    bajajCode: '410645',
    articleCode: '494622898',
    description: 'BAJAJ GX18 PRO 3J 500W',
    power: '500W',
    jars: '3 Jars',
    warranty: '2 Years',
    color: 'White/Purple',
    keyFeatures: [
      'Powerful 500W Titan Motor',
      'DuraCut® blades with lifetime warranty',
      '2-in-1 function blade in dry jar',
      '3 Stainless Steel jars — 1.2L / 0.8L / 0.4L',
      '2 Years product warranty'
    ]
  },
  {
    name: 'Kompact',
    category: 'Mixer Grinders & Food Processors',
    brand: 'BAJAJ',
    bajajCode: '410656',
    articleCode: '494622900',
    description: 'BAJAJ MIXER GRINDER 3J 500W KOMPACT',
    power: '500W',
    jars: '3 Jars',
    warranty: '2 Years',
    color: 'White/Grey',
    keyFeatures: [
      'Powerful 500W Titan Motor — dual colour body',
      'DuraCut® blades with lifetime warranty',
      '2-in-1 function blade in dry jar',
      '3 Stainless Steel jars — 1.2L / 0.8L / 0.4L (large capacity)',
      '2 Years product warranty'
    ]
  },
  {
    name: 'Gracio',
    category: 'Mixer Grinders & Food Processors',
    brand: 'BAJAJ',
    bajajCode: '410588',
    articleCode: '494226658',
    description: 'BAJAJ MIXER 500W 3JARS GRACIO LILAC',
    power: '500W',
    jars: '3 Jars',
    warranty: '2Y / 5Y Motor',
    color: 'White/Lilac',
    keyFeatures: [
      'Dual colour body — rich looking finish',
      'Powerful 500W Titan Motor with 5-year motor warranty',
      'DuraCut® blades with lifetime warranty',
      '3 Stainless Steel jars — 1.2L / 0.8L / 0.4L (large capacity)'
    ]
  },
  {
    name: 'Virtue',
    category: 'Mixer Grinders & Food Processors',
    brand: 'BAJAJ',
    bajajCode: '410595',
    articleCode: '494226661',
    description: 'BAJAJ MIXER 750W 4JARS VIRTUE BLACK',
    power: '750W',
    jars: '4 Jars',
    warranty: '2Y / 5Y Motor',
    color: 'Black/Copper',
    keyFeatures: [
      'Powerful 750W Titan Motor, dual colour body',
      'DuraCut® blades — lifetime warranty',
      'Cord winder built into the base',
      '2-in-1 function blade in dry jar',
      '1.5L blender jar with fruit filter',
      '3 Stainless Steel jars — 1.5L / 1.0L / 0.4L'
    ]
  },
  {
    name: 'Evoque',
    category: 'Mixer Grinders & Food Processors',
    brand: 'BAJAJ',
    bajajCode: '410630',
    articleCode: '494459717',
    description: 'BAJAJ MG 1000W 4J EVOQUE JET BLK',
    power: '1000W',
    jars: '4 Jars',
    warranty: '2Y / 5Y Motor',
    color: 'Black/Chrome',
    keyFeatures: [
      'Powerful 1000W Titan Motor',
      'Military-grade stainless steel jars with 5-year warranty',
      'Military-grade handles & metal strips on SS jars',
      'Military-grade transparent dome lids on all SS jars',
      'DuraCut® blades with lifetime warranty',
      '1.5L juicer jar with fruit filter · dry grinding in 60 seconds'
    ]
  },
  {
    name: 'GrindPro Maxx',
    category: 'Mixer Grinders & Food Processors',
    brand: 'MORPHY RICHARDS',
    bajajCode: '640137',
    articleCode: '494338633',
    description: 'MR MIXER 1000W 4JARS GRINDPRO MAXX',
    power: '1000W',
    jars: '4 Jars',
    warranty: '2Y / 5Y Motor',
    color: 'Black',
    keyFeatures: [
      '1000W Copper Motor running at 20,000 RPM',
      'Aluminium jar bases',
      'Grinds tough ingredients like turmeric in just 60 secs',
      'Grinds idli/dosa batter effortlessly',
      'Taste Maxx Mode — 50% extra flavour retention',
      '0.2L spice jar for fresh masala & ginger-garlic daily'
    ]
  },
  {
    name: 'Tresta Plus',
    category: 'Mixer Grinders & Food Processors',
    brand: 'MORPHY RICHARDS',
    bajajCode: '640148',
    articleCode: '494338875',
    description: 'MR MIXER GRINDER TRESTA 500W',
    power: '500W',
    warranty: '2 Years',
    color: 'White & Blue',
    keyFeatures: [
      '500W Ultron Maxx powerful motor — 18,000 RPM',
      'Grinds & blends toughest ingredients effortlessly',
      'High-quality couplers and gaskets',
      'Motor rated for 30 min continuous grinding',
      'Overload protection'
    ]
  },
  {
    name: 'TetraGrind',
    category: 'Mixer Grinders & Food Processors',
    brand: 'MORPHY RICHARDS',
    bajajCode: '640149',
    articleCode: '494338876',
    description: 'MR MIXER GRINDER TETRAGRIND 750W',
    power: '750W',
    jars: '3 Jars',
    warranty: '2 Years',
    color: 'Black & Grey',
    keyFeatures: [
      '750W powerful motor — grinds & blends toughest ingredients',
      'Shock-proof and insulated body',
      'High-quality couplers and gaskets',
      '3-speed motor with incher function',
      '3 high-grade stainless steel jars — 1.5L / 1L / 0.4L',
      'Overload protection · 20,000 RPM'
    ]
  },

  // SECTION 02: Electric Kettle
  {
    name: 'KTX 1.5 DLX',
    category: 'Electric Kettle',
    brand: 'BAJAJ',
    bajajCode: '670106',
    articleCode: '491281340',
    description: 'BAJAJ ELECTRIC KETTLE KTX 1.5 DLX',
    capacity: '1.5L',
    warranty: '2 Years',
    keyFeatures: [
      'Stainless steel body',
      'Auto cut-off feature — prevents overheating & dry boiling',
      '360-degree cordless operation',
      'Cord storage / cord winder',
      'Wide mouth for easy cleaning',
      'Neon On/Off switch with auto cut-off indicator lights'
    ]
  },

  // SECTION 03: Hand Blenders
  {
    name: 'HB 21',
    category: 'Hand Blenders',
    brand: 'BAJAJ',
    bajajCode: '410535',
    articleCode: '492573221',
    description: 'BAJAJ HAND BLENDER HB 21 BK 300W',
    power: '300W',
    warranty: '2 Years',
    keyFeatures: [
      '300W silent DC motor — durable, higher rating',
      'Click-Fit locking for ease of use',
      'Ergonomically designed soft switches',
      'Penta-flow breaker system reduces time & effort',
      'Detachable stainless steel blender stem for easy cleaning',
      'Wall mounting hanger available'
    ]
  },
  {
    name: 'HB 22',
    category: 'Hand Blenders',
    brand: 'BAJAJ',
    bajajCode: '410536',
    articleCode: '492573222',
    description: 'BAJAJ HAND BLENDER HB 22 BL 300W',
    power: '300W',
    warranty: '2Y + Home Service',
    keyFeatures: [
      '300W silent DC motor — durable, higher rating',
      'Click-Fit locking for ease of use',
      'Ergonomically designed soft switches',
      'Penta-flow breaker system reduces time & effort',
      'Detachable SS blender stem + additional chopping bowl',
      'Wall mounting hanger available'
    ]
  },
  {
    name: 'Juvel',
    category: 'Hand Blenders',
    brand: 'BAJAJ',
    bajajCode: '410537',
    articleCode: '491903207',
    description: 'Bajaj Hand Blender Juvel 300W',
    power: '300W',
    warranty: '2Y + Home Services',
    keyFeatures: [
      'Prism body design — rich looking',
      '300W silent DC motor — durable, higher rating',
      'Fixed stainless steel blender stem, multi-purpose blade',
      'ISI approved for reliability & safety',
      'Smooth push button switch — convenient & safe'
    ]
  },
  {
    name: 'Pronto Plus',
    category: 'Hand Blenders',
    brand: 'MORPHY RICHARDS',
    bajajCode: '640133',
    articleCode: '494226825',
    description: 'MORPHY HAND BLENDER Pronto Plus 300W',
    power: '300W',
    warranty: '2 Years',
    color: 'Grey',
    keyFeatures: [
      '300W DC motor for powerful & silent operation',
      'Multi-function stainless steel blades',
      'Detachable stainless steel shaft',
      'Chopper attachment — 700ml capacity',
      'Easy locking system & ergonomic design',
      'Speed 11,000 RPM · wall hanging provision'
    ]
  },
  {
    name: 'Pronto Ultra',
    category: 'Hand Blenders',
    brand: 'MORPHY RICHARDS',
    bajajCode: '640099',
    articleCode: '491581689',
    description: 'MR HAND BLENDER PRONTO ULTRA',
    power: '300W',
    warranty: '2 Years',
    color: 'Blue',
    keyFeatures: [
      '300W DC motor — powerful, silent & durable',
      'Multi-function stainless steel blades',
      'Detachable stainless steel shaft — easy clean, hygienic',
      'Easy locking system & ergonomic design',
      'Wall hanging provision · Speed 11,000 RPM'
    ]
  },

  // SECTION 04: Cooktops (Induction & Infrared)
  {
    name: 'ICX 140TS',
    category: 'Cooktops',
    brand: 'BAJAJ',
    bajajCode: '740308',
    articleCode: '494459702',
    description: 'BAJAJ INDUCTION COOKTOP 1400W ICX 140TS',
    power: '1400W',
    warranty: '1Y + Home Service',
    keyFeatures: [
      '1400W induction stove for faster cooking',
      'Voltage Pro — protection from voltage fluctuations',
      '7 preset menus for regular recipe making',
      'Digital display with self-diagnosing error codes',
      'Adjustable time & temperature for customised use',
      'Pan sensor'
    ]
  },
  {
    name: 'ICX 190FS',
    category: 'Cooktops',
    brand: 'BAJAJ',
    bajajCode: '740314',
    articleCode: '494459699',
    description: 'BAJAJ INDUCTION COOKTOP 1900W ICX 190FS',
    power: '1900W',
    warranty: '1Y + Home Service',
    keyFeatures: [
      '1900W full-polish-top induction stove',
      'Feather touch control — premium aesthetic appeal',
      '9 preset menus for ease of use',
      'Digital display with error code communicator',
      'Keep-warm function · adjustable time & temperature',
      'Pan sensor & voltage protection'
    ]
  },
  {
    name: 'IRX 220F',
    category: 'Cooktops',
    brand: 'BAJAJ',
    bajajCode: '740311',
    articleCode: '494459697',
    description: 'BAJAJ INFRARED COOKTOP 2200W IRX 220F',
    power: '2200W',
    warranty: '1Y + Home Service',
    keyFeatures: [
      'Suitable for all utensil types, same as used on gas stoves',
      '2200W infrared stove — very fast cooking',
      'Feather touch controls, glass top for easy cleaning',
      'Lightweight, portable, comes with grilling SS rack',
      '45 minutes on, continues after 10-minute rest',
      'Max suggested weight 6kg incl. vessel'
    ]
  },

  // SECTION 05: Toasters & Sandwich Makers
  {
    name: 'ATX 4',
    category: 'Toasters & Sandwich Makers',
    brand: 'BAJAJ',
    bajajCode: '270030',
    articleCode: '490614124',
    description: 'BAJAJ POP UP TOASTER ATX 4',
    power: '750W',
    capacity: '2 Slice',
    warranty: '2 Years',
    color: 'White',
    keyFeatures: [
      '6 levels of browning control, dedicated reheat selection',
      'Cool touch body for added safety & convenience',
      'Mid-cycle cancel function',
      'Slide-out crumb tray for easy cleaning',
      'Anti-skid feet, dust protection cover'
    ]
  },
  {
    name: 'SWX 6',
    category: 'Toasters & Sandwich Makers',
    brand: 'BAJAJ',
    bajajCode: '270112',
    articleCode: '494399374',
    description: 'BAJAJ SANDWICH MAKR SWX6 GRILL',
    power: '800W',
    capacity: '2 Slice',
    warranty: '2 Years',
    color: 'Black',
    keyFeatures: [
      '800W power for perfect sandwiches',
      'Non-stick coated grill plates — fuss-free prep & cleaning',
      'Compact design for easy storage, cord winder',
      'Buckle clip handle for easy usage'
    ]
  },
  {
    name: 'SWX 3',
    category: 'Toasters & Sandwich Makers',
    brand: 'BAJAJ',
    bajajCode: '270105',
    articleCode: '492284113',
    description: 'BAJAJ SANDWICH MAKER SWX3 DLX 800W',
    power: '800W',
    capacity: '2 Slice',
    warranty: '2 Years',
    color: 'Black',
    keyFeatures: [
      '800W power for perfect sandwiches',
      'Non-stick coated grill plates — fuss-free prep & cleaning',
      'Compact design for easy storage, cord winder',
      'Buckle clip handle, neon indicator',
      'Stands upright for compact storage'
    ]
  },

  // SECTION 06: Water Heaters
  {
    name: 'Aerono',
    category: 'Water Heaters',
    brand: 'BAJAJ',
    bajajCode: '151045',
    articleCode: '494426479',
    description: 'BAJAJ INSTANT GEYSER AERONO 3L 3KW',
    capacity: '3L',
    power: '3kW',
    warranty: '5/2/2Y',
    keyFeatures: [
      'Shock-resistant & rust-proof engineering thermoplastic body',
      'Multiple safety system, LED indicators',
      'Tank withstands pressure up to 6 bar',
      'Suitable for high-rise buildings',
      '3kW heating element'
    ]
  },
  {
    name: 'New Shakti Pro 10L',
    category: 'Water Heaters',
    brand: 'BAJAJ',
    bajajCode: '151088',
    articleCode: '494510703',
    description: 'BAJAJ STORAGE GEYSER NEW SHAKTI PRO 10L',
    capacity: '10L',
    warranty: 'Tank 7Y · Element 6Y',
    keyFeatures: [
      'Precoated metal body — rustproof, no colour fade',
      'Child safety mode — heat cutoff at 45°C',
      'Bajaj Voltage Pro™ — 4.5kV surge protection for element & thermostat',
      'PUF insulation for longer heat retention',
      'Marine-grade glass-lined tank — 7-year warranty',
      'Swirl flow technology — 20% more hot water · magnesium anode rod'
    ]
  },
  {
    name: 'New Shakti Pro 15L',
    category: 'Water Heaters',
    brand: 'BAJAJ',
    bajajCode: '151089',
    articleCode: '494510704',
    description: 'BAJAJ STORAGE GEYSER NEW SHAKTI PRO 15L',
    capacity: '15L',
    warranty: 'Tank 7Y · Element 6Y',
    keyFeatures: [
      'Precoated metal body — rustproof, no colour fade',
      'Child safety mode — heat cutoff at 45°C',
      'Bajaj Voltage Pro™ — 4.5kV surge protection for element & thermostat',
      'PUF insulation for longer heat retention',
      'Marine-grade glass-lined tank — 7-year warranty',
      'Swirl flow technology — 20% more hot water · magnesium anode rod'
    ]
  },
  {
    name: 'New Shakti Pro 25L',
    category: 'Water Heaters',
    brand: 'BAJAJ',
    bajajCode: '151090',
    articleCode: '494510705',
    description: 'BAJAJ STORAGE GEYSER NEW SHAKTI PRO 25L',
    capacity: '25L',
    warranty: 'Tank 7Y · Element 6Y',
    keyFeatures: [
      'Precoated metal body — rustproof, no colour fade',
      'Child safety mode — heat cutoff at 45°C',
      'Bajaj Voltage Pro™ — 4.5kV surge protection for element & thermostat',
      'PUF insulation for longer heat retention',
      'Marine-grade glass-lined tank — 7-year warranty',
      'Swirl flow technology — 20% more hot water · magnesium anode rod'
    ]
  },
  {
    name: 'Pentacle 10L',
    category: 'Water Heaters',
    brand: 'BAJAJ',
    bajajCode: '151051',
    articleCode: '494459605',
    description: 'BAJAJ STORAGE GEYSER PENTACLE 10L',
    capacity: '10L',
    power: '2kW',
    warranty: 'Tank 7Y · Element 6Y',
    keyFeatures: [
      'Shock-resistant & rust-proof engineering thermoplastic body',
      'Multiple safety system, child safety mode',
      'Bajaj Voltage Pro™ — 4.5kV surge protection',
      'Tank withstands pressure up to 8 bar — suitable for high-rise',
      'Swirl flow technology — 20% more hot water',
      'PUF insulation · magnesium anode rod prevents corrosion'
    ]
  },
  {
    name: 'Pentacle 15L',
    category: 'Water Heaters',
    brand: 'BAJAJ',
    bajajCode: '151052',
    articleCode: '494426477',
    description: 'BAJAJ STORAGE GEYSER PENTACLE 15L',
    capacity: '15L',
    power: '2kW',
    warranty: 'Tank 7Y · Element 6Y',
    keyFeatures: [
      'Shock-resistant & rust-proof engineering thermoplastic body',
      'Multiple safety system, child safety mode',
      'Bajaj Voltage Pro™ — 4.5kV surge protection',
      'Tank withstands pressure up to 8 bar — suitable for high-rise',
      'Swirl flow technology — 20% more hot water',
      'PUF insulation · magnesium anode rod prevents corrosion'
    ]
  },
  {
    name: 'Pentacle 25L',
    category: 'Water Heaters',
    brand: 'BAJAJ',
    bajajCode: '151053',
    articleCode: '494426478',
    description: 'BAJAJ STORAGE GEYSER PENTACLE 25L',
    capacity: '25L',
    power: '2kW',
    warranty: 'Tank 7Y · Element 6Y',
    keyFeatures: [
      'Shock-resistant & rust-proof engineering thermoplastic body',
      'Multiple safety system, child safety mode',
      'Bajaj Voltage Pro™ — 4.5kV surge protection',
      'Tank withstands pressure up to 8 bar — suitable for high-rise',
      'Swirl flow technology — 20% more hot water',
      'PUF insulation · magnesium anode rod prevents corrosion'
    ]
  },

  // SECTION 07: Air Fryers
  {
    name: 'Air Fryer 5L Digital',
    category: 'Air Fryers',
    brand: 'MORPHY RICHARDS',
    bajajCode: '510056',
    articleCode: '494226706',
    description: 'MR AIR FRYER 5L DIGITAL BL',
    power: '1500W',
    capacity: '5L',
    warranty: '2 Years',
    color: 'Black',
    keyFeatures: [
      'Large digital panel, feather touch control',
      '8 preset menus — cook without worrying about settings',
      'Adjustable temperature control, even mid-preset',
      'Dual fan technology — efficient 360° heat circulation',
      'Non-stick coated basket & accessories',
      'Cool touch handle for safe use'
    ]
  },
  {
    name: '5L Crisp Pro Digital',
    category: 'Air Fryers',
    brand: 'MORPHY RICHARDS',
    bajajCode: '510067',
    articleCode: '494509785',
    description: 'MR AIR FRYER 5L DIGITAL CRISP PRO BLUE',
    power: '1500W',
    capacity: '5L',
    warranty: '2 Years',
    color: 'Dark Navy Blue',
    keyFeatures: [
      'Digital panel, feather touch control for easy operation',
      '8 preset menus — cook without worrying about settings',
      'Adjustable temperature control, even mid-preset',
      'Dual fan technology — efficient 360° heat circulation',
      'Non-stick coated basket & accessories',
      'Cool touch handle for safe use'
    ]
  },

  // SECTION 08: Ovens & Grillers (OTG)
  {
    name: 'OTG 20R',
    category: 'Ovens & Grillers (OTG)',
    brand: 'MORPHY RICHARDS',
    bajajCode: '510062',
    articleCode: '494404939',
    description: 'MORPHY RICHARDS OTG 20R',
    power: '1400W',
    capacity: '20L',
    warranty: '2 Years',
    color: 'Black & Silver',
    keyFeatures: [
      '20L OTG — budgeted product',
      'Easy knob control',
      'Rotisserie in 20L for uniform roasting',
      'Temperature timer with 6 heating mode controls'
    ]
  },
  {
    name: '29RCAD',
    category: 'Ovens & Grillers (OTG)',
    brand: 'MORPHY RICHARDS',
    bajajCode: '510057',
    articleCode: '494338634',
    description: 'MR OTG 29 RCAD DIGI',
    power: '2000W',
    capacity: '29L',
    warranty: '2 Years',
    keyFeatures: [
      '13 preset menus with digital display',
      '3-in-1 product: built-in air fryer',
      'Built-in dehydrator for sun-dry effects',
      'Convection & rotisserie · motorized rotisserie for tandoori grilling',
      '2-layered door glass, cool touch handle',
      'Powder coated body with black finish'
    ]
  },
  {
    name: '60RCSS',
    category: 'Ovens & Grillers (OTG)',
    brand: 'MORPHY RICHARDS',
    bajajCode: '510035',
    articleCode: '492911243',
    description: 'Morphy Richards OTG 60 RCSS',
    power: '2000W',
    capacity: '60L',
    warranty: '2 Years',
    keyFeatures: [
      'No.1 brand in the category',
      '2000W, 60-minute timer',
      '60L — largest OTG in the industry',
      'Mirror finish door, stainless steel body',
      'Temperature selection up to max 230°C',
      'Convection & rotisserie for fast, perfect cooking · inner cavity light'
    ]
  },

  // SECTION 09: Microwave Oven
  {
    name: '20MWS Solo',
    category: 'Microwave Oven',
    brand: 'MORPHY RICHARDS',
    bajajCode: '790024',
    articleCode: '494510620',
    description: 'MORPHY RICHARDS MWO SOLO 20MWS BLACK 20L',
    power: '1150W',
    capacity: '20L',
    warranty: '2 Years',
    keyFeatures: [
      '20L Solo capacity — ideal for most families',
      'Ceramic coated cavity for higher durability',
      'Black coloured body with rich finish',
      'Reheat function, quick heat option',
      'Overheat protection'
    ]
  },

  // SECTION 10: Irons
  {
    name: 'DX4',
    category: 'Irons',
    brand: 'BAJAJ',
    bajajCode: '440214',
    articleCode: '491186175',
    description: 'BAJAJ MAJESTY DX4 DRY IRON 1000W WHITE',
    power: '1000W',
    warranty: '2Y + Home Service',
    color: 'White',
    keyFeatures: [
      'Bajaj DuraGlide™ soleplate — German coating technology',
      'Optimally designed double-layer non-stick coating',
      '360-degree swivel cord',
      'Ergonomically designed cool touch handle & body',
      'Adjustable temperature setting with Denim mode',
      'BIS certified'
    ]
  },
  {
    name: 'MX 3 Neo',
    category: 'Irons',
    brand: 'BAJAJ',
    bajajCode: '440508',
    articleCode: '492664385',
    description: 'Bajaj Steam Iron MX 3 Neo 1250W',
    power: '1250W',
    capacity: '180ml Tank',
    warranty: '2Y + Home Service',
    keyFeatures: [
      'Non-stick coated soleplate',
      'Adjustable temperature setting for different fabrics',
      'Suitable for vertical ironing',
      'Variable steam output up to 12 gm/min',
      'Cool touch handle & body · 360-degree swivel cord'
    ]
  },
  {
    name: 'MX 45',
    category: 'Irons',
    brand: 'BAJAJ',
    bajajCode: '440510',
    articleCode: '494426359',
    description: 'BAJAJ LGHT WEIGHT STEAM IRON MX 45 2000W',
    power: '2000W',
    capacity: '220ml Tank',
    warranty: '2 Years',
    keyFeatures: [
      'Premium features: anti-drip, anti-scale, self-clean',
      'Ergonomically designed cool touch handle & body',
      'Anti-bacterial double-layer non-stick soleplate',
      'Variable steam output 18 gm/min, powerful steam burst',
      'Suitable for both steam & dry ironing with spray facility',
      'German coating technology soleplate · 1.8m cord, 16A plug'
    ]
  },
  {
    name: 'Glide',
    category: 'Irons',
    brand: 'MORPHY RICHARDS',
    bajajCode: '500071',
    articleCode: '491186075',
    description: 'MORPHY RICHARDS STEAM IRON GLIDE 1250 W',
    power: '1250W',
    capacity: '300ml Tank',
    warranty: '2 Years',
    keyFeatures: [
      '1250W with turbo boost mode',
      'Sharp break tip for less accessible areas',
      'Rubber handle for better grip',
      'Self-cleaning function',
      'Horizontal & vertical ironing'
    ]
  },
  {
    name: 'Ultra Glide',
    category: 'Irons',
    brand: 'MORPHY RICHARDS',
    bajajCode: '500016',
    articleCode: '491581690',
    description: 'MR STEAM IRON ULTRA GLIDE 1600W',
    power: '1600W',
    capacity: '350ml Tank',
    warranty: '2 Years',
    keyFeatures: [
      '1600W with Teflon coated soleplate',
      'Translucent water tank, 350ml capacity',
      'Turbo boost mode, self-cleaning',
      'Rubber handle for better grip',
      'Horizontal & vertical ironing'
    ]
  },
  {
    name: 'Super Glide',
    category: 'Irons',
    brand: 'MORPHY RICHARDS',
    bajajCode: '500072',
    articleCode: '491186076',
    description: 'MORPHY RICHARDS STEAM IRON SUPER GLIDE',
    power: '2000W',
    capacity: '350ml Tank',
    warranty: '2 Years',
    keyFeatures: [
      '2000W with 46 steam vents',
      'Premium ceramic soleplate, anti-calc',
      'Turbo boost — 28g/min continuous steam output',
      'Turbo steam burst of 150g/min',
      'Horizontal & vertical ironing'
    ]
  },
  {
    name: 'SteamEase',
    category: 'Irons',
    brand: 'MORPHY RICHARDS',
    bajajCode: '500084',
    articleCode: '494605958',
    description: 'MR Cordless Steam Ease 2200W Steam Iron',
    power: '2200W',
    capacity: '320ml Tank',
    warranty: '2 Years',
    keyFeatures: [
      'Cordless for an easy glide experience',
      'Burst steam eliminates stubborn wrinkles deep into fabric',
      'Ceramic coated soleplate — scratchproof & durable',
      'Powerful continuous steam, min. 20 gm/min steam rate',
      'Anti-drip system prevents water-stain leaks',
      'Safety auto-off · vertical steam option'
    ]
  },

  // SECTION 11: Garment Steamers
  {
    name: 'Steam Elite',
    category: 'Garment Steamers',
    brand: 'MORPHY RICHARDS',
    bajajCode: '500020',
    articleCode: '494405195',
    description: 'MR GARMENT STEAMER STEAM ELITE',
    power: '1200W',
    capacity: '110ml Tank',
    warranty: '2 Years',
    keyFeatures: [
      'Ready to use in 25 seconds',
      '1200W powerful steamer',
      'Travel friendly, compact body',
      'Detachable water tank, 110ml',
      '18 gm/min of continuous steam output'
    ]
  },
  {
    name: 'Vogue Professional',
    category: 'Garment Steamers',
    brand: 'MORPHY RICHARDS',
    bajajCode: '50021',
    articleCode: '494405196',
    description: 'MR GARMENT STEAMER VOGUE PRO UPRIGHT',
    power: '2000W',
    capacity: '1.7L Tank',
    warranty: '2 Years',
    keyFeatures: [
      'Kills 99.9% bacteria',
      'Easy ironing at all angles',
      'Large detachable water tank, 1.7L',
      'Adjustable angles with ironing board — 45° / 90° / 180°',
      'Ready to use in 30 seconds'
    ]
  },
  {
    name: 'Vogue',
    category: 'Garment Steamers',
    brand: 'MORPHY RICHARDS',
    bajajCode: '500022',
    articleCode: '494405194',
    description: 'MR GARMENT STEAMER VOGUE STEAM',
    power: '1200W',
    capacity: '120ml Tank',
    warranty: '2 Years',
    keyFeatures: [
      'Kills 99.9% bacteria',
      'Ready to use in 15 seconds',
      '90-degree rotatable head',
      'Concealed & detachable 120ml water tank'
    ]
  }
];

export const CATEGORIES_LIST = Array.from(
  new Set(ISP_HANDBOOK_PRODUCTS.map(p => p.category))
);
