// Teste direto da API Asaas
const https = require('https');

const API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjVlOTFmNGU0LThmZDYtNDc3YS05ZDQyLTkzMmVkYmEyNjY4ZDo6JGFhY2hfODhlN2IyMzEtMzk4MC00MGZkLWE3M2UtYjE4ZmNlN2M5OGJh';

function makeRequest(path, method, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'sandbox.asaas.com',
      port: 443,
      path: `/api/v3${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'access_token': API_KEY,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testCreateCustomer() {
  console.log('1. Criando cliente...');

  const customer = await makeRequest('/customers', 'POST', {
    name: 'LUCAS GABRIEL ROCHA RAMOS',
    email: 'soundsvibee@gmail.com',
    cpfCnpj: '10081727666',
  });

  console.log('Resposta cliente:', JSON.stringify(customer, null, 2));

  if (customer.errors) {
    console.error('ERRO:', customer.errors);
    return;
  }

  console.log('\n2. Criando pagamento PIX...');

  const payment = await makeRequest('/payments', 'POST', {
    customer: customer.id,
    billingType: 'PIX',
    value: 100,
    dueDate: new Date().toISOString().split('T')[0],
    description: 'Teste — NodoPrime',
  });

  console.log('Resposta pagamento:', JSON.stringify(payment, null, 2));

  if (payment.invoiceUrl) {
    console.log('\n✅ LINK DE PAGAMENTO:', payment.invoiceUrl);
  }
}

testCreateCustomer().catch(console.error);
