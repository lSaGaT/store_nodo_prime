import { useState, useEffect } from 'react';
import { Upload, Package, DollarSign, Key, FileText, Link as LinkIcon, CheckCircle2, AlertCircle, Zap, LogOut, User, Trash2, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase-client';

interface Product {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  preco: number;
  ativo: boolean;
  created_at: string;
}

export default function Admin() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('lucas@teste.com');
  const [loginPassword, setLoginPassword] = useState('Lucas145');
  const [loginLoading, setLoginLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    slug: '',
    descricao: '',
    descricao_longa: '',
    preco: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // Perfil não encontrado, tenta criar um padrão
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([{ 
          id: userId, 
          email: session?.user?.email, 
          role: ['soundsvibee@gmail.com', 'lucas@teste.com'].includes(session?.user?.email || '') ? 'admin' : 'atendente' 
        }])
        .select()
        .single();
      
      if (newProfile) data = newProfile;
    }

    if (data) setProfile(data);
    setAuthLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) setError(error.message);
    setLoginLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function fetchProducts() {
    setProductsLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    } finally {
      setProductsLoading(false);
    }
  }

  async function handleDelete(productId: string) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    setDeleteLoading(productId);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: session?.access_token }),
      });

      const result = await res.json();
      if (result.ok) {
        fetchProducts(); // Refresh list
      } else {
        alert(result.error || 'Erro ao excluir produto');
      }
    } catch (err) {
      alert('Erro de conexão');
    } finally {
      setDeleteLoading(null);
    }
  }

  // Load products when admin is logged in
  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchProducts();
    }
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setError('Selecione um arquivo ZIP');
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    data.append('file', file);
    // Send the access token for backend verification
    data.append('accessToken', session?.access_token || '');

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: data,
      });

      const result = await res.json();

      if (result.ok) {
        setSuccess(true);
        setFormData({ nome: '', slug: '', descricao: '', descricao_longa: '', preco: '' });
        setFile(null);
      } else {
        setError(result.error || 'Erro ao fazer upload');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full glass-panel rounded-3xl p-10 glow-cyan relative z-10"
        >
          <div className="text-center mb-10">
            <div className="mx-auto w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/20">
              <Key className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Acesso Admin</h2>
            <p className="mt-3 text-slate-500 text-sm leading-relaxed">
              {session ? (
                <>
                  Seu usuário não tem permissão de administrador.
                  <br />
                  <span className="text-xs text-slate-600 mt-2 block">
                    Role atual: <span className="text-cyan-400">{profile?.role || 'Não encontrado'}</span>
                  </span>
                  {['soundsvibee@gmail.com', 'lucas@teste.com'].includes(session.user.email || '') && profile?.role !== 'admin' && (
                    <button
                      onClick={async () => {
                        const { error } = await supabase
                          .from('profiles')
                          .upsert({ id: session.user.id, email: session.user.email, role: 'admin' });
                        if (!error) window.location.reload();
                      }}
                      className="mt-4 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold rounded-lg hover:bg-cyan-500/20 transition-all"
                    >
                      Ativar Modo Admin (Apenas Dono)
                    </button>
                  )}
                </>
              ) : 'Identifique-se para acessar o terminal de controle.'}
            </p>
          </div>

          {!session ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">E-mail</label>
                <input
                  type="email"
                  className="block w-full px-4 py-4 bg-slate-950/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-700 transition-all"
                  placeholder="admin@nodoprime.com.br"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Senha</label>
                <input
                  type="password"
                  className="block w-full px-4 py-4 bg-slate-950/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-700 transition-all"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="p-4 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest rounded-xl border border-red-500/20">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center px-8 py-5 border border-transparent text-lg font-bold rounded-2xl text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20"
              >
                {loginLoading ? <div className="w-6 h-6 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin"></div> : 'Entrar'}
              </button>
            </form>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-8 py-5 border border-white/10 text-lg font-bold rounded-2xl text-white hover:bg-white/5 transition-all"
            >
              <LogOut className="mr-3 w-6 h-6" /> Sair
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-cyan-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
              <User className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Logado como</p>
              <p className="text-sm font-bold text-white">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <LogOut className="mr-2 w-4 h-4" /> Sair
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl overflow-hidden glow-cyan"
        >
          <div className="bg-cyan-500/10 border-b border-cyan-500/20 px-10 py-8">
            <h1 className="text-2xl font-bold text-white flex items-center uppercase tracking-widest">
              <Key className="mr-4 w-6 h-6 text-cyan-400" /> Terminal de Controle
            </h1>
            <p className="text-slate-500 mt-2 text-xs font-bold uppercase tracking-widest">Acesso Restrito // NodoPrime Protocol</p>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Nome do Sistema</label>
                <div className="relative group">
                  <Package className="absolute left-4 top-4 h-5 w-5 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type="text"
                    className="block w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-700 transition-all"
                    placeholder="Ex: CRM Imobiliário"
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Slug (URL)</label>
                <div className="relative group">
                  <LinkIcon className="absolute left-4 top-4 h-5 w-5 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type="text"
                    className="block w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-700 transition-all"
                    placeholder="ex: crm-imobiliario"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Descrição Curta</label>
                <input
                  type="text"
                  className="block w-full px-4 py-4 bg-slate-950/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-700 transition-all"
                  placeholder="Subtítulo que aparece no catálogo"
                  value={formData.descricao}
                  onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Descrição Longa (Markdown)</label>
                <textarea
                  rows={6}
                  className="block w-full px-4 py-4 bg-slate-950/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-700 transition-all resize-none"
                  placeholder="Detalhes do que está incluso no ZIP..."
                  value={formData.descricao_longa}
                  onChange={e => setFormData({ ...formData, descricao_longa: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Preço (BRL)</label>
                <div className="relative group">
                  <DollarSign className="absolute left-4 top-4 h-5 w-5 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type="number"
                    step="0.01"
                    className="block w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-white placeholder-slate-700 transition-all"
                    placeholder="0.00"
                    value={formData.preco}
                    onChange={e => setFormData({ ...formData, preco: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Pacote de Dados (ZIP)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".zip"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-500 file:mr-6 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-widest file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 transition-all cursor-pointer"
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest rounded-xl border border-red-500/20 flex items-center"
              >
                <AlertCircle className="mr-3 w-5 h-5" /> {error}
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-green-500/10 text-green-400 text-xs font-bold uppercase tracking-widest rounded-xl border border-green-500/20 flex items-center"
              >
                <CheckCircle2 className="mr-3 w-5 h-5" /> Sistema injetado com sucesso!
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
                <>
                  <Zap className="mr-3 w-6 h-6" /> Publicar Ecossistema
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Products List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 glass-panel rounded-3xl overflow-hidden glow-cyan"
        >
          <div className="bg-cyan-500/10 border-b border-cyan-500/20 px-10 py-6 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center uppercase tracking-widest">
              <Package className="mr-3 w-5 h-5 text-cyan-400" /> Ecossistemas Ativos
            </h2>
            <button
              onClick={fetchProducts}
              disabled={productsLoading}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-cyan-400 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${productsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="p-6">
            {productsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Nenhum ecossistema encontrado
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      product.ativo
                        ? 'bg-white/5 border-white/10 hover:border-cyan-500/30'
                        : 'bg-red-500/5 border-red-500/20 opacity-60'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className={`font-bold ${product.ativo ? 'text-white' : 'text-red-400'}`}>
                          {product.nome}
                        </h3>
                        {!product.ativo && (
                          <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-widest bg-red-500/20 text-red-400 rounded">
                            Inativo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {product.slug} • R$ {product.preco?.toFixed(2)}
                      </p>
                    </div>
                    {product.ativo && (
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={deleteLoading === product.id}
                        className="ml-4 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                        title="Excluir produto"
                      >
                        {deleteLoading === product.id ? (
                          <div className="w-4 h-4 border-2 border-red-400/20 border-t-red-400 rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
