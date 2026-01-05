// Collection of Bible verses for daily display
// Each verse has the text and reference

export interface BibleVerse {
  text: string;
  reference: string;
}

export const bibleVerses: BibleVerse[] = [
  {
    text: "Porque Deus tanto amou o mundo que deu o seu Filho Unigênito, para que todo o que nele crer não pereça, mas tenha a vida eterna.",
    reference: "João 3:16"
  },
  {
    text: "O Senhor é o meu pastor; nada me faltará.",
    reference: "Salmos 23:1"
  },
  {
    text: "Tudo posso naquele que me fortalece.",
    reference: "Filipenses 4:13"
  },
  {
    text: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento.",
    reference: "Provérbios 3:5"
  },
  {
    text: "Busquem, pois, em primeiro lugar o Reino de Deus e a sua justiça, e todas essas coisas lhes serão acrescentadas.",
    reference: "Mateus 6:33"
  },
  {
    text: "E conhecerão a verdade, e a verdade os libertará.",
    reference: "João 8:32"
  },
  {
    text: "O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.",
    reference: "1 Coríntios 13:4"
  },
  {
    text: "Não andem ansiosos por coisa alguma, mas em tudo, pela oração e súplicas, e com ação de graças, apresentem seus pedidos a Deus.",
    reference: "Filipenses 4:6"
  },
  {
    text: "Porque eu bem sei os pensamentos que penso de vós, diz o Senhor; pensamentos de paz e não de mal, para vos dar o fim que esperais.",
    reference: "Jeremias 29:11"
  },
  {
    text: "Sejam fortes e corajosos. Não tenham medo nem fiquem apavorados por causa deles, pois o Senhor, o seu Deus, vai com vocês.",
    reference: "Deuteronômio 31:6"
  },
  {
    text: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.",
    reference: "Salmos 37:5"
  },
  {
    text: "Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco.",
    reference: "1 Tessalonicenses 5:18"
  },
  {
    text: "Mas buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.",
    reference: "Mateus 6:33"
  },
  {
    text: "O choro pode durar uma noite, mas a alegria vem pela manhã.",
    reference: "Salmos 30:5"
  },
  {
    text: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.",
    reference: "1 Pedro 5:7"
  },
  {
    text: "Porque onde estiver o vosso tesouro, aí estará também o vosso coração.",
    reference: "Mateus 6:21"
  },
  {
    text: "Sede uns para com os outros benignos, misericordiosos, perdoando-vos uns aos outros, como também Deus vos perdoou em Cristo.",
    reference: "Efésios 4:32"
  },
  {
    text: "Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias; correrão e não se cansarão; andarão e não se fatigarão.",
    reference: "Isaías 40:31"
  },
  {
    text: "Toda a Escritura é inspirada por Deus e útil para o ensino, para a repreensão, para a correção e para a instrução na justiça.",
    reference: "2 Timóteo 3:16"
  },
  {
    text: "E o Deus de toda graça, que em Cristo vos chamou à sua eterna glória, depois de haverdes sofrido por um pouco, ele mesmo vos há de aperfeiçoar, confirmar e fortalecer.",
    reference: "1 Pedro 5:10"
  },
  {
    text: "Não to mandei eu? Esforça-te e tem bom ânimo; não te atemorizes, nem te espantes, porque o Senhor, teu Deus, é contigo por onde quer que andares.",
    reference: "Josué 1:9"
  },
  {
    text: "Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.",
    reference: "Mateus 11:28"
  },
  {
    text: "O Senhor é a minha luz e a minha salvação; de quem terei temor? O Senhor é o meu forte refúgio; de quem terei medo?",
    reference: "Salmos 27:1"
  },
  {
    text: "Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum, porque tu estás comigo.",
    reference: "Salmos 23:4"
  },
  {
    text: "Portanto, não se preocupem com o amanhã, pois o amanhã trará as suas próprias preocupações. Basta a cada dia o seu próprio mal.",
    reference: "Mateus 6:34"
  },
  {
    text: "Deleita-te também no Senhor, e ele te concederá o que deseja o teu coração.",
    reference: "Salmos 37:4"
  },
  {
    text: "Jesus Cristo é o mesmo ontem, hoje e para sempre.",
    reference: "Hebreus 13:8"
  },
  {
    text: "Pois o salário do pecado é a morte, mas o dom gratuito de Deus é a vida eterna em Cristo Jesus, nosso Senhor.",
    reference: "Romanos 6:23"
  },
  {
    text: "Honra a teu pai e a tua mãe, para que se prolonguem os teus dias na terra que o Senhor, teu Deus, te dá.",
    reference: "Êxodo 20:12"
  },
  {
    text: "Bendize, ó minha alma, ao Senhor, e tudo o que há em mim bendiga ao seu santo nome.",
    reference: "Salmos 103:1"
  },
  {
    text: "O temor do Senhor é o princípio da sabedoria; bom entendimento têm todos os que lhe obedecem.",
    reference: "Salmos 111:10"
  }
];

// Function to get verse of the day based on current date
export function getVerseOfTheDay(): BibleVerse {
  // Get day of year (1-365/366)
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  // Use modulo to cycle through verses
  const verseIndex = dayOfYear % bibleVerses.length;
  
  return bibleVerses[verseIndex];
}