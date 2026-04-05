import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Mail, Lock, User, CreditCard, FileText, ExternalLink, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Checkout() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [email, setEmail] = useState('');
  const [billingType, setBillingType] = useState<'PIX' | 'BOLETO' | 'CREDIT_CARD'>('PIX');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<{ invoiceUrl: string; paymentId: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, nome, documento, email, billingType }),
      });

      const data = await res.json();

      if (data.invoiceUrl) {
        setPaymentData({ invoiceUrl: data.invoiceUrl, paymentId: data.paymentId });
      } else {
        setError(data.error || 'Erro ao processar checkout');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenPayment() {
    if (paymentData) {
      window.open(paymentData.invoiceUrl, '_blank');
      navigate(`/confirmacao?paymentId=${paymentData.paymentId}`);
    }
  }

  // Se já tem link de pagamento, mostra a tela com o link
  if (paymentData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
        <nav className="relative z-10 glass-panel border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20 items-center">
              <Link to={`/produto/${slug}`} className="flex items-center text-sm font-bold text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest">
                <ChevronLeft className="mr-2 w-4 h-4" /> Voltar
              </Link>
              <span className="text-xl font-bold text-white tracking-widest uppercase">
                Pagamento <span className="text-cyan-400">Gerado</span>
              </span>
              <div className="w-20"></div>
            </div>
          </div>
        </nav>

        <main className="flex-grow flex items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/5 blur-[120px] rounded-full pointer-events-none"></div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full glass-panel rounded-3xl p-10 glow-green relative z-10"
          >
            <div className="text-center mb-10">
              <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
                <ShieldCheck className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Link de Pagamento</h2>
              <p className="mt-3 text-slate-400 text-sm leading-relaxed">
                Seu link de pagamento foi gerado com sucesso! Clique abaixo para acessar.
              </p>
            </div>

            <div className="mb-8 p-4 bg-slate-950/50 rounded-2xl border border-white/10">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Link de Pagamento</p>
              <p className="text-xs text-cyan-400 break-all">{paymentData.invoiceUrl}</p>
            </div>

            <button
              onClick={handleOpenPayment}
              className="w-full flex items-center justify-center px-8 py-5 border border-transparent text-lg font-bold rounded-2xl text-slate-950 bg-green-500 hover:bg-green-400 transition-all shadow-lg shadow-green-500/20 active:scale-95"
            >
              <ExternalLink className="mr-3 w-6 h-6" /> Abrir Link de Pagamento
              <ArrowRight className="ml-3 w-6 h-6" />
            </button>

            <div className="mt-8 flex items-center justify-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
              <Lock className="w-3 h-3 mr-2" /> Pagamento Seguro via Asaas
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <nav className="relative z-10 glass-panel border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to={`/produto/${slug}`} className="flex items-center text-sm font-bold text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest">
              <ChevronLeft className="mr-2 w-4 h-4" /> Voltar
            </Link>
            <span className="text-xl font-bold text-white tracking-widest uppercase">
              Checkout <span className="text-cyan-400">Seguro</span>
            </span>
            <div className="w-20"></div>
          </div>
        </div>
      </nav>

      <main className="flex-grow flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full glass-panel rounded-3xl p-10 glow-cyan relative z-10"
        >
          <div className="text-center mb-10">
            <div className="mx-auto w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/20">
              <ShieldCheck className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Finalizar Compra</h2>
            <p className="mt-3 text-slate-500 text-sm leading-relaxed">
              Preencha seus dados para gerar o link de pagamento.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="nome" className="block text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">
                Nome Completo
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                </div>
                <input
                  type="text"
                  id="nome"
                  className="block w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-700 transition-all"
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="documento" className="block text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">
                CPF/CNPJ
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                </div>
                <input
                  type="text"
                  id="documento"
                  className="block w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-700 transition-all"
                  placeholder="000.000.000-00"
                  value={documento}
                  onChange={e => setDocumento(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">
                E-mail
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                </div>
                <input
                  type="email"
                  id="email"
                  className="block w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-700 transition-all"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['PIX', 'BOLETO', 'CREDIT_CARD'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBillingType(type)}
                    className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      billingType === type
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-950/50 text-slate-400 hover:bg-slate-900 border border-white/10'
                    }`}
                  >
                    {type === 'CREDIT_CARD' ? 'Cartão' : type}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest rounded-xl border border-red-500/20"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-8 py-5 border border-transparent text-lg font-bold rounded-2xl text-slate-950 bg-cyan-400 hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></div>
              ) : (
                <>Gerar Link de Pagamento</>
              )}
            </button>
          </form>

          <div className="mt-10 flex items-center justify-center space-x-4 text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
            <div className="flex items-center">
              <Lock className="w-3 h-3 mr-2" /> SSL 256-bit
            </div>
            <div className="w-1 h-1 bg-slate-800 rounded-full"></div>
            <div className="flex items-center">
              <ShieldCheck className="w-3 h-3 mr-2" /> Asaas Verified
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
