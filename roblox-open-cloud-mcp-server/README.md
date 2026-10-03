# roblox-open-cloud-mcp-server

Server MCP che collega Claude alle **API Open Cloud di Roblox** per il tuo gioco: leggere informazioni sull'esperienza, guardare i DataStore, mandare messaggi ai server live e caricare una versione del luogo.

Per sicurezza **le operazioni che modificano qualcosa sono spente di default** e chiedono conferma.

## Strumenti

| Strumento | Cosa fa | Tipo |
| --- | --- | --- |
| `roblox_get_universe` | Info sull'esperienza (nome, visibilità, ecc.) | lettura |
| `roblox_get_place` | Info su un luogo | lettura |
| `roblox_list_datastores` | Elenco dei DataStore (solo nomi) | lettura |
| `roblox_list_datastore_keys` | Elenco delle chiavi di un DataStore | lettura |
| `roblox_get_datastore_entry` | Legge il valore di una chiave | lettura |
| `roblox_api_get` | GET generica su un endpoint Open Cloud documentato | lettura |
| `roblox_publish_message` | Manda un messaggio ai server live (Messaging Service) | **scrittura** |
| `roblox_upload_place_version` | Carica un `.rbxl`/`.rbxlx` come nuova versione del luogo | **scrittura** |

## Installazione (Node 18 o più recente)

```bash
cd roblox-open-cloud-mcp-server
npm install
npm run build
```

## Creare la chiave API

1. Apri il **Creator Hub** (create.roblox.com) e cerca la sezione delle **credenziali / chiavi API** (i nomi dei menu possono cambiare).
2. Crea una chiave e **assegna solo i permessi che ti servono**, limitati al tuo gioco:
   - leggere i DataStore: permessi di lettura/elenco dei DataStore standard;
   - leggere info su esperienza e luoghi: permessi di lettura su universo/luogo;
   - caricare versioni: `universe-places:write`;
   - messaggi live: `universe-messaging-service:publish`.
3. Se puoi, limita la chiave al tuo indirizzo IP.
4. **Consiglio:** fai una chiave **solo lettura** per l'uso quotidiano e una chiave con scrittura solo quando serve.

Non incollare mai la chiave in un file che finisce su GitHub. Se pensi che sia trapelata, eliminala dal Creator Hub e creane un'altra.

## Collegarlo a Claude Code

Da un terminale (Windows PowerShell o CMD), sostituisci i valori:

```bash
claude mcp add --transport stdio --env ROBLOX_API_KEY=LA_TUA_CHIAVE --env ROBLOX_UNIVERSE_ID=123456789 --env ROBLOX_PLACE_ID=987654321 roblox-open-cloud -- node C:\percorso\roblox-open-cloud-mcp-server\dist\index.js
```

Poi controlla con `claude mcp list` oppure con `/mcp` dentro Claude Code. Non usare `--scope project` con la chiave dentro, perché scrive in `.mcp.json`, che di solito finisce su git.

Variabili d'ambiente:

| Variabile | Obbligatoria | Significato |
| --- | --- | --- |
| `ROBLOX_API_KEY` | sì | La chiave Open Cloud |
| `ROBLOX_UNIVERSE_ID` | consigliata | ID dell'universo (esperienza) usato di default |
| `ROBLOX_PLACE_ID` | consigliata | ID del luogo usato di default |
| `ROBLOX_MCP_ALLOW_WRITES` | no | Con `true` abilita i due strumenti di scrittura |

## Esempi di richieste

- "Mostrami le informazioni sul mio gioco."
- "Elenca i DataStore e dimmi quante chiavi iniziano con `Player_`."
- "Carica il file `build/gioco.rbxl` come versione **Saved** (prima fai una simulazione)."
- "Fai una simulazione dell'invio di un messaggio al topic `Manutenzione`."

## Sicurezza

- La chiave resta solo nel processo del server: **non viene mai stampata né inclusa nei messaggi di errore**.
- L'indirizzo è fisso su `apis.roblox.com`: nessun argomento può mandare la chiave altrove (percorsi con `//`, `..`, URL completi o `?` vengono rifiutati).
- Le scritture sono **disattivate** finché non imposti `ROBLOX_MCP_ALLOW_WRITES=true`, e anche allora richiedono `confirm=true`. Mandare una versione **Published** (live) richiede anche `confirm_publish=true`. Esiste `dry_run=true` per controllare senza inviare.
- **Dati dei giocatori:** i DataStore possono contenere dati personali, anche di minori. Quello che leggi passa dal modello. Leggi solo ciò che serve e dai alla chiave solo i DataStore necessari.

## Limiti e cose da sapere

- Le risposte più lunghe di 25.000 caratteri vengono troncate; usa filtri e paginazione (`limit`, `cursor`).
- Il caricamento di versioni è limitato da Roblox (circa 10 richieste al minuto per chiave).
- **Non provato contro le API reali.** Il server è stato scritto seguendo la documentazione ufficiale e provato con test automatici (rete simulata e avvio vero del protocollo), ma non con una tua chiave. Se una chiamata dà errore 400 o 404, copia il messaggio: i campi o i percorsi potrebbero essere cambiati.
- I campi delle risposte vengono mostrati come li restituisce Roblox e possono cambiare nel tempo.

## Sviluppo

```bash
npm test      # compila e lancia i 12 test
npm run dev   # ricompila a ogni modifica
```

Struttura: `src/index.ts` (avvio), `src/server.ts` (registrazione strumenti), `src/tools/` (lettura e scrittura), `src/services/` (client HTTP e formattazione), `src/tests/`.
