const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const csvPath = path.join(__dirname, 'data', 'Legacy_Track_Songbook.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true
});

console.log(`Total records in CSV: ${records.length}`);

// Find ALL "I Told You So" entries
const itys = records.filter(r => 
  r.SONG === 'I Told You So' && r.ARTIST === 'Randy Travis'
);

console.log(`\nFound ${itys.length} "I Told You So" by Randy Travis`);
itys.forEach(r => {
  console.log(`  ${r['MF CODE']} - Track ${r.TRACK}`);
});

// Check if SC8421 is the last one
const sc8421Index = records.findIndex(r => r['MF CODE'] === 'SC8421');
console.log(`\nSC8421 is at index: ${sc8421Index} of ${records.length}`);