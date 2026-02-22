'use client';

import AccountSettingsPanel from '@/components/account/account-settings-panel';

export default function AdminSettingsPage() {
  return (
    <AccountSettingsPanel
      title="Configuracoes da conta admin"
      subtitle="Atualize seu perfil administrativo."
      showBankSection={false}
    />
  );
}

