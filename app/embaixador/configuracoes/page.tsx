'use client';

import AccountSettingsPanel from '@/components/account/account-settings-panel';

export default function AmbassadorSettingsPage() {
  return (
    <AccountSettingsPanel
      title="Configuracoes da conta"
      subtitle="Atualize seu perfil e seus dados bancarios para recebimento."
      showBankSection
    />
  );
}

