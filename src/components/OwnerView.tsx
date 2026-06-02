/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  UserPlus, 
  Trash2, 
  Ban, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  FileText, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  FileSpreadsheet,
  UserCheck,
  Search,
  Plus
} from 'lucide-react';
import { Barber, Invoice, Appointment, CashLog } from '../types';

interface OwnerViewProps {
  barbers: Barber[];
  onUpdateBarbers: (newBarbers: Barber[]) => void;
  invoices: Invoice[];
  onUpdateInvoices: (newInvoices: Invoice[]) => void;
  appointments: Appointment[];
  cashLogs: CashLog[];
}

export default function OwnerView({
  barbers,
  onUpdateBarbers,
  invoices,
  onUpdateInvoices,
  appointments,
  cashLogs
}: OwnerViewProps) {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Barber Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberPhone, setNewBarberPhone] = useState('');
  const [newBarberAvatar, setNewBarberAvatar] = useState('');
  const [newBarberHoursStart, setNewBarberHoursStart] = useState('09:00');
  const [newBarberHoursEnd, setNewBarberHoursEnd] = useState('20:00');
  const [newBarberDays, setNewBarberDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [newBarberFee, setNewBarberFee] = useState(150000);
  const [newBarberBillingDay, setNewBarberBillingDay] = useState(10);

  // Invoice generator state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState(150000);
  const [invoiceDueDate, setInvoiceDueDate] = useState('2026-06-15');

  // Interactive selected barber for detailed view
  const [selectedBarberDetail, setSelectedBarberDetail] = useState<Barber | null>(null);

  // Notification helper
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const triggerNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // 1. Add Barber handler
  const handleAddBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarberName || !newBarberPhone) {
      triggerNotification('Пожалуйста, заполните имя и телефон барбера', 'error');
      return;
    }

    const newBarber: Barber = {
      id: 'b-' + Date.now(),
      name: newBarberName,
      phone: newBarberPhone,
      avatar: newBarberAvatar || `https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200`,
      isActive: true,
      isBlocked: false,
      workingHours: { start: newBarberHoursStart, end: newBarberHoursEnd },
      workingDays: newBarberDays,
      status: 'resting_or_sick',
      monthlyFee: Number(newBarberFee),
      billingDay: Number(newBarberBillingDay),
      paymentStatus: 'paid'
    };

    onUpdateBarbers([...barbers, newBarber]);
    setShowAddModal(false);
    
    // Reset Form
    setNewBarberName('');
    setNewBarberPhone('');
    setNewBarberAvatar('');
    setNewBarberHoursStart('09:00');
    setNewBarberHoursEnd('20:00');
    setNewBarberDays([1, 2, 3, 4, 5, 6]);
    setNewBarberFee(150000);
    setNewBarberBillingDay(10);

    triggerNotification(`Ассистент: Барбер ${newBarber.name} успешно добавлен!`);
  };

  // 2. Delete Barber handler
  const handleDeleteBarber = (id: string, name: string) => {
    if (window.confirm(`Вы уверены, что хотите полностью удалить барбера ${name}? Все его настройки будут удалены.`)) {
      onUpdateBarbers(barbers.filter(b => b.id !== id));
      if (selectedBarberDetail?.id === id) {
        setSelectedBarberDetail(null);
      }
      triggerNotification(`Барбер ${name} успешно удален из базы`, 'info');
    }
  };

  // 3. Toggle Block status
  const handleToggleBlock = (id: string) => {
    const updated = barbers.map(b => {
      if (b.id === id) {
        const nextBlocked = !b.isBlocked;
        triggerNotification(
          nextBlocked ? `Барбер ${b.name} заблокирован!` : `Барбер ${b.name} разблокирован!`,
          nextBlocked ? 'error' : 'success'
        );
        return { ...b, isBlocked: nextBlocked };
      }
      return b;
    });
    onUpdateBarbers(updated);
    // Update active details pointer
    const found = updated.find(b => b.id === id);
    if (found && selectedBarberDetail?.id === id) {
      setSelectedBarberDetail(found);
    }
  };

  // 4. Toggle Deactivate / Activate
  const handleToggleActive = (id: string) => {
    const updated = barbers.map(b => {
      if (b.id === id) {
        const nextActive = !b.isActive;
        triggerNotification(
          nextActive ? `Барбер ${b.name} активирован в системе!` : `Барбер ${b.name} деактивирован!`,
          nextActive ? 'success' : 'info'
        );
        return { ...b, isActive: nextActive };
      }
      return b;
    });
    onUpdateBarbers(updated);
    // Update active details pointer
    const found = updated.find(b => b.id === id);
    if (found && selectedBarberDetail?.id === id) {
      setSelectedBarberDetail(found);
    }
  };

  // 5. Generate Invoice
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarberId) {
      triggerNotification('Выберите барбера для выставления счета', 'error');
      return;
    }

    const targetBarber = barbers.find(b => b.id === selectedBarberId);
    if (!targetBarber) return;

    const newInvoice: Invoice = {
      id: 'inv-' + Date.now(),
      barberId: selectedBarberId,
      barberName: targetBarber.name,
      amount: Number(invoiceAmount),
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: invoiceDueDate,
      status: 'pending'
    };

    onUpdateInvoices([newInvoice, ...invoices]);
    
    // Also mark barber payment as overdue if creating pending/overdue invoice
    if (new Date(invoiceDueDate) < new Date('2026-06-02')) {
      const updatedBarbers = barbers.map(b => b.id === selectedBarberId ? { ...b, paymentStatus: 'overdue' as const } : b);
      onUpdateBarbers(updatedBarbers);
    }

    setShowInvoiceModal(false);
    triggerNotification(`Создан инвойс #${newInvoice.id} на сумму ${newInvoice.amount.toLocaleString('ru-RU')} UZS для ${targetBarber.name}`);
  };

  // 6. Send / Dispatch Invoice ("Отправить инвойс" / invoice jo'natish)
  const handleSendInvoice = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return;
    
    // Simulate high-fidelity email/SMS broadcast
    triggerNotification(`📧 Инвойс #${invoiceId} на сумму ${inv.amount.toLocaleString()} UZS успешно отправлен барберу ${inv.barberName}!`, 'success');
  };

  // 7. Manually toggle Invoice standard state (simulates payments received)
  const handlePayInvoice = (invoiceId: string) => {
    const updated = invoices.map(i => {
      if (i.id === invoiceId) {
        return { ...i, status: 'paid' as const };
      }
      return i;
    });
    onUpdateInvoices(updated);

    // If all invoices of this barber are paid, restore the status
    const invObj = invoices.find(i => i.id === invoiceId);
    if (invObj) {
      const remainingOverdue = updated.filter(i => i.barberId === invObj.barberId && i.status !== 'paid');
      if (remainingOverdue.length === 0) {
        onUpdateBarbers(barbers.map(b => b.id === invObj.barberId ? { ...b, paymentStatus: 'paid' as const } : b));
      }
    }

    triggerNotification(`Инвойс #${invoiceId} помечен как оплаченный! Полная сумма зачислена.`);
  };

  const toggleDayOfWeekSelection = (day: number) => {
    if (newBarberDays.includes(day)) {
      setNewBarberDays(newBarberDays.filter(d => d !== day));
    } else {
      setNewBarberDays([...newBarberDays, day].sort());
    }
  };

  // Filtered list
  const filteredBarbers = barbers.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.phone.includes(searchTerm)
  );

  // Billing calculation
  const totalReceivedFromInvoices = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, current) => sum + current.amount, 0);

  const pendingBillingAmount = invoices
    .filter(i => i.status !== 'paid')
    .reduce((sum, current) => sum + current.amount, 0);

  const overdueInvoicesCount = invoices.filter(i => i.status === 'overdue').length;

  const daysOfWeekMap: { [key: number]: string } = {
    1: 'Пн',
    2: 'Вт',
    3: 'Ср',
    4: 'Чт',
    5: 'Пт',
    6: 'Сб',
    7: 'Вс',
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-xl border text-white transition-all duration-300 transform translate-y-0 ${
          notification.type === 'success' ? 'bg-emerald-600 border-emerald-500' :
          notification.type === 'error' ? 'bg-rose-600 border-rose-500' :
          'bg-slate-800 border-slate-700'
        }`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-lg bg-teal-50 text-teal-600">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Всего барберов</p>
            <h4 className="text-2xl font-bold text-slate-800">{barbers.length}</h4>
            <p className="text-xs text-slate-500 mt-1">
              Активные: {barbers.filter(b => b.isActive && !b.isBlocked).length}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Касса сервиса</p>
            <h4 className="text-2xl font-bold text-indigo-600">
              {totalReceivedFromInvoices.toLocaleString('ru-RU')} <span className="text-xs font-normal">UZS</span>
            </h4>
            <p className="text-xs text-emerald-600 mt-1 font-medium">
              Оплачено инвойсов
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Просрочено оплат</p>
            <h4 className="text-2xl font-bold text-amber-600">{overdueInvoicesCount}</h4>
            <p className="text-xs text-rose-500 mt-1 font-medium">
              Сумма долга: {invoices.filter(i => i.status === 'overdue').reduce((s, c) => s + c.amount, 0).toLocaleString()} UZS
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-lg bg-slate-100 text-slate-700">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Ожидает оплаты</p>
            <h4 className="text-2xl font-bold text-slate-700">
              {pendingBillingAmount.toLocaleString('ru-RU')} <span className="text-xs font-normal">UZS</span>
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Всего выставлено счетов
            </p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Barber Directory Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Управление Барберами</h3>
                <p className="text-xs text-slate-400 mt-1">Добавление, блокировка, активация и удаление партнеров.</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition duration-200"
              >
                <Plus className="w-4 h-4" />
                Добавить барбера
              </button>
            </div>

            {/* Search filter bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по имени или телефону..."
                className="bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none w-full"
              />
            </div>

            {/* Barber List Grid table */}
            <div className="divide-y divide-slate-100">
              {filteredBarbers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Барберы не найдены по вашему запросу.
                </div>
              ) : (
                filteredBarbers.map((barber) => {
                  const barberTodayFinished = appointments.filter(a => a.barberId === barber.id && a.status === 'completed').length;
                  const barberOverdueCount = invoices.filter(i => i.barberId === barber.id && i.status === 'overdue').length;

                  return (
                    <div 
                      key={barber.id}
                      className={`p-5 transition hover:bg-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        selectedBarberDetail?.id === barber.id ? 'bg-indigo-50/40 border-l-4 border-indigo-500' : ''
                      }`}
                    >
                      {/* Left: Avatar & Basic Information */}
                      <div className="flex items-start gap-4">
                        <img 
                          src={barber.avatar} 
                          alt={barber.name} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800 text-sm hover:text-indigo-600 cursor-pointer" onClick={() => setSelectedBarberDetail(barber)}>
                              {barber.name}
                            </h4>
                            
                            {/* Flags */}
                            {barber.isBlocked && (
                              <span className="px-1.5 py-0.5 text-[9px] bg-red-100 text-red-600 rounded-sm font-semibold uppercase">
                                Блок
                              </span>
                            )}
                            {!barber.isActive && (
                              <span className="px-1.5 py-0.5 text-[9px] bg-slate-100 text-slate-500 rounded-sm font-semibold uppercase">
                                Неактивен
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {barber.phone}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="text-[10px] bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {barber.workingHours.start} - {barber.workingHours.end}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full">
                              Дни: {barber.workingDays.map(d => daysOfWeekMap[d] || d).join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Billing Status Summary */}
                      <div className="text-left md:text-right space-y-1">
                        <p className="text-xs font-semibold text-slate-700">
                          {barber.monthlyFee.toLocaleString('ru-RU')} UZS / мес
                        </p>
                        <p className="text-[10px] text-slate-400">
                          День оплаты: <span className="font-semibold text-slate-600">{barber.billingDay} числа</span>
                        </p>
                        
                        {/* Monthly Status Indicator */}
                        {barber.paymentStatus === 'overdue' || barberOverdueCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                            <AlertTriangle className="w-3.5 h-3.5" /> Должник ({barberOverdueCount}н)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <CheckCircle className="w-3.5 h-3.5" /> Оплачено
                          </span>
                        )}
                      </div>

                      {/* Right: Owner Admin Controls */}
                      <div className="flex items-center gap-1.5 w-full md:w-auto justify-end border-t border-slate-100 md:border-none pt-3 md:pt-0">
                        {/* View Details */}
                        <button
                          onClick={() => setSelectedBarberDetail(barber)}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Подробная информация"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Toggle Active status */}
                        <button
                          onClick={() => handleToggleActive(barber.id)}
                          className={`p-2 transition rounded-lg ${
                            barber.isActive 
                              ? 'text-emerald-600 hover:bg-emerald-50' 
                              : 'text-slate-400 hover:bg-slate-100'
                          }`}
                          title={barber.isActive ? "Деактивировать (Скрыть из поиска)" : "Активировать (Показывать пользователям)"}
                        >
                          {barber.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>

                        {/* Toggle Block status */}
                        <button
                          onClick={() => handleToggleBlock(barber.id)}
                          className={`p-2 transition rounded-lg ${
                            barber.isBlocked 
                              ? 'text-rose-600 bg-rose-50' 
                              : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                          }`}
                          title={barber.isBlocked ? "Разблокировать" : "Заблокировать аккаунт"}
                        >
                          <Ban className="w-4 h-4" />
                        </button>

                        {/* Delete Barber */}
                        <button
                          onClick={() => handleDeleteBarber(barber.id, barber.name)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Удалить навсегда"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Active selected Barber Detail Panel for Admin inspection */}
          {selectedBarberDetail && (
            <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <button 
                  onClick={() => setSelectedBarberDetail(null)} 
                  className="text-slate-400 hover:text-white font-medium text-xs bg-slate-800 px-3 py-1.5 rounded-lg transition"
                >
                  Закрыть
                </button>
              </div>

              <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
                <img 
                  src={selectedBarberDetail.avatar} 
                  alt={selectedBarberDetail.name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">{selectedBarberDetail.name}</h4>
                  <p className="text-xs text-indigo-400">{selectedBarberDetail.phone}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Статус подписки: {selectedBarberDetail.paymentStatus === 'overdue' ? '🔴 Просрочка платежа' : '🟢 Оплачено без долгов'}
                  </p>
                </div>
              </div>

              {/* Live operational detail */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
                <div>
                  <h5 className="text-xs text-slate-400 uppercase font-semibold">Операционная статистика</h5>
                  <p className="text-2xl font-bold text-white mt-1">
                    {appointments.filter(a => a.barberId === selectedBarberDetail.id && a.status === 'completed').length} <span className="text-xs font-normal text-slate-400">стрижек выполнено</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Всего в очереди на сегодня: {appointments.filter(a => a.barberId === selectedBarberDetail.id && a.status === 'pending').length} чел.
                  </p>
                </div>

                <div>
                  <h5 className="text-xs text-slate-400 uppercase font-semibold">Тариф CRM</h5>
                  <p className="text-2xl font-bold text-white mt-1">
                    {selectedBarberDetail.monthlyFee.toLocaleString('ru-RU')} <span className="text-xs font-normal text-slate-400">UZS</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Списать: {selectedBarberDetail.billingDay} числа каждого месяца
                  </p>
                </div>

                <div>
                  <h5 className="text-xs text-slate-400 uppercase font-semibold">Системные Флаги</h5>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <span className={`text-[10px] w-fit px-2 py-0.5 rounded font-medium ${selectedBarberDetail.isActive ? 'bg-emerald-900/40 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                      {selectedBarberDetail.isActive ? '✓ Виден клиентам' : '✗ Деактивирован'}
                    </span>
                    <span className={`text-[10px] w-fit px-2 py-0.5 rounded font-medium ${selectedBarberDetail.isBlocked ? 'bg-rose-950 text-rose-300' : 'bg-emerald-990/40 text-emerald-300'}`}>
                      {selectedBarberDetail.isBlocked ? '⚠ ЗАБЛОКИРОВАН' : '✓ Без блокировок'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Quick Billing actions for this barber */}
              <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between gap-4">
                <span className="text-xs text-slate-400">Быстрое действие по счетам:</span>
                <button 
                  onClick={() => {
                    setSelectedBarberId(selectedBarberDetail.id);
                    setInvoiceAmount(selectedBarberDetail.monthlyFee);
                    setShowInvoiceModal(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-3.5 rounded-lg transition flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Выставить счет
                </button>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Billing Management & Invoices */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Финансовый Биллинг</h3>
                <p className="text-[11px] text-slate-400">Контроль ежемесячных платежей барберов</p>
              </div>
              <button 
                onClick={() => {
                  if (barbers.length === 0) {
                    triggerNotification('Добавьте сначала хотя бы одного барбера', 'error');
                    return;
                  }
                  setSelectedBarberId(barbers[0].id);
                  setInvoiceAmount(barbers[0].monthlyFee);
                  setShowInvoiceModal(true);
                }}
                className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                title="Новый инвойс"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* List of generated invoices */}
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {invoices.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  Выставленных счетов пока нет.
                </div>
              ) : (
                invoices.map((invoice) => {
                  const correlatedBarber = barbers.find(b => b.id === invoice.barberId);
                  const isOverdue = invoice.status === 'overdue';
                  const isPending = invoice.status === 'pending';
                  const isPaid = invoice.status === 'paid';

                  return (
                    <div 
                      key={invoice.id} 
                      className={`p-3 rounded-xl border transition ${
                        isOverdue ? 'bg-rose-50/50 border-rose-100' :
                        isPending ? 'bg-amber-50/30 border-amber-100' :
                        'bg-slate-50 border-slate-150'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{invoice.barberName}</p>
                          <p className="text-[10px] text-slate-400">Счет #{invoice.id.split('-')[1] || invoice.id}</p>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isPaid ? 'bg-emerald-100 text-emerald-750' :
                          isOverdue ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {isPaid ? 'Оплачен' : isOverdue ? 'Просрочен' : 'Ожидает'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                        <div>
                          Сумма: <span className="font-bold text-slate-800">{invoice.amount.toLocaleString()} UZS</span>
                        </div>
                        <div>
                          Срок: <span className="font-semibold text-slate-700">{invoice.dueDate}</span>
                        </div>
                      </div>

                      {/* Interactive Invoice management buttons */}
                      <div className="flex items-center justify-end gap-1.5 mt-2 pt-1 border-t border-slate-100">
                        {/* Send button (Otkarish) */}
                        <button
                          onClick={() => handleSendInvoice(invoice.id)}
                          className="flex items-center gap-1 text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded hover:bg-slate-100 transition"
                          title="Отправить уведомление барберу"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Напомнить</span>
                        </button>

                        {/* Complete Payment Button */}
                        {!isPaid && (
                          <button
                            onClick={() => handlePayInvoice(invoice.id)}
                            className="flex items-center gap-1 text-[10px] bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition font-medium"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>Оплатить</span>
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Quick Informational Billing Instructions Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2 text-xs text-slate-600">
            <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Правила работы биллинга
            </h4>
            <p>
              Каждому барберу при регистрации выставляется ежемесячный тариф CRM за право использования системы 
              (по умолчанию 150 000 UZS).
            </p>
            <p>
              Для контроля задолженностей система отмечает барберов красным знаком <b>Должник</b>, если счет не оплачен вовремя. Вы всегда можете перенаправить инвойс на их мессенджеры повторно.
            </p>
          </div>

        </div>

      </div>

      {/* --- MODAL: ADD BARBER --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddBarber}
            className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="bg-slate-900 text-white p-5">
              <h3 className="text-base font-bold">Добавление нового барбера</h3>
              <p className="text-xs text-slate-400 mt-1">Заполните анкету для предоставления доступа к CRM</p>
            </div>

            <div className="p-5 space-y-4 max-h-[450px] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1">
                  Ф.И.О. Барбера *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например, Сардор Махмудов"
                  value={newBarberName}
                  onChange={(e) => setNewBarberName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-indigo-500 text-slate-850"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1">
                  Номер телефона (с кодом) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+998 (99) 777-77-77"
                  value={newBarberPhone}
                  onChange={(e) => setNewBarberPhone(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-indigo-500 text-slate-850"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1">
                  Ссылка на фото/аватар (опционально)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newBarberAvatar}
                  onChange={(e) => setNewBarberAvatar(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-indigo-500 text-slate-850 text-xs"
                />
              </div>

              {/* Working Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1">
                    Начало работы
                  </label>
                  <input
                    type="time"
                    value={newBarberHoursStart}
                    onChange={(e) => setNewBarberHoursStart(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-indigo-500 text-slate-850"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1">
                    Конец смены
                  </label>
                  <input
                    type="time"
                    value={newBarberHoursEnd}
                    onChange={(e) => setNewBarberHoursEnd(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-indigo-500 text-slate-850"
                  />
                </div>
              </div>

              {/* Working Days */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mb-2">
                  Рабочие дни недели
                </label>
                <div className="flex flex-wrap gap-1.5Packed">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                    const isSelected = newBarberDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDayOfWeekSelection(day)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg transition border font-semibold ${
                          isSelected
                            ? 'bg-indigo-650 text-indigo-600 border-indigo-400'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {daysOfWeekMap[day]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Monthly Subscription details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1">
                    Абонплата (UZS)
                  </label>
                  <input
                    type="number"
                    value={newBarberFee}
                    onChange={(e) => setNewBarberFee(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-indigo-500 text-slate-850"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1">
                    Число списания
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={newBarberBillingDay}
                    onChange={(e) => setNewBarberBillingDay(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-indigo-500 text-slate-850"
                  />
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold py-2 px-4"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition"
              >
                Сохранить
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL: GENERATE INVOICE --- */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateInvoice}
            className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full overflow-hidden"
          >
            <div className="bg-slate-900 text-white p-5">
              <h3 className="text-base font-bold">Выставить новый инвойс</h3>
              <p className="text-xs text-slate-400 mt-1">Генерация квитанции за обслуживание в системе</p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1">
                  Получатель (Барбер)
                </label>
                <select
                  value={selectedBarberId}
                  onChange={(e) => {
                    setSelectedBarberId(e.target.value);
                    const b = barbers.find(x => x.id === e.target.value);
                    if (b) setInvoiceAmount(b.monthlyFee);
                  }}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-indigo-500 text-slate-850 bg-white"
                >
                  {barbers.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1">
                  Сумма счета (UZS)
                </label>
                <input
                  type="number"
                  required
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(Number(e.target.value))}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-indigo-500 text-slate-850"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mb-1">
                  Срок оплаты до:
                </label>
                <input
                  type="date"
                  required
                  value={invoiceDueDate}
                  onChange={(e) => setInvoiceDueDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2-5 outline-indigo-500 text-slate-855"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold py-2 px-4"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition bg-indigo-600"
              >
                Выписать счет
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
