# AeroTrace | Laboratório de Telemetria Aeronáutica

Como identificar um sensor de velocidade que começa a divergir durante um voo? O AeroTrace simula três sensores e permite investigar, segundo a segundo, quando surge uma divergência e quanto tempo o sistema leva para emitir um alerta.

![Gráfico dos três sensores com alerta de deriva no canal B aos 80 segundos](deriva.png)

## Como executar

1. No GitHub, clica em **Code → Download ZIP**.
2. Extrai o ZIP e abre a pasta que contém o `index.html`.
3. Dá dois cliques em **`index.html`** para abrir o painel no navegador. Ele funciona offline.

Se já estiveres nessa pasta pelo terminal do VS Code no Windows, usa o PowerShell:

```powershell
start .\index.html
```

## Experimento de um minuto

Abre o cenário **Deriva progressiva**. Mantém o limiar em **8 kt** (oito nós) e a persistência em **3 amostras**. Em **Eventos detectados**, clica em **80 s · Canal B · Ver confirmação**. Depois, usa o controle de tempo para investigar três instantes do voo.

| Instante | O que acontece |
| --- | --- |
| 60 s | Começa a deriva programada no sensor B. |
| 78 s | O desvio de B supera o limiar de 8 kt pela primeira vez. |
| 80 s | A terceira leitura consecutiva acima do limiar confirma o alerta. |

Neste experimento, passaram **20 segundos entre o início da falha simulada e o alerta**. Para observar o efeito da persistência, muda para **Pico transitório** e reduz o valor de 3 para 1. O pico isolado aos 83 s passa a gerar um evento.

## Como o detector funciona

A cada segundo, o sistema ordena as três velocidades e usa a **mediana**, o valor do meio, como referência. Se os sensores indicam 189, 190 e 205 kt, a mediana é 190 kt e o terceiro sensor apresenta um desvio de 15 kt.

Cada sensor tem um contador. Enquanto o desvio supera o limiar, o contador aumenta. Quando o desvio volta ao limiar ou fica abaixo dele, o contador volta a zero. O alerta surge quando o contador atinge a persistência escolhida.

## Cenários disponíveis

| Cenário | O que investigar |
| --- | --- |
| Voo nominal | Como os três sensores variam quando há apenas ruído. |
| Deriva progressiva | Quanto tempo leva para detectar um erro que cresce aos poucos. |
| Pico transitório | Como a persistência influencia a detecção de uma leitura isolada. |
| Falha de modo comum | O que acontece quando os três sensores passam a errar juntos. |

O último cenário mostra uma limitação do método. Se os três sensores recebem o mesmo erro, a mediana também se desloca e os desvios entre os canais permanecem pequenos. Detectar essa falha exigiria uma referência independente.

## Dados e testes

O botão **Exportar CSV** salva as 181 amostras do registro, com o instante, a velocidade de cada canal, a mediana e os estados de alarme. A simulação usa uma semente fixa para permitir a comparação de configurações sobre os mesmos dados.

Para executar os **oito testes automatizados** do motor de análise, usa Node.js 20 ou superior:

```bash
node --test engine.test.js
```

## Tecnologias e escopo

JavaScript, HTML e CSS. O arquivo `engine.js` contém o simulador e o detector. O `app.js` liga a análise ao painel interativo.

Projeto educacional independente, com dados sintéticos e sem vínculo com fabricantes. A versão inicial do código, dos testes e da documentação foi gerada com auxílio de inteligência artificial.
