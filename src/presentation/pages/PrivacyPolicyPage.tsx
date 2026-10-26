// Presentation Page - Política de Privacidade (LGPD - Lei 13.709/2018)
// Public page (no authentication required).
//
// ATENÇÃO (revisão jurídica): este texto deve ser revisado por um advogado
// antes de ir para produção. Ele descreve o tratamento de dados conforme o
// código atual do sistema, mas não substitui parecer jurídico.

import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { DEFAULT_CHURCH_CONTACT_EMAIL } from '@/config/contact';

const LAST_UPDATE = '25 de outubro de 2026';

const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <section id={id} className="mb-10">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
    <div className="space-y-3 text-gray-700 leading-relaxed">{children}</div>
  </section>
);

const List: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <ul className="list-disc pl-6 space-y-1">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

export const PrivacyPolicyPage: React.FC = () => {
  const { settings } = useSettings();
  const churchName = settings?.churchName || 'a Igreja';
  const email = settings?.churchEmail || DEFAULT_CHURCH_CONTACT_EMAIL;
  const phone = settings?.churchPhone;

  const contactText = (
    <>
      {email || phone ? (
        <>
          {email && (
            <>
              e-mail{' '}
              <a href={`mailto:${email}`} className="text-blue-600 hover:text-blue-700 underline">
                {email}
              </a>
            </>
          )}
          {email && phone && ' ou '}
          {phone && <>telefone {phone}</>}
        </>
      ) : (
        'os canais de contato divulgados pela administração da igreja'
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white">
        <div className="container mx-auto px-6 py-16 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Política de Privacidade</h1>
            <p className="text-blue-100">Última atualização: {LAST_UPDATE}</p>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="mb-10 text-gray-700 leading-relaxed">
            Esta Política explica como {churchName} trata os dados pessoais das pessoas que usam este
            sistema (site e aplicativo), em conformidade com a Lei Geral de Proteção de Dados Pessoais
            (LGPD – Lei nº 13.709/2018).
          </p>

          <Section id="controlador" title="1. Controlador e Encarregado (DPO)">
            <p>
              O controlador dos dados é {churchName}, organização que opera esta instalação do sistema e
              decide como os dados são tratados.
            </p>
            <p>
              Para dúvidas, solicitações ou reclamações sobre dados pessoais, fale com o Encarregado pelo
              Tratamento de Dados Pessoais (DPO) por meio de: {contactText}.
            </p>
          </Section>

          <Section id="dados-coletados" title="2. Dados que coletamos">
            <p>Conforme os módulos utilizados pela igreja, podemos tratar:</p>
            <List
              items={[
                'Cadastro e conta: nome, e-mail, telefone, foto de perfil e credenciais de acesso (login por e-mail e senha ou por conta Google).',
                'Membros e visitantes: dados de cadastro e de acompanhamento informados à igreja.',
                'Pedidos de oração, publicações e comentários no fórum e demais espaços de comunidade.',
                'Eventos e projetos: inscrições e participação.',
                'Doações e financeiro: registros de contribuições e movimentações.',
                'Notificações push: tokens de dispositivo (FCM) e preferências de notificação.',
                'Registros de auditoria e de sistema (logs de ações realizadas na plataforma).',
                'Dados sensíveis de saúde: fichas, anamneses e atendimentos dos serviços de assistência social, psicologia, fisioterapia e nutrição.',
                'Dados de crianças e adolescentes: avaliações de desenvolvimento e acompanhamento pedagógico.',
              ]}
            />
            <p>
              <strong>Dado sensível por inferência.</strong> O vínculo com uma igreja pode revelar convicção
              religiosa, que é dado pessoal sensível (art. 5º, II, da LGPD). Por isso, tratamos todos os dados
              deste sistema com o cuidado exigido para dados sensíveis.
            </p>
          </Section>

          <Section id="finalidades" title="3. Para que usamos os dados">
            <List
              items={[
                'Criar e manter sua conta e permitir o acesso à plataforma.',
                'Gerir membros, visitantes, ministérios, eventos, projetos e a comunicação da igreja.',
                'Receber e acompanhar pedidos de oração e promover a interação na comunidade.',
                'Prestar atendimentos de assistência social, psicologia, fisioterapia e nutrição.',
                'Acompanhar o desenvolvimento de crianças e adolescentes nas atividades pedagógicas.',
                'Registrar doações e cumprir obrigações contábeis e fiscais.',
                'Enviar notificações e comunicados.',
                'Garantir a segurança do sistema e manter trilhas de auditoria.',
              ]}
            />
          </Section>

          <Section id="bases-legais" title="4. Bases legais">
            <List
              items={[
                'Consentimento (art. 7º, I): cadastro, comunicações e participação em espaços de comunidade.',
                'Execução de contrato ou de procedimentos preliminares (art. 7º, V) e legítimo interesse (art. 7º, IX): operação da conta e da plataforma, segurança e prevenção a fraudes.',
                'Obrigação legal ou regulatória (art. 7º, II): registros financeiros e de doações.',
                'Dados sensíveis (art. 11): consentimento específico e destacado (art. 11, I) e tutela da saúde, em procedimento realizado por profissionais de saúde ou serviços de saúde (art. 11, II, f), nos atendimentos.',
                'Dados de crianças e adolescentes (art. 14): tratados no melhor interesse da criança, com consentimento específico de pelo menos um dos pais ou responsável legal.',
              ]}
            />
          </Section>

          <Section id="compartilhamento" title="5. Compartilhamento e operadores">
            <p>
              Não vendemos dados pessoais. Utilizamos a infraestrutura do Google (Firebase e Google Cloud) para
              autenticação, banco de dados, armazenamento de arquivos e envio de notificações. O Google atua
              como operador e pode armazenar ou processar dados fora do Brasil; nesses casos, a transferência
              internacional ocorre com base na LGPD (art. 33).
            </p>
            <p>
              Dados podem ser compartilhados com autoridades quando houver obrigação legal, e com os
              profissionais e líderes da igreja estritamente na medida necessária para a sua função.
            </p>
          </Section>

          <Section id="retencao" title="6. Por quanto tempo guardamos">
            <p>
              Mantemos os dados enquanto sua conta estiver ativa ou enquanto forem necessários para as
              finalidades acima. Após a exclusão da conta, mantemos apenas os registros que somos obrigados ou
              temos interesse legítimo em conservar (por exemplo, registros financeiros e logs de auditoria),
              pelo prazo legal aplicável.
            </p>
          </Section>

          <Section id="seguranca" title="7. Segurança">
            <List
              items={[
                'Controle de acesso por perfis e permissões (RBAC): cada pessoa acessa apenas o que sua função exige.',
                'Regras de segurança do banco de dados (Firestore) que restringem leitura e escrita por usuário e perfil.',
                'Comunicação protegida por HTTPS.',
                'Registros de auditoria das ações na plataforma.',
              ]}
            />
            <p>
              Nenhum sistema é totalmente imune a incidentes; em caso de incidente relevante, comunicaremos os
              titulares e a ANPD conforme a LGPD.
            </p>
          </Section>

          <Section id="cookies" title="8. Cookies e armazenamento local">
            <p>
              Usamos apenas armazenamento local essencial do navegador (por exemplo, manter sua sessão de
              login e preferências técnicas do funcionamento do sistema). Não utilizamos cookies de publicidade
              nem de rastreamento de terceiros com fins de marketing.
            </p>
          </Section>

          <Section id="direitos" title="9. Seus direitos (art. 18 da LGPD)">
            <p>Você pode solicitar, a qualquer momento:</p>
            <List
              items={[
                'confirmação da existência de tratamento e acesso aos seus dados;',
                'correção de dados incompletos, inexatos ou desatualizados;',
                'anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;',
                'portabilidade dos dados;',
                'eliminação dos dados tratados com base em consentimento;',
                'informação sobre com quais entidades compartilhamos seus dados;',
                'informação sobre a possibilidade de não consentir e suas consequências;',
                'revogação do consentimento.',
              ]}
            />
            <p>
              Para exercer seus direitos, entre em contato pelo canal do Encarregado indicado na seção 1:{' '}
              {contactText}. Você também pode peticionar à Autoridade Nacional de Proteção de Dados (ANPD).
            </p>
          </Section>

          <Section id="exclusao" title="10. Exclusão da conta">
            <p>
              Você pode excluir sua conta a qualquer momento em{' '}
              <Link to="/excluir-conta" className="text-blue-600 hover:text-blue-700 underline">
                Excluir minha conta
              </Link>
              . Também é possível solicitar a exclusão pelo contato da administração da igreja (seção 1).
            </p>
            <p>Ao excluir a conta:</p>
            <List
              items={[
                <>
                  <strong>Excluímos:</strong> conta e perfil, login, foto de perfil, notificações, inscrições em
                  eventos e projetos, progresso em devocionais e planos, curtidas, preferências de notificação e
                  perfil do fórum.
                </>,
                <>
                  <strong>Anonimizamos:</strong> conteúdos que você publicou em espaços de comunidade (tópicos e
                  respostas do fórum, inclusive a indicação de “última resposta”, comentários e pedidos de oração
                  enviados com o e-mail da conta), que passam a aparecer como “Usuário removido”.
                </>,
                <>
                  <strong>Mantemos:</strong> registros que devemos ou temos interesse legítimo em conservar:
                  financeiro e doações (obrigação legal), registros institucionais, atendimentos e fichas de
                  assistência vinculados ao assistido e logs de auditoria.
                </>,
                'Cadastros de membros, voluntários e liderança são mantidos pela secretaria, não têm vínculo com o login e não são alterados pela exclusão da conta; peça à administração para corrigi-los ou removê-los.',
                'Se você tinha cadastro de profissional de assistência vinculado à conta, o vínculo é removido e o cadastro fica inativo; o histórico de atendimentos é preservado.',
                'Posts do blog e devocionais publicados pela equipe podem manter o nome do autor até a administração editá-los.',
              ]}
            />
          </Section>

          <Section id="criancas" title="11. Crianças e adolescentes">
            <p>
              Dados de crianças e adolescentes (como avaliações de desenvolvimento na área pedagógica) são
              tratados no seu melhor interesse, nos termos do art. 14 da LGPD, e exigem o consentimento
              específico e destacado de pelo menos um dos pais ou do responsável legal, que pode solicitar
              acesso, correção ou eliminação desses dados pelos canais indicados nesta Política.
            </p>
          </Section>

          <Section id="alteracoes" title="12. Alterações desta Política">
            <p>
              Podemos atualizar esta Política para refletir mudanças legais ou do sistema. A data da última
              atualização consta no topo desta página.
            </p>
          </Section>

          <Section id="contato" title="13. Contato">
            <p>Dúvidas sobre esta Política ou sobre seus dados: {contactText}.</p>
          </Section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;
