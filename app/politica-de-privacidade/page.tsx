export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-3xl font-semibold text-primary">Politica de Privacidade</h1>
        <p className="text-muted-foreground">
          Esta pagina descreve como os dados pessoais sao tratados no contexto de autenticacao,
          agendamento e historico de servicos da barbearia.
        </p>
        <p className="text-muted-foreground">
          A coleta e o tratamento seguem a LGPD, com base legal de consentimento e execucao de
          contrato para prestacao de servicos.
        </p>
      </div>
    </div>
  );
}