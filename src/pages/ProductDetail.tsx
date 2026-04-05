import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, ShoppingCart, Download, Zap, Box } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';

interface Product {
  id: string;
  slug: string;
  nome: string;
  descricao: string;
  descricao_longa: string;
  preco: number;
}

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-slate-950">
      <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold text-white">Produto não encontrado</h1>
      <Link to="/" className="mt-4 text-cyan-400 hover:underline">Voltar para a loja</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-cyan-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
      </div>

      <nav className="relative z-10 glass-panel border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center text-sm font-bold text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest">
              <ChevronLeft className="mr-2 w-4 h-4" /> Catálogo
            </Link>
            <span className="text-xl font-bold text-white tracking-widest uppercase">
              NodoPrime <span className="text-cyan-400">Store</span>
            </span>
            <div className="w-20"></div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-16">
          {/* Product Info */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-6">
                <Zap className="w-3 h-3 mr-2" /> Tecnologia de Elite
              </div>
              <h1 className="text-4xl font-extrabold text-white sm:text-6xl mb-6 tracking-tight leading-tight">
                {product.nome}
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed mb-12">
                {product.descricao}
              </p>
              
              <div className="glass-panel rounded-3xl p-8 mb-12">
                <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-6 flex items-center">
                  <Box className="w-5 h-5 mr-3 text-cyan-400" /> Especificações do Sistema
                </h3>
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>{product.descricao_longa}</ReactMarkdown>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {[
                  "Fluxos n8n prontos para importar",
                  "Schema SQL completo",
                  "Prompts de IA otimizados",
                  "Guia de configuração passo a passo"
                ].map((item, i) => (
                  <div key={i} className="flex items-center p-4 rounded-2xl bg-white/5 border border-white/5">
                    <CheckCircle2 className="flex-shrink-0 h-5 w-5 text-cyan-400" />
                    <p className="ml-3 text-sm text-slate-300 font-medium">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Pricing Card */}
          <div className="mt-16 lg:mt-0 lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-panel rounded-3xl p-10 sticky top-24 glow-cyan"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Licença Perpétua</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-widest">
                  Ready to Deploy
                </span>
              </div>
              
              <div className="mb-8">
                <p className="text-5xl font-black text-white tracking-tighter">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco)}
                </p>
                <p className="mt-4 text-sm text-slate-500 leading-relaxed">
                  Pagamento único. Acesso imediato a toda a infraestrutura do sistema via download seguro.
                </p>
              </div>
              
              <Link
                to={`/checkout/${product.slug}`}
                className="group w-full flex items-center justify-center px-8 py-5 border border-transparent text-lg font-bold rounded-2xl text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
              >
                <ShoppingCart className="mr-3 w-6 h-6" /> Adquirir Sistema
              </Link>

              <div className="mt-8 space-y-4">
                <div className="flex items-center text-xs text-slate-500 font-bold uppercase tracking-widest">
                  <Download className="mr-3 w-4 h-4 text-cyan-500" /> Entrega via ZIP Instantânea
                </div>
                <div className="flex items-center text-xs text-slate-500 font-bold uppercase tracking-widest">
                  <Zap className="mr-3 w-4 h-4 text-cyan-500" /> Suporte à Implementação
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-white/5">
                <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] text-center">
                  Transação segura via Asaas Protocol
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
