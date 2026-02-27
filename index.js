const express = require('express');
const request = require('request');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/proxy', (req, res) => {
  let url = req.query.url;
  if (!url) return res.status(400).send('No URL provided');
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  };

  request({ url, headers, followAllRedirects: true }, (err, response, body) => {
    if (err) return res.status(500).send(`Error fetching page: ${err.message}`);
    
    // Rewrite links to go through proxy
    const baseUrl = new URL(url);
    body = body
      .replace(/(href|src|action)="(\/[^"]*?)"/g, (match, attr, link) => {
        return `${attr}="/proxy?url=${baseUrl.origin}${link}"`;
      })
      .replace(/(href|src|action)='(\/[^']*?)'/g, (match, attr, link) => {
        return `${attr}='/proxy?url=${baseUrl.origin}${link}'`;
      });

    res.set('Content-Type', response.headers['content-type'] || 'text/html');
    res.send(body);
  });
});

app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
