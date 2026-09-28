// Vehicle Make and Model Data from Copart Dataset
export const VEHICLE_MAKES_MODELS = {
  'TOYOTA': ['CAMRY', 'COROLLA', 'RAV4', 'HIGHLANDER', 'TACOMA', 'TUNDRA', '4RUNNER', 'SIENNA', 'PRIUS', 'AVALON', 'YARIS', 'C-HR', 'SEQUOIA', 'LAND CRUISER', 'SUPRA', '86', 'MIRAI'],
  'FORD': ['F-150', 'F-250', 'F-350', 'MUSTANG', 'EXPLORER', 'ESCAPE', 'EDGE', 'FUSION', 'FOCUS', 'EXPEDITION', 'RANGER', 'BRONCO', 'TRANSIT', 'ECOSPORT', 'FLEX', 'FIESTA', 'TAURUS'],
  'CHEVROLET': ['SILVERADO', 'MALIBU', 'EQUINOX', 'TAHOE', 'SUBURBAN', 'TRAVERSE', 'COLORADO', 'CAMARO', 'CORVETTE', 'IMPALA', 'CRUZE', 'TRAX', 'BLAZER', 'SPARK', 'VOLT', 'BOLT'],
  'HONDA': ['ACCORD', 'CIVIC', 'CR-V', 'PILOT', 'ODYSSEY', 'HR-V', 'RIDGELINE', 'PASSPORT', 'FIT', 'INSIGHT', 'CLARITY', 'ELEMENT'],
  'NISSAN': ['ALTIMA', 'SENTRA', 'ROGUE', 'PATHFINDER', 'FRONTIER', 'TITAN', 'MAXIMA', 'MURANO', 'VERSA', 'ARMADA', 'KICKS', 'LEAF', '370Z', 'GT-R', 'JUKE'],
  'KIA': ['OPTIMA', 'SORENTO', 'SPORTAGE', 'SOUL', 'FORTE', 'SELTOS', 'TELLURIDE', 'CARNIVAL', 'RIO', 'K5', 'NIRO', 'STINGER', 'CADENZA'],
  'HYUNDAI': ['ELANTRA', 'SONATA', 'TUCSON', 'SANTA FE', 'ACCENT', 'KONA', 'PALISADE', 'VENUE', 'VELOSTER', 'IONIQ', 'GENESIS', 'AZERA'],
  'DODGE': ['CHARGER', 'CHALLENGER', 'DURANGO', 'JOURNEY', 'GRAND CARAVAN', 'RAM', 'DART', 'AVENGER', 'VIPER', 'NITRO'],
  'JEEP': ['WRANGLER', 'GRAND CHEROKEE', 'CHEROKEE', 'COMPASS', 'RENEGADE', 'GLADIATOR', 'PATRIOT', 'LIBERTY', 'COMMANDER'],
  'RAM': ['1500', '2500', '3500', 'PROMASTER', 'PROMASTER CITY'],
  'GMC': ['SIERRA', 'TERRAIN', 'ACADIA', 'YUKON', 'CANYON', 'SAVANA', 'ENVOY'],
  'SUBARU': ['OUTBACK', 'FORESTER', 'CROSSTREK', 'IMPREZA', 'LEGACY', 'ASCENT', 'WRX', 'BRZ', 'TRIBECA'],
  'MAZDA': ['MAZDA3', 'MAZDA6', 'CX-5', 'CX-9', 'CX-3', 'CX-30', 'MX-5 MIATA', 'CX-50', 'SPEED3'],
  'BMW': ['3 SERIES', '5 SERIES', 'X3', 'X5', '7 SERIES', 'X1', 'X7', '4 SERIES', '2 SERIES', 'X6', 'Z4', 'i3', 'i8', 'M3', 'M5'],
  'MERCEDES-BENZ': ['C-CLASS', 'E-CLASS', 'S-CLASS', 'GLE-CLASS', 'GLC-CLASS', 'GLA-CLASS', 'GLB-CLASS', 'GLS-CLASS', 'CLA-CLASS', 'A-CLASS', 'G-CLASS', 'SL-CLASS', 'AMG GT'],
  'VOLKSWAGEN': ['JETTA', 'PASSAT', 'TIGUAN', 'ATLAS', 'GOLF', 'BEETLE', 'ARTEON', 'ID.4', 'TAOS', 'GTI', 'GLI'],
  'AUDI': ['A4', 'A6', 'Q5', 'Q7', 'A3', 'Q3', 'A5', 'Q8', 'A8', 'TT', 'R8', 'E-TRON', 'S4', 'RS5'],
  'LEXUS': ['RX', 'ES', 'NX', 'IS', 'GX', 'LX', 'UX', 'LS', 'RC', 'LC', 'GS'],
  'INFINITI': ['Q50', 'Q60', 'QX60', 'QX80', 'QX50', 'G37', 'FX35', 'M37'],
  'CADILLAC': ['ESCALADE', 'XT5', 'CT5', 'XT4', 'XT6', 'ATS', 'CTS', 'XTS', 'SRX', 'LYRIQ'],
  'TESLA': ['MODEL 3', 'MODEL Y', 'MODEL S', 'MODEL X'],
  'CHRYSLER': ['300', 'PACIFICA', 'VOYAGER', 'ASPEN', 'SEBRING', 'PT CRUISER'],
  'BUICK': ['ENCLAVE', 'ENCORE', 'ENVISION', 'LACROSSE', 'REGAL', 'VERANO'],
  'VOLVO': ['XC90', 'XC60', 'S60', 'XC40', 'V60', 'S90', 'V90'],
  'LINCOLN': ['NAVIGATOR', 'AVIATOR', 'CORSAIR', 'NAUTILUS', 'MKZ', 'MKX', 'MKC'],
  'ACURA': ['MDX', 'RDX', 'TLX', 'ILX', 'NSX', 'RLX', 'TSX'],
  'MITSUBISHI': ['OUTLANDER', 'ECLIPSE CROSS', 'MIRAGE', 'OUTLANDER SPORT', 'LANCER', 'MONTERO'],
  'LAND ROVER': ['RANGE ROVER', 'RANGE ROVER SPORT', 'DISCOVERY', 'DEFENDER', 'EVOQUE', 'VELAR', 'LR2', 'LR4'],
  'PORSCHE': ['911', 'CAYENNE', 'MACAN', 'PANAMERA', 'TAYCAN', 'BOXSTER', 'CAYMAN'],
  'MINI': ['COOPER', 'COUNTRYMAN', 'CLUBMAN', 'PACEMAN'],
  'FIAT': ['500', '500X', '500L', '124 SPIDER'],
  'JAGUAR': ['F-PACE', 'XE', 'XF', 'E-PACE', 'F-TYPE', 'XJ'],
  'ALFA ROMEO': ['GIULIA', 'STELVIO', '4C'],
  'GENESIS': ['G70', 'G80', 'G90', 'GV70', 'GV80'],
  'RIVIAN': ['R1T', 'R1S'],
  'LUCID': ['AIR'],
};

// Get all makes as array
export const ALL_MAKES = Object.keys(VEHICLE_MAKES_MODELS).sort();

// Get models for a specific make
export const getModelsForMake = (make) => {
  return VEHICLE_MAKES_MODELS[make] || [];
};

// Search makes by query
export const searchMakes = (query) => {
  if (!query) return ALL_MAKES;
  const upperQuery = query.toUpperCase();
  return ALL_MAKES.filter(make => make.includes(upperQuery));
};

// Search models by query for a specific make
export const searchModels = (make, query) => {
  const models = getModelsForMake(make);
  if (!query) return models;
  const upperQuery = query.toUpperCase();
  return models.filter(model => model.includes(upperQuery));
};
