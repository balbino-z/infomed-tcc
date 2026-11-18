# ADR-001: Stack tecnológica do front-end

- **Status:** Aceita
- **Data:** 20/10/2026
- **Disciplinas relacionadas:** Programação Multi Plataforma, Projeto Integrador II

## Contexto

O InfoMed é um aplicativo de saúde pública digital que reúne consulta de medicamentos, localização de postos de saúde, agendamento de consultas e lembretes de medicação. O público inclui idosos, o que exige interface simples, fontes legíveis e navegação previsível. O prazo de desenvolvimento do TCC é de aproximadamente um mês, e o protótipo de alta fidelidade já existia no Figma, com 20 telas.

Era necessário escolher uma stack que (1) reaproveitasse o protótipo, (2) rodasse em mais de uma plataforma a partir de um único código e (3) fosse viável para um desenvolvedor concluir no prazo.

## Decisão

Adotar:

- **React 18** como biblioteca de interface;
- **Vite** como ferramenta de build e servidor de desenvolvimento;
- **TypeScript** para tipagem estática;
- **Tailwind CSS** para estilização;
- **PWA** (Progressive Web App) como estratégia multiplataforma, com a possibilidade de empacotamento com **Capacitor** para Android.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Flutter | Exigiria reescrever todo o protótipo em Dart, sem reaproveitar o código exportado do Figma |
| React Native / Expo | Boa opção, mas o código exportado do Figma Make é React para web, e a conversão consumiria tempo do prazo |
| Aplicativo nativo (Kotlin e Swift) | Dois códigos separados, inviável em um mês |
| Site web simples (sem PWA) | Não atende ao requisito multiplataforma nem à experiência de aplicativo |

## Consequências

**Positivas**
- Reaproveitamento direto das telas geradas pelo Figma Make.
- Um único código atende navegador, celular (instalável como PWA) e, se necessário, Android via Capacitor.
- Ecossistema amplo e farta documentação.

**Negativas / riscos**
- Recursos nativos avançados (notificações em segundo plano no iOS, por exemplo) têm limitações em PWA.
- A experiência não é 100% nativa.

## Evidências

- `package.json` do repositório
- Print do aplicativo rodando no navegador e no celular
