const BASE_URL = process.env.NEXT_PUBLIC_ASAAS_ENV === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3';

const getHeaders = () => {
  let apiKey = process.env.ASAAS_API_KEY || '';
  // Remove aspas simples ou duplas se existirem
  apiKey = apiKey.replace(/^['"]|['"]$/g, '');
  return {
    'Content-Type': 'application/json',
    'access_token': apiKey,
  };
};

// Função para criar cliente
async function createCustomer(nome: string, documento: string, email: string) {
  const headers = getHeaders();
  const res = await fetch(`${BASE_URL}/customers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: nome,
      cpfCnpj: documento,
      email: email,
    }),
  });
  const data = await res.json();
  return data;
}

// Função para criar cobrança
async function createPayment(customerId: string, billingType: string, value: number, description: string) {
  const headers = getHeaders();
  const dueDate = new Date().toISOString().split('T')[0]; // Formato: 2026-04-04

  const res = await fetch(`${BASE_URL}/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      customer: customerId,
      billingType: billingType,
      value: value,
      dueDate: dueDate,
      description: description,
    }),
  });
  const data = await res.json();
  return data;
}

// Função wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const asaas = {
  // Criar cliente
  async createCustomer(nome: string, documento: string, email: string) {
    return await createCustomer(nome, documento, email);
  },

  // Criar cobrança
  async createPayment(customerId: string, billingType: string, value: number, description: string) {
    return await createPayment(customerId, billingType, value, description);
  },

  // Fluxo completo: criar cliente -> wait 5s -> criar cobrança
  async createCustomerAndPayment(nome: string, documento: string, email: string, billingType: string, value: number, description: string) {
    console.log('PASSO 1: Criando cliente...');
    const customer = await createCustomer(nome, documento, email);
    console.log('Cliente criado:', customer);

    if (customer.errors) {
      throw new Error(`Erro ao criar cliente: ${JSON.stringify(customer.errors)}`);
    }

    console.log('PASSO 2: Aguardando 5 segundos...');
    await wait(5000);

    console.log('PASSO 3: Criando cobrança...');
    const payment = await createPayment(customer.id, billingType, value, description);
    console.log('Cobrança criada:', payment);

    if (payment.errors) {
      throw new Error(`Erro ao criar cobrança: ${JSON.stringify(payment.errors)}`);
    }

    return { customer, payment };
  },
};
