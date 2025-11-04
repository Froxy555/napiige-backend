// Test verse counting function

function countVerses(reference) {
  if (!reference) return 0;
  
  try {
    const normalized = reference.replace(/–/g, '-');
    const parts = normalized.split(/;/);
    let totalVerses = 0;
    
    for (let part of parts) {
      part = part.trim();
      
      const commaRangeMatch = part.match(/\b(\d+)[,:](\d+)-(\d+)/);
      if (commaRangeMatch) {
        const start = parseInt(commaRangeMatch[2]);
        const end = parseInt(commaRangeMatch[3]);
        totalVerses += (end - start + 1);
        continue;
      }
      
      const chapterRangeMatch = part.match(/(\d+)[,:](\d+)-(\d+)[,:](\d+)/);
      if (chapterRangeMatch) {
        const startChapter = parseInt(chapterRangeMatch[1]);
        const startVerse = parseInt(chapterRangeMatch[2]);
        const endChapter = parseInt(chapterRangeMatch[3]);
        const endVerse = parseInt(chapterRangeMatch[4]);
        
        if (startChapter === endChapter) {
          totalVerses += (endVerse - startVerse + 1);
        } else {
          totalVerses += (25 - startVerse) + (endVerse) + ((endChapter - startChapter - 1) * 25);
        }
        continue;
      }
      
      const singleVerseMatch = part.match(/\b(\d+)[,:](\d+)/);
      if (singleVerseMatch) {
        totalVerses += 1;
        continue;
      }
      
      const chapterOnlyMatch = part.match(/\b(\d+)$/);
      if (chapterOnlyMatch) {
        totalVerses += 25;
        continue;
      }
    }
    
    return totalVerses > 0 ? totalVerses : 1;
  } catch (error) {
    console.error('Hiba:', error);
    return 10;
  }
}

// Tesztek - valós formátumokkal
console.log('\n📚 Vers számolás tesztek:\n');
console.log('Test 1: "ApCsel 12,20–25" =', countVerses('ApCsel 12,20–25'), 'vers (várható: 6)');
console.log('Test 2: "Ézs 18" =', countVerses('Ézs 18'), 'vers (várható: ~25)');
console.log('Test 3: "János 3:16-20" =', countVerses('János 3:16-20'), 'vers (várható: 5)');
console.log('Test 4: "Máté 5,1-12" =', countVerses('Máté 5,1-12'), 'vers (várható: 12)');
console.log('Test 5: "1Korinthus 13,1" =', countVerses('1Korinthus 13,1'), 'vers (várható: 1)');

// Most nézzük meg hogy működik-e a backend logika
console.log('\n\n🔍 Szimuláljuk a backend hívást:\n');

const testDate = '2025-11-03';
const newTestamentRef = 'János 3:16-20';
const oldTestamentRef = 'Zsoltárok 23:1-6';

const newTestamentVerses = countVerses(newTestamentRef);
const oldTestamentVerses = countVerses(oldTestamentRef);
const totalVersesToday = newTestamentVerses + oldTestamentVerses;

console.log(`Újszövetség (${newTestamentRef}): ${newTestamentVerses} vers`);
console.log(`Ószövetség (${oldTestamentRef}): ${oldTestamentVerses} vers`);
console.log(`\n✅ ÖSSZESEN: ${totalVersesToday} vers olvasva ma!`);
