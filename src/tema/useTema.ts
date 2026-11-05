import { useColorScheme } from 'react-native';

import { renkler, type Renkler } from './renkler';

// Telefonun açık / koyu mod ayarına göre renkleri verir; ayar değişince ekran kendiliğinden güncellenir
export function useTema(): { renk: Renkler; koyu: boolean } {
  const koyu = useColorScheme() === 'dark';

  return { renk: koyu ? renkler.koyu : renkler.acik, koyu };
}
