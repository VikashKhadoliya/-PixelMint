import http from 'http';

function getTargets() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 0;
    this.callbacks = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: `(async () => { return ${expr}; })()`,
      awaitPromise: true,
      returnByValue: true
    });
    return res.result?.value;
  }
}

async function run() {
  const targets = await getTargets();
  const page = targets.find(t => t.url && t.url.includes('5173'));
  const client = new CDPClient(page.webSocketDebuggerUrl);
  await client.connect();

  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 320,
    height: 568,
    deviceScaleFactor: 2,
    mobile: true
  });

  await client.eval(`window.location.hash = 'about'`);
  await new Promise(r => setTimeout(r, 800));

  const info = await client.eval(`(() => {
    const docW = document.documentElement.clientWidth;
    const docSW = document.documentElement.scrollWidth;
    const bodySW = document.body.scrollWidth;
    const all = Array.from(document.querySelectorAll('*'));
    const wide = [];
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.right > docW + 0.5 || el.scrollWidth > docW + 0.5) {
        wide.push({
          tag: el.tagName,
          id: el.id,
          cls: el.className,
          rectRight: rect.right,
          scrollWidth: el.scrollWidth
        });
      }
    }
    return { docW, docSW, bodySW, wide };
  })()`);

  console.log('Diagnosis:', JSON.stringify(info, null, 2));
  client.ws.close();
}

run().catch(console.error);
