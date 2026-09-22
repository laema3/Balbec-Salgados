import { Order } from '../../src/types.js';
import { db } from '../db.js';

export class NtfyService {
  /**
   * Envia notificação para o tópico configurado no NTFY.
   * Não bloqueia a criação do pedido caso o serviço esteja indisponível.
   */
  async notifyNewOrder(order: Order): Promise<boolean> {
    const settings = db.getSystemSettings();

    if (!settings.ntfy_enabled) {
      console.log('[NtfyService] Notificações NTFY estão desativadas nas configurações.');
      return false;
    }

    const ntfyUrl = (settings.ntfy_url || 'https://ntfy.sh').replace(/\/+$/, '');
    const topic = settings.ntfy_topic || 'balbec_pedidos';
    const targetEndpoint = `${ntfyUrl}/${topic}`;

    const lines = [
      `Pedido: ${order.order_number}`,
      `Franqueado: ${order.franchisee_name || 'Franqueado Balbec'}`,
      `Total: R$ ${order.total.toFixed(2)}`,
      `Pagamento: ${order.payment_method}`,
      `Retirada: ${order.prep_time_minutes || 50} minutos (${order.pickup_location})`,
      `Itens: ${order.items.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}`,
    ];

    const bodyText = lines.join('\n');

    try {
      const headers: Record<string, string> = {
        'Title': 'NOVO PEDIDO BALBEC',
        'Priority': 'high',
        'Tags': 'package,bell',
      };

      if (settings.ntfy_token) {
        headers['Authorization'] = `Bearer ${settings.ntfy_token}`;
      }

      console.log(`[NtfyService] Enviando push para ${targetEndpoint}...`);

      const response = await fetch(targetEndpoint, {
        method: 'POST',
        headers,
        body: bodyText,
        signal: AbortSignal.timeout(4000),
      }).catch(err => {
        console.warn('[NtfyService] Falha de conexão com NTFY (pedido permanece seguro):', err.message);
        return null;
      });

      if (response && response.ok) {
        console.log('[NtfyService] Notificação enviada com sucesso ao NTFY.');
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('[NtfyService] Exceção ao notificar NTFY:', err.message);
      return false;
    }
  }

  async testNotification(): Promise<{ success: boolean; message: string }> {
    const settings = db.getSystemSettings();
    const ntfyUrl = (settings.ntfy_url || 'https://ntfy.sh').replace(/\/+$/, '');
    const topic = settings.ntfy_topic || 'balbec_pedidos';
    const targetEndpoint = `${ntfyUrl}/${topic}`;

    try {
      const headers: Record<string, string> = {
        'Title': 'TESTE BALBEC B2B',
        'Priority': 'default',
        'Tags': 'white_check_mark',
      };
      if (settings.ntfy_token) {
        headers['Authorization'] = `Bearer ${settings.ntfy_token}`;
      }

      const res = await fetch(targetEndpoint, {
        method: 'POST',
        headers,
        body: `Teste de integração NTFY do Portal do Franqueado Balbec Salgados realizado em ${new Date().toLocaleString('pt-BR')}.`,
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        return { success: true, message: `Notificação de teste enviada com sucesso para ${targetEndpoint}` };
      } else {
        return { success: false, message: `Servidor NTFY respondeu com código ${res.status}` };
      }
    } catch (err: any) {
      return { success: false, message: `Falha na conexão: ${err.message}` };
    }
  }
}

export const ntfyService = new NtfyService();
