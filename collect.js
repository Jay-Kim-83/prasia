const { scrapeRankings } = require('./scraper');

async function main() {
  console.log('='.repeat(50));
  console.log('프라시아 전기 랭킹 수집 시작');
  console.log(`시작 시각: ${new Date().toLocaleString('ko-KR')}`);
  console.log('='.repeat(50));

  try {
    const data = await scrapeRankings();
    console.log('\n✅ 수집 완료');
    console.log(`   - 총 캐릭터: ${data.characters.length}개`);
    console.log(`   - 수집 시각: ${new Date(data.lastUpdated).toLocaleString('ko-KR')}`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ 수집 실패:', err.message);
    process.exit(1);
  }
}

main();
