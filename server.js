const express = require('express');
const fs = require('fs');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

app.post('/scrape', async (req, res) => {
  const { segmento, cidade, estado } = req.body;
  const urlDePesquisa = "https://www.google.com.br/maps";
  const results = [];

  const updateResults = (message) => {
    console.log(message); // Log para acompanhar o progresso no backend
    results.push({ message }); // Envia a atualização de status para a resposta final
  };

  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto(urlDePesquisa);
    await page.waitForSelector("#searchboxinput", { visible: true });

    updateResults(`Iniciando a pesquisa por ${segmento} em ${cidade}, ${estado}...`);
    await page.type("#searchboxinput", `todas ${segmento} em, ${cidade}, ${estado}`);
    await page.click("#searchbox-searchbutton > span");
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 1.5 });
    await page.waitForSelector('div[role="feed"]', { visible: true, timeout: 60000 });

    const links = await page.$$('div[role="feed"] > div:nth-child(odd) > [jsaction] a:not(.bm892c):not(.A1zNzb)');
    updateResults(`Encontrados ${links.length} resultados iniciais.`);

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      updateResults(`Capturando dados da empresa ${i + 1} de ${links.length}...`);

      await link.click();

      try {
        await page.waitForSelector('button[aria-label^="Salvar"]', { visible: true, timeout: 30000 });
      } catch (error) {
        updateResults(`Erro ao encontrar botão Salvar na empresa ${i + 1}: ${error}. Continuando...`);
        continue;
      }

      const existeTelefone = await page.$('button[aria-label^="Telefone:"]');
      const existeTitulo = await page.$('h1.DUwDvf.lfPIob');

      if (existeTelefone || existeTitulo) {
        try {
          const titulo = await page.$eval('h1.DUwDvf.lfPIob', el => el.textContent).catch(() => "não encontrado");
          const telefone = await page.$eval('button[aria-label^="Telefone:"]', el => el.getAttribute('aria-label')).catch(() => "não encontrado");
          updateResults(`Dados capturados: ${titulo}, Telefone: ${telefone}`);
          results.push({ titulo, telefone });
        } catch (error) {
          updateResults(`Erro ao capturar dados da empresa ${i + 1}: ${error}. Resultado ignorado.`);
          continue;
        } finally {
          await page.click('span > button[jscontroller="soHxf"]');
        }
      }
    }

    await browser.close();
    updateResults(`Prospecção concluída com ${results.length} resultados.`);

    res.json(results); // Envia a resposta com todos os resultados e mensagens de progresso

  } catch (error) {
    console.error("Erro no backend:", error);
    res.status(500).json({ error: "Erro ao realizar a raspagem." });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
