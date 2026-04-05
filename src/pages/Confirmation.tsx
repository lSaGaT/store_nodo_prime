import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, Download, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Confirmation() {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const [status, setStatus] = useState<'pending' | 'paid' | 'error' | 'not_found'>('pending');
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/status/${paymentId}`);
        const data = await res.json();

        if (data.status === 'paid') {
          setStatus('paid');
          setToken(data.token);
          setExpiresAt(data.expiresAt);
          return true;
        } else if (data.status === 'not_found') {
          setStatus('not_found');
          return true;
        }
      } catch (err) {
        console.error('Erro ao verificar status:', err);
      }
      return false;
    };

    checkStatus();
    const interval = setInterval(async () => {
      const stop = await checkStatus();
      if (stop) clearInterval(interval);
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-panel rounded-3xl p-10 text-center glow-cyan relative z-10"
      >
        {status === 'pending' && (
          <>
            <div className="mx-auto w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mb-8 border border-cyan-500/20 relative">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin"></div>
              <Clock className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Aguardando Protocolo</h2>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed">
              Estamos monitorando a confirmação do seu pagamento no Asaas. 
              Esta página será atualizada automaticamente.
            </p>
            <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em]">
              <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3 animate-ping"></div>
              Sincronizando com o servidor...
            </div>
          </>
        )}

        {status === 'paid' && (
          <>
            <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-8 border border-green-500/20">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Acesso Liberado</h2>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed">
              Pagamento confirmado com sucesso. Seu ecossistema está pronto para download.
            </p>
            
            <div className="mt-10 space-y-6">
              <a
                href={`/api/download/${token}`}
                className="w-full flex items-center justify-center px-8 py-5 border border-transparent text-lg font-bold rounded-2xl text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
              >
                <Download className="mr-3 w-6 h-6" /> Baixar Sistema (ZIP)
              </a>
              
              <div className="p-5 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-left">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-[10px] font-bold text-amber-200 uppercase tracking-widest">
                    <p className="mb-2 text-amber-500">Protocolo de Segurança:</p>
                    <ul className="space-y-1 opacity-80">
                      <li>• Link válido por 24 horas</li>
                      <li>• Limite de 1 download por IP</li>
                      <li>• Expira: {new Date(expiresAt!).toLocaleString('pt-BR')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {status === 'not_found' && (
          <>
            <div className="mx-auto w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Erro de Protocolo</h2>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed">Não conseguimos localizar as informações deste pagamento.</p>
            <Link to="/" className="mt-10 inline-block text-cyan-400 font-bold uppercase tracking-widest text-xs hover:underline">Voltar para a loja</Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
