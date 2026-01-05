import { 
  doc, 
  getDoc, 
  setDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getDailyVerse, getDayOfYear } from '../../data/daily-verses';

export interface VerseOfTheDay {
  id: string;
  text: string;
  reference: string;
  version: string;
  date: string; // Format: YYYY-MM-DD
  createdAt: Date;
  source: 'bible.com' | 'fallback';
}

class VerseOfTheDayService {
  private collectionName = 'verseOfTheDay';

  async getTodaysVerse(): Promise<VerseOfTheDay | null> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    try {
      const verseRef = doc(db, this.collectionName, today);
      const verseDoc = await getDoc(verseRef);
      
      if (verseDoc.exists()) {
        const data = verseDoc.data();
        return {
          id: verseDoc.id,
          text: data.text,
          reference: data.reference,
          version: data.version,
          date: data.date,
          createdAt: data.createdAt.toDate(),
          source: data.source
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting today\'s verse from Firebase:', error);
      return null;
    }
  }

  async saveVerse(verse: Omit<VerseOfTheDay, 'id' | 'createdAt'>): Promise<void> {
    try {
      const verseRef = doc(db, this.collectionName, verse.date);
      await setDoc(verseRef, {
        ...verse,
        createdAt: Timestamp.fromDate(new Date())
      });
      console.log('Verse saved to Firebase:', verse.reference);
    } catch (error) {
      console.error('Error saving verse to Firebase:', error);
      throw error;
    }
  }

  async fetchFromBibleCom(): Promise<{ text: string; reference: string; version: string } | null> {
    try {
      console.log('Fetching verse of the day from Bible.com...');
      
      // Try different APIs for verse of the day
      const sources = [
        () => this.fetchFromBibleComAPI(),
        () => this.fetchFromBibleAPI(),
        () => this.fetchFromVerseAPI(),
        () => this.fetchFromBibleGateway()
      ];
      
      for (const fetchSource of sources) {
        try {
          const result = await fetchSource();
          if (result) {
            console.log('Successfully fetched verse from source:', result.reference);
            return result;
          }
        } catch (error) {
          console.warn('Source failed, trying next:', error);
          continue;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching verse of the day:', error);
      return null;
    }
  }

  // Try Bible.com official API (highest priority)
  private async fetchFromBibleComAPI(): Promise<{ text: string; reference: string; version: string } | null> {
    try {
      console.log('Fetching from Bible.com API...');
      
      const response = await fetch('https://www.bible.com/_next/data/kHiCDA5jeJKNx3UfcKheu/pt.json');
      if (!response.ok) {
        throw new Error('Bible.com API response not ok');
      }
      
      const data = await response.json();
      
      if (data.pageProps && data.pageProps.verseOfTheDay) {
        const votd = data.pageProps.verseOfTheDay;
        
        if (votd.content && votd.reference && votd.reference.human) {
          return {
            text: votd.content.trim(),
            reference: votd.reference.human,
            version: votd.version?.abbreviation || 'NTLH'
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Bible.com API error:', error);
      return null;
    }
  }

  // Try Bible API (bible-api.com)
  private async fetchFromBibleAPI(): Promise<{ text: string; reference: string; version: string } | null> {
    try {
      // Bible API doesn't have a direct "verse of the day" endpoint, so we'll use a different approach
      const today = new Date();
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
      
      // Create a list of meaningful verses and rotate based on day of year
      const meaningfulVerses = [
        'john 3:16', 'psalms 23:1', 'philippians 4:13', 'romans 8:28', 'jeremiah 29:11',
        'proverbs 3:5-6', 'isaiah 40:31', 'matthew 11:28', 'ephesians 2:8-9', '1peter 5:7',
        'romans 5:8', 'galatians 2:20', 'hebrews 11:1', 'james 1:17', 'psalm 46:1',
        'matthew 6:33', '1corinthians 13:4', 'psalm 37:4', 'joshua 1:9', 'philippians 4:6-7'
      ];
      
      const verseRef = meaningfulVerses[dayOfYear % meaningfulVerses.length];
      
      const response = await fetch(`https://bible-api.com/${verseRef}?translation=almeida`);
      if (!response.ok) {
        throw new Error('Bible API response not ok');
      }
      
      const data = await response.json();
      
      if (data.text && data.reference) {
        return {
          text: data.text.trim(),
          reference: data.reference,
          version: 'ACF'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Bible API error:', error);
      return null;
    }
  }

  // Try another verse API
  private async fetchFromVerseAPI(): Promise<{ text: string; reference: string; version: string } | null> {
    try {
      // Use a proxy to fetch from a verse service
      const proxyUrl = 'https://api.allorigins.win/get?url=';
      const targetUrl = encodeURIComponent('https://beta.ourmanna.com/api/v1/get?format=json&order=daily');
      
      const response = await fetch(proxyUrl + targetUrl);
      const proxyData = await response.json();
      
      if (proxyData.contents) {
        const data = JSON.parse(proxyData.contents);
        
        if (data.verse && data.verse.details && data.verse.details.text) {
          return {
            text: data.verse.details.text,
            reference: data.verse.details.reference,
            version: 'WEB'
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Verse API error:', error);
      return null;
    }
  }

  // Try BibleGateway (as fallback)
  private async fetchFromBibleGateway(): Promise<{ text: string; reference: string; version: string } | null> {
    try {
      // Generate a verse for today based on date
      const today = new Date();
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
      
      // Portuguese Bible verses for each day rotation
      const dailyVerses = [
        { text: 'Porque Deus tanto amou o mundo que deu o seu Filho Unigênito, para que todo o que nele crer não pereça, mas tenha a vida eterna.', reference: 'João 3:16', version: 'NVI' },
        { text: 'O Senhor é o meu pastor; de nada terei falta.', reference: 'Salmos 23:1', version: 'NVI' },
        { text: 'Tudo posso naquele que me fortalece.', reference: 'Filipenses 4:13', version: 'NVI' },
        { text: 'Sabemos que Deus age em todas as coisas para o bem daqueles que o amam, dos que foram chamados de acordo com o seu propósito.', reference: 'Romanos 8:28', version: 'NVI' },
        { text: 'Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de lhes causar dano, planos de dar a vocês esperança e um futuro.', reference: 'Jeremias 29:11', version: 'NVI' },
        { text: 'Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento; reconheça o Senhor em todos os seus caminhos, e ele endireitará as suas veredas.', reference: 'Provérbios 3:5-6', version: 'NVI' },
        { text: 'Mas aqueles que esperam no Senhor renovam as suas forças. Voam alto como águias; correm e não ficam cansados, andam e não se fatigam.', reference: 'Isaías 40:31', version: 'NVI' },
        { text: 'Venham a mim, todos os que estão cansados e sobrecarregados, e eu lhes darei descanso.', reference: 'Mateus 11:28', version: 'NVI' },
        { text: 'Pois vocês são salvos pela graça, por meio da fé, e isso não vem de vocês, é dom de Deus; não por obras, para que ninguém se glorie.', reference: 'Efésios 2:8-9', version: 'NVI' },
        { text: 'Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês.', reference: '1 Pedro 5:7', version: 'NVI' },
        { text: 'Mas Deus demonstra seu amor por nós: Cristo morreu em nosso favor quando ainda éramos pecadores.', reference: 'Romanos 5:8', version: 'NVI' },
        { text: 'Fui crucificado com Cristo. Assim, já não sou eu quem vive, mas Cristo vive em mim. A vida que agora vivo no corpo, vivo-a pela fé no Filho de Deus, que me amou e se entregou por mim.', reference: 'Gálatas 2:20', version: 'NVI' },
        { text: 'Ora, a fé é a certeza daquilo que esperamos e a prova das coisas que não vemos.', reference: 'Hebreus 11:1', version: 'NVI' },
        { text: 'Toda boa dádiva e todo dom perfeito vêm do alto, descendo do Pai das luzes, que não muda como sombras inconstantes.', reference: 'Tiago 1:17', version: 'NVI' },
        { text: 'Deus é o nosso refúgio e a nossa fortaleza, auxílio sempre presente na adversidade.', reference: 'Salmos 46:1', version: 'NVI' },
        { text: 'Busquem, pois, em primeiro lugar o Reino de Deus e a sua justiça, e todas essas coisas lhes serão acrescentadas.', reference: 'Mateus 6:33', version: 'NVI' },
        { text: 'O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.', reference: '1 Coríntios 13:4', version: 'NVI' },
        { text: 'Deleitem-se no Senhor, e ele lhes concederá o desejo do seu coração.', reference: 'Salmos 37:4', version: 'NVI' },
        { text: 'Sejam fortes e corajosos! Não tenham medo nem desanimem, pois o Senhor, o seu Deus, estará com vocês por onde forem.', reference: 'Josué 1:9', version: 'NVI' },
        { text: 'Não tenham ansiedade por coisa alguma, mas em tudo, pela oração e súplicas, e com ação de graças, apresentem seus pedidos a Deus. E a paz de Deus, que excede todo o entendimento, guardará o coração e a mente de vocês em Cristo Jesus.', reference: 'Filipenses 4:6-7', version: 'NVI' }
      ];
      
      const todayVerse = dailyVerses[dayOfYear % dailyVerses.length];
      return todayVerse;
      
    } catch (error) {
      console.error('BibleGateway error:', error);
      return null;
    }
  }


  getFallbackVerse(): { text: string; reference: string; version: string } {
    const today = new Date();
    const dayOfYear = getDayOfYear(today);
    const dailyVerse = getDailyVerse(dayOfYear);
    
    console.log(`📖 Using 365-verse fallback for day ${dayOfYear}: ${dailyVerse.reference}`);
    
    return {
      text: dailyVerse.text,
      reference: dailyVerse.reference,
      version: dailyVerse.version
    };
  }
}

export const verseOfTheDayService = new VerseOfTheDayService();