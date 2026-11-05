import { NativeTabs } from 'expo-router/native-tabs';

import { useTema } from '@/tema/useTema';

// Telefonun kendi alt menüsü (iOS'ta UITabBar, Android'de Material alt menü).
// Simgeler: iOS'ta SF Symbols (sf), Android'de Material simgeleri (md).
export default function SekmeDuzeni() {
  const { renk } = useTema();

  return (
    <NativeTabs tintColor={renk.marka}>
      <NativeTabs.Trigger name="(bugun)">
        <NativeTabs.Trigger.Label>Bugün</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'sun.max', selected: 'sun.max.fill' }} md="today" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="adaylar">
        <NativeTabs.Trigger.Label>Adaylar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md="group" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="mulakatlar">
        <NativeTabs.Trigger.Label>Mülakatlar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'calendar', selected: 'calendar' }} md="event" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="daha-fazla">
        <NativeTabs.Trigger.Label>Daha Fazla</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'ellipsis.circle', selected: 'ellipsis.circle.fill' }}
          md="more_horiz"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
