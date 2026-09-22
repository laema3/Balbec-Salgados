import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Plus, Trash2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api.js';
import { BusinessHours, SpecialDate } from '../../types.js';
import { useToast } from '../../context/ToastContext.js';

const dayNames = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export const AdminHours: React.FC = () => {
  const { showToast } = useToast();
  const [hours, setHours] = useState<BusinessHours[]>([]);
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [newSpecialDate, setNewSpecialDate] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    is_closed: true,
  });

  useEffect(() => {
    loadHours();
  }, []);

  const loadHours = async () => {
    try {
      const [hrs, sDates] = await Promise.all([
        api.getBusinessHours(),
        api.getSpecialDates(),
      ]);
      setHours(hrs || []);
      setSpecialDates(sDates || []);
    } catch (e: any) {
      showToast(`Erro ao carregar horários: ${e.message}`, 'error');
    }
  };

  const handleHourChange = (dayIndex: number, field: string, value: any) => {
    setHours(prev =>
      prev.map(h => (h.day_of_week === dayIndex ? { ...h, [field]: value } : h))
    );
  };

  const handleSaveHours = async () => {
    try {
      await api.updateBusinessHours(hours);
      showToast('Horários de atendimento salvos com sucesso!', 'success');
    } catch (e: any) {
      showToast(`Erro ao salvar horários: ${e.message}`, 'error');
    }
  };

  const handleAddSpecialDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecialDate.description) return;

    try {
      const created = await api.createSpecialDate(newSpecialDate);
      setSpecialDates(prev => [...prev, created]);
      setNewSpecialDate({
        date: new Date().toISOString().split('T')[0],
        description: '',
        is_closed: true,
      });
      showToast('Data especial cadastrada com sucesso!', 'success');
    } catch (e: any) {
      showToast(`Erro ao cadastrar data especial: ${e.message}`, 'error');
    }
  };

  const handleDeleteSpecialDate = async (id: string) => {
    try {
      await api.deleteSpecialDate(id);
      setSpecialDates(prev => prev.filter(s => s.id !== id));
      showToast('Data especial removida com sucesso!', 'success');
    } catch (e: any) {
      showToast(`Erro ao remover data especial: ${e.message}`, 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Horários de Atendimento da Fábrica
          </h2>
          <p className="text-xs text-stone-500">
            Defina os turnos semanais de operação e feriados/recessos da expedição.
          </p>
        </div>

        <button
          onClick={handleSaveHours}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-xs transition"
        >
          Salvar Alterações
        </button>
      </div>

      {/* Regular Days of Week */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-5 space-y-4">
        <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Grade Semanal de Expediente</span>
        </h3>

        <div className="space-y-3">
          {hours.map(h => (
            <div
              key={h.day_of_week}
              className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                h.enabled ? 'bg-stone-50/50 border-stone-200' : 'bg-stone-100/50 border-stone-200/50 opacity-70'
              }`}
            >
              <div className="w-36 flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`day-open-${h.day_of_week}`}
                  checked={h.enabled}
                  onChange={e => handleHourChange(h.day_of_week, 'enabled', e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor={`day-open-${h.day_of_week}`} className="font-bold text-stone-900 cursor-pointer">
                  {dayNames[h.day_of_week] || h.day_name}
                </label>
              </div>

              {h.enabled ? (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-stone-500 font-medium">Turno 1:</span>
                    <input
                      type="time"
                      value={h.shift1_start}
                      onChange={e => handleHourChange(h.day_of_week, 'shift1_start', e.target.value)}
                      className="p-1.5 rounded-lg border border-stone-200 bg-white font-mono text-xs"
                    />
                    <span className="text-stone-400">às</span>
                    <input
                      type="time"
                      value={h.shift1_end}
                      onChange={e => handleHourChange(h.day_of_week, 'shift1_end', e.target.value)}
                      className="p-1.5 rounded-lg border border-stone-200 bg-white font-mono text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id={`shift2-${h.day_of_week}`}
                      checked={h.shift2_enabled}
                      onChange={e => handleHourChange(h.day_of_week, 'shift2_enabled', e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <label htmlFor={`shift2-${h.day_of_week}`} className="text-stone-500 font-medium cursor-pointer">
                      Turno 2:
                    </label>
                    {h.shift2_enabled && (
                      <>
                        <input
                          type="time"
                          value={h.shift2_start || '13:00'}
                          onChange={e => handleHourChange(h.day_of_week, 'shift2_start', e.target.value)}
                          className="p-1.5 rounded-lg border border-stone-200 bg-white font-mono text-xs"
                        />
                        <span className="text-stone-400">às</span>
                        <input
                          type="time"
                          value={h.shift2_end || '18:00'}
                          onChange={e => handleHourChange(h.day_of_week, 'shift2_end', e.target.value)}
                          className="p-1.5 rounded-lg border border-stone-200 bg-white font-mono text-xs"
                        />
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-xs text-stone-400 italic">Fechado o dia todo</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Special Dates & Feriados */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-5 space-y-4">
        <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span>Feriados e Recessos Programados</span>
        </h3>

        {/* Add Form */}
        <form onSubmit={handleAddSpecialDate} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row items-center gap-3 text-xs">
          <div className="w-full sm:w-44">
            <input
              type="date"
              required
              value={newSpecialDate.date}
              onChange={e => setNewSpecialDate({ ...newSpecialDate, date: e.target.value })}
              className="w-full p-2 rounded-xl border border-stone-200 bg-white"
            />
          </div>

          <div className="w-full sm:flex-1">
            <input
              type="text"
              required
              placeholder="Ex: Feriado da Consciência Negra / Recesso de Fim de Ano"
              value={newSpecialDate.description}
              onChange={e => setNewSpecialDate({ ...newSpecialDate, description: e.target.value })}
              className="w-full p-2 rounded-xl border border-stone-200 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isClosedSpecial"
              checked={newSpecialDate.is_closed}
              onChange={e => setNewSpecialDate({ ...newSpecialDate, is_closed: e.target.checked })}
              className="rounded text-amber-600"
            />
            <label htmlFor="isClosedSpecial" className="text-stone-700 font-semibold cursor-pointer">
              Fechado
            </label>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition"
          >
            Adicionar Data
          </button>
        </form>

        {/* Special dates list */}
        <div className="space-y-2">
          {specialDates.map(sd => (
            <div
              key={sd.id}
              className="p-3 rounded-2xl border border-stone-200 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-1 rounded-lg">
                  {sd.date}
                </span>
                <span className="font-semibold text-stone-800">{sd.description}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                  {sd.is_closed ? 'Fábrica Fechada' : 'Horário Especial'}
                </span>
              </div>

              <button
                onClick={() => handleDeleteSpecialDate(sd.id)}
                className="p-1 text-stone-400 hover:text-rose-600 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
