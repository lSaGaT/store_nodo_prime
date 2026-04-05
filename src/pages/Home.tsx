import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, ArrowRight, Zap, Shield, Cpu } from 'lucide-react';
import { motion } from 'motion/react';

interface Product {
  id: string;
  slug: string;
  nome: string;
  descricao: string;
  preco: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse-slow"></div>
      </div>

      {/* Hero Section */}
      <header className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Zap className="w-3 h-3 mr-2" /> Sistemas de Próxima Geração
          </div>
          <h1 className="text-5xl font-extrabold text-white tracking-tight sm:text-7xl mb-6">
            NodoPrime <span className="text-cyan-400 text-glow">Store</span>
          </h1>
          <p className="mt-4 text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Acesse ecossistemas completos de automação inteligente. 
            Fluxos n8n, SQL e IA prontos para escalar sua operação.
          </p>
        </motion.div>
      </header>

      {/* Features Bar */}
      <div className="max-w-7xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Cpu, title: "Automação Pura", desc: "Fluxos n8n otimizados" },
            { icon: Shield, title: "Seguro & Privado", desc: "Infraestrutura robusta" },
            { icon: Zap, title: "Deploy Instantâneo", desc: "ZIP pronto para uso" }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="glass-panel p-4 rounded-2xl flex items-center space-x-4"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <feature.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{feature.title}</h3>
                <p className="text-xs text-slate-500">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Catalog */}
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 relative">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-y-10 gap-x-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {products.map((product) => (
              <motion.div 
                key={product.id} 
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="group relative glass-panel rounded-3xl overflow-hidden hover:border-cyan-500/40 transition-all duration-300 glow-cyan"
              >
                <div className="aspect-w-16 aspect-h-9 bg-slate-900/50 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent"></div>
                  <Package className="w-16 h-16 text-cyan-500/20 group-hover:text-cyan-500/40 transition-colors duration-500" />
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                      <Link to={`/produto/${product.slug}`}>
                        <span aria-hidden="true" className="absolute inset-0" />
                        {product.nome}
                      </Link>
                    </h3>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-6 leading-relaxed">
                    {product.descricao}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <p className="text-2xl font-black text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco)}
                    </p>
                    <div className="flex items-center text-xs font-bold text-cyan-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                      Explorar <ArrowRight className="ml-2 w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-24 glass-panel rounded-3xl">
            <Package className="mx-auto h-16 w-16 text-slate-700" />
            <h3 className="mt-4 text-xl font-bold text-white">Sistemas em Desenvolvimento</h3>
            <p className="mt-2 text-slate-500">Nossa inteligência está processando novos ecossistemas.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-24 py-12 border-t border-white/5 text-center">
        <p className="text-slate-600 text-sm font-display tracking-widest uppercase mb-4">
          &copy; 2026 NodoPrime Store // Automação Inteligente
        </p>
        <Link to="/admin" className="text-slate-700 hover:text-cyan-400 text-xs font-bold uppercase tracking-widest transition-colors">
          Terminal Admin
        </Link>
      </footer>
    </div>
  );
}
