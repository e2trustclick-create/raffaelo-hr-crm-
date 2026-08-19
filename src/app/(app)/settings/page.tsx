import { prisma } from '@/lib/prisma';
import { SettingsView } from './SettingsView';

export default async function SettingsPage() {
  const settings = await prisma.hRSettings.findUniqueOrThrow({ where: { id: 'singleton' } });

  return (
    <SettingsView
      settings={{
        resortName: settings.resortName,
        resortLocation: settings.resortLocation,
        hrEmail: settings.hrEmail,
      }}
    />
  );
}
