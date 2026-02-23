'use client';

import AccountSettingsPanel from '@/components/account/account-settings-panel';

export default function AdminSettingsPage() {
  return (
    <AccountSettingsPanel
      title="Configurações da conta admin"
      subtitle="Atualize seu perfil administrativo."
      showBankSection={false}
      profileScope="session"
    />
  );
}
