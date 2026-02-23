'use client';

import AccountSettingsPanel from '@/components/account/account-settings-panel';

export default function AmbassadorSettingsPage() {
  return (
    <AccountSettingsPanel
      title="Configurações da conta"
      subtitle="Atualize seu perfil e seus dados bancários para recebimento."
      showBankSection
    />
  );
}

