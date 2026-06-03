/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Clock, 
  TrendingUp, 
  User, 
  Phone, 
  Check, 
  X, 
  DollarSign, 
  Plus, 
  Search, 
  Settings, 
  Play, 
  Pause, 
  Calendar,
  AlertCircle,
  Database,
  BarChart2,
  Trash2
} from 'lucide-react';
import { auth, db, showToast } from '../lib/firebase';
import { Barber, Appointment, CashLog, PaymentMethod, ClientCategory, BarberStatus } from '../types';

interface BarberViewProps {
  barbers: Barber[];
  onUpdateBarberInfo: (updated: Barber) => void;
  appointments: Appointment[];
  onUpdateAppointments: (newAppointments: Appointment[]) => void;
  cashLogs: CashLog[];
  onUpdateCashLogs: (newLogs: CashLog[]) => void;
}

export default function BarberView({
  barbers,
  onUpdateBarberInfo,
  appointments,
  onUpdateAppointments,
  cashLogs,
  onUpdateCashLogs,
}: BarberViewProps) {
  // 1. Selector to simulate logging in as different barbers
  const [selectedBarberId, setSelectedBarberId] = useState<string>(barbers[0]?.id || '');
  const activeBarber = barbers.find(b => b.id === selectedBarberId) || barbers[0];

  // Active navigation tab on the barber screen
  const [activeTab, setActiveTab] = useState<'queue' | 'dashboard' | 'clients' | 'settings'>('queue');

  // Search input in Clients list
  const [clientSearchText, setClientSearchText] = useState('');

  // Queue adder form states
  const [showAddQueueModal, setShowAddQueueModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCategory, setClientCategory] = useState<ClientCategory>('adult');
  const [startHour, setStartHour] = useState('12:00');
  const [duration, setDuration] = useState(30); // minutes
  const [servicePrice, setServicePrice] = useState(60000);

  // Financial logging form states
  const [newLogType, setNewLogType] = useState<'income' | 'expense'>('expense');
  const [newLogAmount, setNewLogAmount] = useState('');
  const [newLogLabel, setNewLogLabel] = useState('');
  const [newLogDesc, setNewLogDesc] = useState('');

  // Active workflow checkout states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutAppointment, setCheckoutAppointment] = useState<Appointment | null>(null);

  if (!activeBarber) {
    return (
      <div className="bg-white p-8 rounded-2xl border text-center text-slate-500">
        Нет доступных барберов. Пожалуйста, добавьте барбера в панели Владельца.
      </div>
    );
  }

  const todayStr = '2026-06-02';

  // Get appointments specifically for this barber, ordered by chronological order
  const barberAllAppointments = appointments.filter(a => a.barberId === activeBarber.id && a.date === todayStr);

  const pendingQueue = barberAllAppointments.filter(a => a.status === 'pending')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const currentActiveClient = barberAllAppointments.find(a => a.status === 'active');
  const finishedCutsCount = barberAllAppointments.filter(a => a.status === 'completed').length;
  const adultsCount = barberAllAppointments.filter(a => a.status === 'completed' && a.category === 'adult').length;
  const kidsCount = barberAllAppointments.filter(a => a.status === 'completed' && a.category === 'child').length;

  // Working schedule generation in local perspective to show occupied vs free slots
  // We divide the workday starting from startHour to endHour into slot increments of 30 mins
  const getDailyScheduleTimeline = () => {
    const list: { time: string; status: 'free' | 'pending' | 'active' | 'completed' | 'skipped'; client?: string }[] = [];
    const [startH, startM] = activeBarber.workingHours.start.split(':').map(Number);
    const [endH, endM] = activeBarber.workingHours.end.split(':').map(Number);

    let currentHour = startH;
    let currentMinute = startM;

    while (currentHour < endH || (currentHour === endH && currentMinute < endM)) {
      const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Determine if an appointment covers this time
      const matchingApp = barberAllAppointments.find(a => {
        return a.startTime <= timeStr && a.endTime > timeStr;
      });

      list.push({
        time: timeStr,
        status: matchingApp ? (matchingApp.status as any) : 'free',
        client: matchingApp ? `${matchingApp.clientName} (${matchingApp.clientPhone})` : undefined
      });

      // Advance by 30 mins
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute -= 60;
      }
    }
    return list;
  };

  const timelineSlots = getDailyScheduleTimeline();

  // 1. Barber quick status controls
  const handleStatusChange = (newStatus: BarberStatus) => {
    onUpdateBarberInfo({
      ...activeBarber,
      status: newStatus
    });
    showToast(`Статус изменен на: ${
      newStatus === 'working' ? '🟢 Работает' :
      newStatus === 'busy' ? '🟡 Занят' :
      '🔴 Отдыхает / Болен'
    }`);
  };

  // 2. Add client manually to queue
  const handleAddNewQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) {
      showToast('Пожалуйста, введите имя и телефон клиента');
      return;
    }

    // Compute end time based on minutes
    const [h, m] = startHour.split(':').map(Number);
    let totalMin = m + duration;
    let endH = h + Math.floor(totalMin / 60);
    let endM = totalMin % 60;
    const endHourStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

    const newAppointment: Appointment = {
      id: 'app-' + Date.now(),
      barberId: activeBarber.id,
      clientName,
      clientPhone,
      startTime: startHour,
      endTime: endHourStr,
      date: todayStr,
      category: clientCategory,
      status: 'pending',
      price: servicePrice,
    };

    onUpdateAppointments([...appointments, newAppointment]);
    setShowAddQueueModal(false);
    
    // Reset Form
    setClientName('');
    setClientPhone('');
    showToast(`Клиент ${clientName} успешно добавлен в очередь на ${startHour}!`);
  };

  // 3. Command queue: Accept (Принять) a client, change status to 'active'
  const handleAcceptClient = (appId: string) => {
    if (currentActiveClient) {
      showToast('У вас уже есть один обслуживаемый клиент в кресле!');
      return;
    }

    const updated = appointments.map(a => {
      if (a.id === appId) {
        return { ...a, status: 'active' as const };
      }
      return a;
    });
    onUpdateAppointments(updated);
    
    // Also change barber status automatically to active 'working' status
    onUpdateBarberInfo({ ...activeBarber, status: 'working' });
    
    const client = appointments.find(a => a.id === appId);
    if (client) {
      showToast(`Клиент ${client.clientName} приглашен в кресло! Работа начата.`);
    }
  };

  // 4. Command queue: Skip/Pass (Пропустить) a client
  const handleSkipClient = (appId: string) => {
    const updated = appointments.map(a => {
      if (a.id === appId) {
        return { ...a, status: 'skipped' as const };
      }
      return a;
    });
    onUpdateAppointments(updated);
    const client = appointments.find(a => a.id === appId);
    if (client) {
      showToast(`Клиент ${client.clientName} помечен как 'Пропущен'.`);
    }
  };

  // 5. Open checkout panel to finalize service
  const handleOpenCheckout = (app: Appointment) => {
    setCheckoutAppointment(app);
    setShowCheckoutModal(true);
  };

  // 6. Stop and complete service with payment choice selection
  const handleCompleteCheckout = (paymentMethod: PaymentMethod) => {
    if (!checkoutAppointment) return;

    // 1. Update appointment status to completed and record payment details
    const updatedAppointments = appointments.map(a => {
      if (a.id === checkoutAppointment.id) {
        return { 
          ...a, 
          status: 'completed' as const,
          paymentMethod
        };
      }
      return a;
    });
    onUpdateAppointments(updatedAppointments);

    // 2. Automatically generate corresponding ledger log (Kirim)
    const newLog: CashLog = {
      id: 'log-' + Date.now(),
      barberId: activeBarber.id,
      type: 'income',
      amount: checkoutAppointment.price,
      category: `Стрижка (${checkoutAppointment.category === 'adult' ? 'Взрослый' : 'Детский'})`,
      date: todayStr,
      description: `Услуга завершена для ${checkoutAppointment.clientName}, оплата через ${
        paymentMethod === 'cash' ? 'Наличные' :
        paymentMethod === 'card' ? 'Карту' : 'Click/Payme'
      }`
    };
    onUpdateCashLogs([newLog, ...cashLogs]);

    setShowCheckoutModal(false);
    setCheckoutAppointment(null);
    showToast(`Оплата принята! Сумма +${newLog.amount.toLocaleString()} UZS зачислена в вашу статистику.`);
  };

  // 7. Manual financial logs (Adding expenses/supplies or generic cuts)
  const handleAddCustomLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogAmount || !newLogLabel) {
      showToast('Пожалуйста, введите сумму и категорию');
      return;
    }

    const log: CashLog = {
      id: 'log-' + Date.now(),
      barberId: activeBarber.id,
      type: newLogType,
      amount: Number(newLogAmount),
      category: newLogLabel,
      date: todayStr,
      description: newLogDesc || 'Ручной лог барбера'
    };

    onUpdateCashLogs([log, ...cashLogs]);
    setNewLogAmount('');
    setNewLogLabel('');
    setNewLogDesc('');
    showToast(log.type === 'income' ? 'Доход успешно зафиксирован!' : 'Расход успешно сохранен!');
  };

  // Filter local logs for statistical analysis
  const localBarberLogs = cashLogs.filter(l => l.barberId === activeBarber.id);
  const totalRevenueThisMonth = localBarberLogs
    .filter(l => l.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);
  const totalExpensesThisMonth = localBarberLogs
    .filter(l => l.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);

  // Search database clients
  const getSearchableClients = () => {
    // Collect all appointments made across this barber inside database history
    const clientsMap: { [phone: string]: { name: string; category: ClientCategory; totalSpent: number; totalVisits: number; skippedCount: number } } = {};
    
    appointments.filter(a => a.barberId === activeBarber.id).forEach(app => {
      if (!clientsMap[app.clientPhone]) {
        clientsMap[app.clientPhone] = {
          name: app.clientName,
          category: app.category,
          totalSpent: 0,
          totalVisits: 0,
          skippedCount: 0
        };
      }
      
      if (app.status === 'completed') {
        clientsMap[app.clientPhone].totalVisits += 1;
        clientsMap[app.clientPhone].totalSpent += app.price;
      } else if (app.status === 'skipped') {
        clientsMap[app.clientPhone].skippedCount += 1;
      }
    });

    const list = Object.entries(clientsMap).map(([phone, val]) => ({
      phone,
      ...val
    }));

    if (!clientSearchText) return list;
    return list.filter(c => 
      c.name.toLowerCase().includes(clientSearchText.toLowerCase()) || 
      c.phone.includes(clientSearchText)
    );
  };

  const customerList = getSearchableClients();

  // Helper mapping for day names
  const dayNameUzb = (num: number) => {
    const uzbDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    return uzbDays[num - 1] || num.toString();
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER: Login simulator and instant availability status switch */}
      <div className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
        
        {/* Left selector */}
        <div className="flex items-center gap-4">
          <img 
            src={activeBarber.avatar} 
            alt={activeBarber.name} 
            className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400/50"
            referrerPolicy="no-referrer"
          />
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Кабинет мастера</label>
            <select
              value={selectedBarberId}
              onChange={(e) => {
                setSelectedBarberId(e.target.value);
                setActiveTab('queue');
              }}
              className="font-bold text-white text-base bg-transparent border-b border-cyan-400/50 outline-none cursor-pointer hover:border-cyan-400 pb-0.5"
            >
              {barbers.map(b => (
                <option key={b.id} value={b.id} className="bg-[#0e1224] text-white">{b.name} {b.isBlocked ? '(Заблокирован)' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Active Availability Status selector */}
        {activeBarber.isBlocked ? (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-450" />
            Ваш аккаунт заблокирован владельцем. Напишите администрации насчет оплаты тарифа.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold uppercase">Мой Текущий статус:</span>
            <div className="inline-flex rounded-xl border border-white/10 p-1 bg-white/5 gap-1">
              
              <button
                onClick={() => handleStatusChange('working')}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeBarber.status === 'working'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                🟢 Работаю
              </button>

              <button
                onClick={() => handleStatusChange('busy')}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeBarber.status === 'busy'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                🟡 Занят
              </button>

              <button
                onClick={() => handleStatusChange('resting_or_sick')}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeBarber.status === 'resting_or_sick'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                🔴 Болен / Выходной
              </button>

            </div>
          </div>
        )}

      </div>

      {/* SUB TAB NAVIGATION BAR */}
      <div className="flex border-b border-white/10 gap-6 relative z-10 overflow-x-auto whitespace-nowrap scrollbar-none pb-0.5 -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { id: 'queue', label: 'Очередь', icon: Users },
          { id: 'dashboard', label: 'Касса и Финансы', icon: TrendingUp },
          { id: 'clients', label: 'База Клиентов', icon: Database },
          { id: 'settings', label: 'График Работы', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-shrink-0 flex items-center gap-2 pb-3 text-sm font-bold transition border-b-2 relative -mb-[2px] cursor-pointer ${
                isSelected 
                  ? 'border-cyan-400 text-cyan-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.id === 'queue' && pendingQueue.length > 0 && (
                <span className="bg-cyan-400 text-[#000] text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold absolute -top-1.5 -right-5 transform translate-x-1">
                  {pendingQueue.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeBarber.isBlocked && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl text-center text-rose-300 font-semibold space-y-2 backdrop-blur-sm z-10 relative">
          <p>Внимание! Все системные панели заблокированы до прохождения инкассации.</p>
          <p className="text-xs font-normal text-rose-400">Пожалуйста, оплатите ежемесячный тариф {activeBarber.monthlyFee.toLocaleString()} UZS.</p>
        </div>
      )}

      {/* DYNAMIC VIEW CONTAINER */}
      {!activeBarber.isBlocked && (
        <div className="space-y-6 relative z-10">
          
          {/* 1. QUEUE MANAGEMENT VIEW */}
          {activeTab === 'queue' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Central: Active client work area and pending queue */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Ayni paytdagi mijoz (Current Client Active) */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-xl">
                  <div className="absolute top-0 left-0 w-2 h-full bg-cyan-400"></div>
                  
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 font-display">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                    Текущий клиент в кресле (Обслуживается)
                  </h3>

                  {currentActiveClient ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                      <div>
                        <h4 className="text-base font-extrabold text-white">{currentActiveClient.clientName}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{currentActiveClient.clientPhone}</p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] bg-white/10 text-slate-200 py-0.5 px-2 rounded-full font-semibold">
                            {currentActiveClient.category === 'adult' ? '🧔 Взрослый' : '👶 Детский'}
                          </span>
                          <span className="text-[10px] bg-cyan-500/20 text-cyan-400 py-0.5 px-2 rounded-full font-semibold">
                            ⏰ {currentActiveClient.startTime} - {currentActiveClient.endTime}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
                        <span className="text-xs text-slate-400">Стоимость стрижки:</span>
                        <p className="text-lg font-bold text-white mb-1">{currentActiveClient.price.toLocaleString('ru-RU')} UZS</p>
                        
                        {/* Complete button */}
                        <button
                          onClick={() => handleOpenCheckout(currentActiveClient)}
                          className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-slate-950 text-xs font-black py-2.5 px-6 rounded-xl transition shadow-lg cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Завершить и принять оплату</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-slate-450">
                      В кресле сейчас свободно. Выберите следующего клиента из таблицы ниже.
                    </div>
                  )}

                </div>

                {/* Queue list table */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl">
                  <div className="p-5 border-b border-white/10 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white font-display">Список Ожидания (Очередь)</h3>
                      <p className="text-xs text-slate-400 mt-1">Клиенты, записанные на сегодня</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        // Prefill some convenient values
                        setStartHour('13:00');
                        setServicePrice(60000);
                        setShowAddQueueModal(true);
                      }}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-650 text-slate-950 text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Записать клиента</span>
                    </button>
                  </div>

                  <div className="divide-y divide-white/5">
                    {pendingQueue.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 text-sm">
                        Очередь пуста на сегодня. Все клиенты обслужены или запись отсутствует.
                      </div>
                    ) : (
                      pendingQueue.map((app, index) => {
                        return (
                          <div key={app.id} className="p-4 hover:bg-white/5 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            
                            {/* Wait spot / info */}
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-white/10 text-slate-100 text-xs font-bold flex items-center justify-center border border-white/10">
                                {index + 1}
                              </span>
                              <div>
                                <h4 className="font-bold text-white text-sm">{app.clientName}</h4>
                                <p className="text-xs text-slate-400 mt-0.5">{app.clientPhone}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[9px] bg-white/5 text-slate-300 py-0.5 px-1.5 rounded-sm uppercase font-semibold border border-white/5">
                                    {app.category === 'adult' ? '🧔 Взрослый' : '👶 Детский'}
                                  </span>
                                  <span className="text-[9px] bg-cyan-500/10 text-cyan-400 py-0.5 px-1.5 rounded-sm uppercase font-semibold flex items-center gap-0.5 border border-cyan-400/20">
                                    <Clock className="w-3 h-3 text-cyan-400" /> {app.startTime} - {app.endTime}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions: Accept or Skip/Pass */}
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                              <span className="text-xs font-bold text-slate-200 mr-2">
                                {app.price.toLocaleString()} UZS
                              </span>

                              {/* Pass button */}
                              <button
                                onClick={() => handleSkipClient(app.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                title="Пропустить очередность"
                              >
                                <X className="w-4 h-4" />
                              </button>

                              {/* Invite in the chair */}
                              <button
                                onClick={() => handleAcceptClient(app.id)}
                                className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-bold py-1.5 px-3 rounded-lg transition-all duration-200 cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 fill-emerald-450" />
                                <span>Принять</span>
                              </button>
                            </div>

                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* Right Sidebar: Visual status cards (Today's counters) and visual schedule list */}
              <div className="space-y-6">
                
                {/* Stats indicators */}
                <div className="bg-white/5 p-5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-xl space-y-4">
                  <h3 className="text-sm font-bold text-white font-display">Статистика Смены</h3>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-cyan-500/10 rounded-xl p-3 text-center border border-cyan-500/25">
                      <p className="text-[10px] text-cyan-400 uppercase font-bold tracking-wide">Обслужено</p>
                      <h4 className="text-lg font-extrabold text-cyan-300 mt-1">{finishedCutsCount}</h4>
                    </div>

                    <div className="bg-teal-500/10 rounded-xl p-3 text-center border border-teal-500/25">
                      <p className="text-[10px] text-teal-400 uppercase font-bold tracking-wide">Взрослые</p>
                      <h4 className="text-lg font-extrabold text-teal-300 mt-1">{adultsCount}</h4>
                    </div>

                    <div className="bg-amber-500/10 rounded-xl p-3 text-center border border-amber-500/25">
                      <p className="text-[10px] text-amber-400 uppercase font-bold tracking-wide">Дети</p>
                      <h4 className="text-lg font-extrabold text-amber-300 mt-1">{kidsCount}</h4>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                    <span>Выручка за сегодня:</span>
                    <span className="font-extrabold text-white text-sm">
                      {localBarberLogs
                        .filter(l => l.type === 'income' && l.date === todayStr)
                        .reduce((acc, obj) => acc + obj.amount, 0).toLocaleString()} UZS
                    </span>
                  </div>
                </div>

                {/* Bugun qaysi vaqtlar bosh yoki band (Daily Hourly timetable) */}
                <div className="bg-white/5 text-slate-100 rounded-2xl p-5 border border-white/10 shadow-xl backdrop-blur-xl space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white font-display">Занятость часовых слотов</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Временная сетка вашей рабочей смены</p>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 bg-transparent">
                    {timelineSlots.map((slot, sIdx) => {
                      return (
                        <div key={sIdx} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-b-0">
                          <span className="font-mono text-slate-300 font-semibold">{slot.time}</span>
                          
                          {slot.status === 'free' ? (
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-medium">Свободно</span>
                          ) : slot.status === 'active' ? (
                            <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded font-extrabold border border-cyan-400/30 animate-pulse">ОБСЛУЖИВАЕТСЯ</span>
                          ) : slot.status === 'completed' ? (
                            <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded font-medium line-through">Готово</span>
                          ) : slot.status === 'skipped' ? (
                            <span className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded font-medium">Пропущен</span>
                          ) : (
                            <span className="text-[10px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded font-semibold">В Очереди</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
              
            </div>
          )}

          {/* 2. FINANCIAL DASHBOARD VIEW (Kirim / Chiqim) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Financial metrics bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0a0c14]/40 p-5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-xl">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Всего доходов за месяц</p>
                  <h4 className="text-2xl font-black text-emerald-450 mt-1">+{totalRevenueThisMonth.toLocaleString()} UZS</h4>
                  <p className="text-xs text-slate-500 mt-1">Все подтвержденные оплаты стрижек клиентов</p>
                </div>

                <div className="bg-[#0a0c14]/40 p-5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-xl">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Расходы за месяц (Резерв)</p>
                  <h4 className="text-2xl font-black text-rose-455 mt-1">-{totalExpensesThisMonth.toLocaleString()} UZS</h4>
                  <p className="text-xs text-slate-500 mt-1">Фиксация материалов, оборудования, косметики</p>
                </div>

                <div className="bg-[#0a0c14]/40 p-5 border border-white/10 rounded-2xl shadow-xl backdrop-blur-xl">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Чистая Прибыль</p>
                  <h4 className="text-2xl font-black text-cyan-400 mt-1">{(totalRevenueThisMonth - totalExpensesThisMonth).toLocaleString()} UZS</h4>
                  <p className="text-xs text-slate-500 mt-1">Кассовый остаток после вычета затрат</p>
                </div>
              </div>

              {/* Financial Charts mockup with custom pristine SVG - anti-slop */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white font-display">Тренды доходов за смену (Сегодня)</h3>
                    <p className="text-xs text-slate-400">График по завершенным чекам</p>
                  </div>
                  
                  <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 py-1 px-3 rounded-lg border border-emerald-500/20">
                    Наличные: {localBarberLogs.filter(l => l.description.includes('Наличные')).reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} UZS
                  </span>
                </div>

                {/* Beautiful custom vector chart representing the earnings */}
                <div className="h-48 w-full border border-white/5 rounded-xl relative overflow-hidden bg-white/5 flex flex-col justify-end p-4">
                  {/* Grid lines */}
                  <div className="absolute inset-x-0 top-1/4 border-t border-white/5 border-dashed"></div>
                  <div className="absolute inset-x-0 top-2/4 border-t border-white/5 border-dashed"></div>
                  <div className="absolute inset-x-0 top-3/4 border-t border-white/5 border-dashed"></div>

                  <div className="h-32 w-full flex items-end gap-5 justify-around z-10">
                    {/* Render live elements */}
                    {[
                      { l: '09:00', sum: 60000 },
                      { l: '10:00', sum: 45000 },
                      { l: '11:00', sum: 70000 },
                      { l: '12:00', sum: 0 },
                      { l: '13:00', sum: 0 },
                      { l: '14:00', sum: 0 },
                    ].map((bar, bIdx) => {
                      // Dynamically calculate height percentage
                      const maxVal = 100000;
                      const pct = Math.min((bar.sum / maxVal) * 100, 100);

                      return (
                        <div key={bIdx} className="flex flex-col items-center gap-2 h-full justify-end w-1/6">
                          {bar.sum > 0 && (
                            <span className="text-[10px] font-bold text-white bg-[#0e1224] border border-white/10 px-1 py-0.5 rounded shadow-sm mb-1">
                              {bar.sum / 1000}k
                            </span>
                          )}
                          <div 
                            style={{ height: `${pct || 4}%` }} 
                            className={`w-full max-w-[32px] rounded-t-md transition-all duration-500 ${
                              pct > 0 ? 'bg-gradient-to-t from-cyan-400 to-blue-500 shadow-md shadow-cyan-400/25' : 'bg-white/10'
                            }`}
                          ></div>
                          <span className="text-[10px] text-slate-500 font-mono">{bar.l}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Ledger (Kirim Chiqim) manual adder and transaction logs list */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Manual Record Form */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-3">
                  <h3 className="text-sm font-bold text-white font-display">Добавить операцию вручную</h3>
                  
                  <form onSubmit={handleAddCustomLog} className="space-y-4">
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Тип операции</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewLogType('income')}
                          className={`text-xs py-2 rounded-lg font-bold border text-center transition cursor-pointer ${
                            newLogType === 'income'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          ➕ Доход (Kirim)
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewLogType('expense')}
                          className={`text-xs py-2 rounded-lg font-bold border text-center transition cursor-pointer ${
                            newLogType === 'expense'
                              ? 'bg-rose-500/10 text-rose-450 border-rose-500/30'
                              : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          ➖ Расход (Chiqim)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Сумма (UZS) *</label>
                      <input
                        type="number"
                        required
                        placeholder="Сумма в сумах..."
                        value={newLogAmount}
                        onChange={(e) => setNewLogAmount(e.target.value)}
                        className="w-full text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-slate-205"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Назначение / Категория *</label>
                      <input
                        type="text"
                        required
                        placeholder="Например: Закупка гелей, Аренда"
                        value={newLogLabel}
                        onChange={(e) => setNewLogLabel(e.target.value)}
                        className="w-full text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 text-slate-205"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Описание</label>
                      <textarea
                        placeholder="Дополнительные детали..."
                        value={newLogDesc}
                        onChange={(e) => setNewLogDesc(e.target.value)}
                        className="w-full text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 border-slate-200 text-slate-205"
                        rows={2}
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-650 text-slate-950 text-xs font-bold py-2.5 rounded-xl transition cursor-pointer"
                    >
                      Сохранить запись
                    </button>

                  </form>
                </div>

                {/* Ledger Listing */}
                <div className="lg:col-span-2 bg-[#0a0c14]/40 border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl">
                  <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase font-display">Журнал ордеров</span>
                    <span className="text-[11px] text-slate-400">Показаны последние операции</span>
                  </div>

                  <div className="divide-y divide-white/5 max-h-[360px] overflow-y-auto">
                    {localBarberLogs.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-450">
                        Кассовых движений пока не проводилось.
                      </div>
                    ) : (
                      localBarberLogs.map((log) => {
                        const isInc = log.type === 'income';
                        return (
                          <div key={log.id} className="p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-all">
                            <div>
                              <p className="text-sm font-bold text-white">{log.category}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{log.description}</p>
                              <span className="text-[9px] bg-white/10 text-slate-300 py-0.5 px-2 rounded-sm font-semibold mt-1 inline-block border border-white/5">
                                {log.date}
                              </span>
                            </div>

                            <span className={`text-sm font-black whitespace-nowrap ${isInc ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isInc ? '+' : '-'} {log.amount.toLocaleString()} UZS
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 3. SEARCHABLE CUSTOMER DATABASE VIEWS */}
          {activeTab === 'clients' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4 text-slate-100">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-white font-display">Постоянные клиенты барбера</h3>
                  <p className="text-xs text-slate-450">Анализ частоты посещений и лояльности</p>
                </div>

                <div className="flex items-center gap-2 border border-white/10 rounded-xl px-3 py-2 bg-white/5 max-w-sm w-full">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={clientSearchText}
                    onChange={(e) => setClientSearchText(e.target.value)}
                    placeholder="Найти по имени или номеру телефона..."
                    className="bg-transparent outline-none text-xs w-full text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Data grid representation */}
              <div className="overflow-x-auto bg-transparent">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-[11px] font-bold uppercase">
                      <th className="py-3 px-2">Клиент</th>
                      <th className="py-3 px-2">Категория</th>
                      <th className="py-3 px-2 text-center">Визитов</th>
                      <th className="py-3 px-2 text-center">Пропущенных</th>
                      <th className="py-3 px-2 text-right">Потрачено в кассу</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    {customerList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-450 text-sm bg-transparent">
                          Клиенты отсутствуют. Выполните стрижку, чтобы добавить их в базу!
                        </td>
                      </tr>
                    ) : (
                      customerList.map((client, cIdx) => (
                        <tr key={cIdx} className="hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-2">
                            <p className="font-bold text-white">{client.name}</p>
                            <p className="text-[10px] text-slate-500">{client.phone}</p>
                          </td>
                          <td className="py-3.5 px-2">
                            <span className="bg-white/10 text-slate-300 px-2 py-0.5 rounded font-mono text-[9px] uppercase border border-white/5">
                              {client.category === 'adult' ? '🧔 Взрослый' : '👶 Детский'}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-center font-bold text-cyan-400 font-mono">{client.totalVisits}</td>
                          <td className="py-3.5 px-2 text-center font-bold text-rose-455 font-mono">{client.skippedCount}</td>
                          <td className="py-3.5 px-2 text-right font-black text-white font-mono">
                            {client.totalSpent.toLocaleString()} UZS
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* 4. SETTINGS & PROFILE CONSTANTS VIEW */}
          {activeTab === 'settings' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-xl max-w-2xl text-slate-100">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-4 flex items-center gap-2 font-display">
                <Settings className="w-5 h-5 text-cyan-400" />
                Настройка графика работы и личных параметров
              </h3>

              <div className="space-y-6 pt-5">
                
                {/* Working Days of week toggle interface */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Рабочие дни смены</label>
                  <p className="text-xs text-slate-400 mb-3">Выберите дни недели, когда клиенты могут резервировать ваше время</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map(num => {
                      const isWorking = activeBarber.workingDays.includes(num);
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            const nextDays = isWorking
                              ? activeBarber.workingDays.filter(n => n !== num)
                              : [...activeBarber.workingDays, num].sort();
                            
                            onUpdateBarberInfo({
                              ...activeBarber,
                              workingDays: nextDays
                            });
                            showToast(`Смена изменена!`);
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            isWorking
                              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 border-cyan-400 font-extrabold'
                              : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {dayNameUzb(num)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Working Hours range settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Начало работы</label>
                    <input
                      type="time"
                      value={activeBarber.workingHours.start}
                      onChange={(e) => {
                        onUpdateBarberInfo({
                          ...activeBarber,
                          workingHours: { ...activeBarber.workingHours, start: e.target.value }
                        });
                        showToast(`Время начала работы изменено.`);
                      }}
                      className="w-full text-xs font-bold bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-400/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Завершение работы</label>
                    <input
                      type="time"
                      value={activeBarber.workingHours.end}
                      onChange={(e) => {
                        onUpdateBarberInfo({
                          ...activeBarber,
                          workingHours: { ...activeBarber.workingHours, end: e.target.value }
                        });
                        showToast(`Время конца работы изменено.`);
                      }}
                      className="w-full text-xs font-bold bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-400/50"
                    />
                  </div>
                </div>

                {/* Additional billing info for the barber */}
                <div className="p-4 bg-white/5 rounded-xl space-y-1.5 border border-white/5 text-xs text-slate-400">
                  <p className="font-bold text-white">Полезная памятка для мастера:</p>
                  <p>Размер ежемесячного списания за систему CRM составляет <span className="font-semibold text-cyan-400 font-mono">{activeBarber.monthlyFee.toLocaleString()} UZS</span>.</p>
                  <p>Счета выставляются администратором <span className="font-semibold text-cyan-400 font-mono">{activeBarber.billingDay} числа</span> каждого месяца.</p>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* --- MODAL: RECORD CLIENT BOOKING MANUAL --- */}
      {showAddQueueModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form 
            onSubmit={handleAddNewQueue}
            className="bg-[#121629] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden text-slate-100 max-h-[90vh] overflow-y-auto"
          >
            {/* Native Sheet Pull Bar handle display on mobile phone devices */}
            <div className="flex justify-center py-3 sm:hidden">
              <div className="w-12 h-1 bg-white/20 rounded-full"></div>
            </div>

            <div className="bg-white/5 border-b border-white/10 p-5">
              <h3 className="text-base font-bold text-white font-display">Записать клиента в очередь</h3>
              <p className="text-xs text-slate-400 mt-1">Добавление записи во временную сетку</p>
            </div>

            <div className="p-5 space-y-4 bg-transparent">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Имя Клиента *</label>
                <input
                  type="text"
                  required
                  placeholder="Бекзод"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full text-sm bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Телефон Клиента *</label>
                <input
                  type="text"
                  required
                  placeholder="+998 (90) 000-00-00"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full text-sm bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Категория</label>
                  <select
                    value={clientCategory}
                    onChange={(e) => setClientCategory(e.target.value as any)}
                    className="w-full text-xs font-bold bg-[#1a1f38] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="adult">🧔 Взрослый</option>
                    <option value="child">👶 Детский</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Время стрижки</label>
                  <input
                    type="time"
                    required
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="w-full text-xs font-bold bg-[#1a1f38] border border-white/15 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Длительность</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full text-xs font-bold bg-[#1a1f38] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="30">30 минут</option>
                    <option value="45">45 минут</option>
                    <option value="60">1 час</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Стоимость (UZS)</label>
                  <input
                    type="number"
                    required
                    value={servicePrice}
                    onChange={(e) => setServicePrice(Number(e.target.value))}
                    className="w-full text-xs font-bold bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

            </div>

            <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddQueueModal(false)}
                className="text-xs text-slate-400 hover:text-white font-semibold py-2 px-4 cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-650 text-slate-950 text-xs font-bold py-2.5 px-5 rounded-xl transition cursor-pointer"
              >
                Записать
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL: WORKSHOP CHECKOUT & STOP SERVICE (Tolov turi) --- */}
      {showCheckoutModal && checkoutAppointment && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#121629] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden text-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Native Sheet Pull Bar handle display on mobile phone devices */}
            <div className="flex justify-center py-3 sm:hidden">
              <div className="w-12 h-1 bg-white/20 rounded-full"></div>
            </div>

            <div className="bg-white/5 border-b border-white/10 p-5">
              <h3 className="text-base font-bold text-white font-display">Оплата и Закрытие чека</h3>
              <p className="text-xs text-slate-400 mt-1">Клиент: {checkoutAppointment.clientName}</p>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-center space-y-0.5">
                <span className="text-xs text-slate-450">Сумма к оплате:</span>
                <p className="text-2xl font-black text-cyan-450 font-mono">
                  {checkoutAppointment.price.toLocaleString()} <span className="text-sm font-normal">UZS</span>
                </p>
              </div>

              <p className="text-[10px] text-slate-400 font-bold uppercase text-center tracking-wider">Выберите способ оплаты:</p>
              
              <div className="flex flex-col gap-2.5">
                
                <button
                  onClick={() => handleCompleteCheckout('cash')}
                  className="w-full p-3 border border-white/10 bg-white/5 hover:border-emerald-500 hover:bg-emerald-500/10 rounded-xl transition text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white group-hover:text-emerald-450">💵 Наличные (Naqt)</p>
                    <p className="text-[10px] text-slate-450 mt-0.5">Оплата наличными купюрами напрямую в кассу</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 group-hover:text-emerald-500">&rarr;</span>
                </button>

                <button
                  onClick={() => handleCompleteCheckout('card')}
                  className="w-full p-3 border border-white/10 bg-white/5 hover:border-cyan-400 hover:bg-cyan-400/10 rounded-xl transition text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white group-hover:text-cyan-400">💳 Карта (Card / Humo / Uzcard)</p>
                    <p className="text-[10px] text-slate-450 mt-0.5">Оплата банковской картой через POS-терминал</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 group-hover:text-cyan-400">&rarr;</span>
                </button>

                <button
                  onClick={() => handleCompleteCheckout('click')}
                  className="w-full p-3 border border-white/10 bg-white/5 hover:border-blue-400 hover:bg-blue-400/10 rounded-xl transition text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white group-hover:text-blue-450">📱 Click / Payme (Эл. платеж)</p>
                    <p className="text-[10px] text-slate-450 mt-0.5">Перевод посредством мобильного интернет-банкинга</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 group-hover:text-blue-400">&rarr;</span>
                </button>

              </div>
            </div>

            <div className="p-4 bg-white/5 border-t border-white/10 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowCheckoutModal(false);
                  setCheckoutAppointment(null);
                }}
                className="text-xs text-slate-405 hover:text-white font-semibold py-1 px-4 cursor-pointer"
              >
                Отмена операции
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
