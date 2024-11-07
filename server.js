app.post('/scrape', async (req, res) => {
  const { segmento, cidade, estado } = req.body;
  const urlDePesquisa = "https://www.google.com.br/maps";
  const results = [];

  // Função para atualizar o resultado no frontend em tempo real
  const updateResults = (message) => {
    results.push(message);
    res.write(`data: ${JSON.stringify({ message })}\n\n`);
  };

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(urlDePesquisa);
    await page.waitForSelector("#searchboxinput", { visible: true });

    updateResults(`Iniciando a pesquisa por ${segmento} em ${cidade}, ${estado}...`);
    await page.type("#searchboxinput", `todas ${segmento} em, ${cidade}, ${estado}`);
    await page.click("#searchbox-searchbutton > span");
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 1.5 });
    await page.waitForSelector('div[role="feed"]', { visible: true, timeout: 60000 });

    const links = await page.$$('div[role="feed"] > div:nth-child(odd) > [jsaction] a:not(.bm892c):not(.A1zNzb)');

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      updateResults(`Capturando dados da empresa ${i + 1} de ${links.length}...`);

      await new Promise(resolve => setTimeout(resolve, 2500));
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
        await page.waitForSelector('button[aria-label^="Salvar"]');
        try {
          const titulo = await page.$eval('h1.DUwDvf.lfPIob', el => el.textContent).catch(() => "não encontrado");
          const telefone = await page.$eval('button[aria-label^="Telefone:"]', el => el.getAttribute('aria-label')).catch(() => "não encontrado");
          const ratingText = await page.$eval('.fontBodyMedium > span[role="img"]', el => {
            const values = el.getAttribute("aria-label").split(" ").map(x => x.replace(",", ".")).map(parseFloat).filter(x => !isNaN(x));
            return { stars: values[0] || "não encontrado", reviews: values[1] || "não encontrado" };
          }).catch(() => ({ stars: "não encontrado", reviews: "não encontrado" }));

          results.push({ titulo, telefone, stars: ratingText.stars, reviews: ratingText.reviews });
          updateResults(`Dados capturados: ${titulo}, Telefone: ${telefone}, Estrelas: ${ratingText.stars}, Avaliações: ${ratingText.reviews}`);
        } catch (error) {
          updateResults(`Erro ao capturar dados da empresa ${i + 1}: ${error}. Resultado ignorado.`);
          continue;
        } finally {
          await page.click('span > button[jscontroller="soHxf"]');
          await new Promise(resolve => setTimeout(resolve, 2500));
        }
      }

      if (i < links.length - 1) {
        await links[i + 1].click();
      }
    }

    const uniqueResults = [...new Map(results.map(item => [item.titulo, item])).values()];
    fs.writeFileSync("results.json", JSON.stringify(uniqueResults, null, 2));
    updateResults(`Número de locais encontrados: ${uniqueResults.length}`);
    await browser.close();

    res.write(`data: ${JSON.stringify({ message: "Finalizado com sucesso!" })}\n\n`);
    res.end();
  } catch (error) {
    console.log("Erro:", error);
    res.status(500).json({ error: "Erro ao realizar a raspagem." });
  }
});
