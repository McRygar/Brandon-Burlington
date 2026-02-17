import { ai } from './genai';
import { processImageTransparency } from '../utils/imageUtils';

export interface GameAssets {
  background: string;
  items: Record<string, string>;
}

const ASSET_CACHE_KEY = 'panic_clean_assets_v1';

export const AssetService = {
  async loadAssets(): Promise<GameAssets> {
    // Check local storage first
    const cached = localStorage.getItem(ASSET_CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse cached assets', e);
      }
    }

    // Generate if not cached
    const assets = await this.generateAssets();
    
    // Cache them (might fail if too large for localStorage, but worth a try)
    try {
      localStorage.setItem(ASSET_CACHE_KEY, JSON.stringify(assets));
    } catch (e) {
      console.warn('Could not cache assets (likely too big)', e);
    }
    
    return assets;
  },

  async generateAssets(): Promise<GameAssets> {
    const [background, items] = await Promise.all([
      this.generateBackground(),
      this.generateItems()
    ]);

    return { background, items };
  },

  async generateBackground(): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: 'A 1990s teen bedroom, messy, pixel art style, Sierra Online style, Monkey Island style, detailed, 4:3 aspect ratio. Features a bed, computer desk with CRT monitor, posters, closet, door. No people.',
            },
          ],
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error('No image generated for background');
    } catch (error) {
      console.error('Background generation failed', error);
      // Return a placeholder or rethrow
      throw error;
    }
  },

  async generateItems(): Promise<Record<string, string>> {
    const itemNames = [
      'Green beer bottle', 'Water pipe', 'Magazine', 'Bottle cap', 
      'Gum pack', 'Funnel', 'Party beads', 'Lighter', 'Cigarette',
      'Band poster', 'Desk lamp', 'Door rug', 'Glowing Green Jar'
    ];
    
    const itemKeys = [
      'BEER', 'PIPE', 'MAGAZINE', 'CAP', 
      'GUM', 'FUNNEL', 'BEADS', 'LIGHTER', 'CIGARETTE',
      'POSTER', 'LAMP', 'RUG', 'GREEN_JAR'
    ];

    const results: Record<string, string> = {};

    // Generate in parallel
    const promises = itemNames.map(async (name, index) => {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: `A single pixel art sprite of a ${name}, 16-bit Sierra Online style, white background.`,
              },
            ],
          },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const rawBase64 = `data:image/png;base64,${part.inlineData.data}`;
            const processed = await processImageTransparency(rawBase64);
            results[itemKeys[index]] = processed;
            return;
          }
        }
      } catch (error) {
        console.error(`Failed to generate item: ${name}`, error);
      }
    });

    await Promise.all(promises);
    return results;
  }
};
