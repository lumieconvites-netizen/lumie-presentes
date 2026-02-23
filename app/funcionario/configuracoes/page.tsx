'use client';

import AccountSettingsPanel from '@/components/account/account-settings-panel';

export default function EmployeeSettingsPage() {
  return (
    <AccountSettingsPanel
      title="Configuracoes da conta"
      subtitle="Atualize seu nome e foto de perfil."
      showBankSection={false}
    />
  );
}
