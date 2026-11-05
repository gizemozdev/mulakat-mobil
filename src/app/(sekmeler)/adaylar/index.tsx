import { BosDurum } from '@/bilesenler/Durumlar';
import { Ekran } from '@/bilesenler/Ekran';

// Sonraki aşamada dolacak
export default function Adaylar() {
  return (
    <Ekran>
      <BosDurum baslik="Bir sonraki aşamada" aciklama="Adayları listeleme, arama, ekleme, düzenleme ve CV bu bölümde olacak." />
    </Ekran>
  );
}
