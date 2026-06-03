'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  User, 
  Calendar, 
  Clock, 
  Phone, 
  CheckCircle2, 
  UserCheck, 
  Sparkles, 
  ShieldAlert,
  Sliders,
  Check
} from 'lucide-react';
import { Barber, Appointment, ClientCategory } from '../types';

interface ClientViewProps {
  barbers: Barber[];
  appointments: Appointment[];
  onAddNewAppointment: (app: Appointment) => void;
}

export default function ClientView({
  barbers,
  appointments,
  onAddNewAppointment
}: ClientViewProps) {
  // Available active barbers that aren't blocked
  const activeBarbers = barbers.filter(b => b.isActive && !b.isBlocked);

  // Selected Barber ID state
  const [selectedBarberId, setSelectedBarberId] = useState<string>(activeBarbers[0]?.id || '');
  const activeBarber = activeBarbers.find(b => b.id === selectedBarberId) || activeBarbers[0];

  // Forms
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCategory, setClientCategory] = useState<ClientCategory>('adult');

  const [bookingSuccess, setBookingSuccess] = useState(false);

  const todayStr = '2026-06-02';

  // Extract all busy appointments of today for this barber
  const activeBarberTodayApps = activeBarber
    ? appointments.filter(a => a.barberId === activeBarber.id && a.date === todayStr && a.status !== 'skipped')
    : [];

  // Generate 30 minutes slots
  const generateAvailableTimeSlots = () => {
    if (!activeBarber) return [];
    
    const slots: { time: string; isBooked: boolean }[] = [];
    const [startH, startM] = activeBarber.workingHours.start.split(':').map(Number);
    const [endH, endM] = activeBarber.workingHours.end.split(':').map(Number);

    let currentHour = startH;
    let currentMinute = startM;

    while (currentHour < endH || (currentHour === endH && currentMinute < endM)) {
      const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Check if any booking covers this exact time
      const isBooked = activeBarberTodayApps.some(a => {
        return a.startTime <= timeStr && a.endTime > timeStr;
      });

      slots.push({
        time: timeStr,
        isBooked
      });

      // Advance by 30 mins
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute -= 60;
      }
    }
    return slots;
  };

  const timeSlots = generateAvailableTimeSlots();

  // Handle Client registration submit
  const handleClientBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !selectedTimeSlot || !activeBarber) return;

    // Calculate end of session (+ 30 mins)
    const [h, m] = selectedTimeSlot.split(':').map(Number);
    let totalM = m + 30;
    let endH = h + Math.floor(totalM / 60);
    let endM = totalM % 60;
    const endTimeStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

    const newBooking: Appointment = {
      id: 'app-' + Date.now(),
      barberId: activeBarber.id,
      clientName,
      clientPhone: clientPhone.startsWith('+998') ? clientPhone : `+998 ${clientPhone}`,
      startTime: selectedTimeSlot,
      endTime: endTimeStr,
      date: todayStr,
      category: clientCategory,
      status: 'pending',
      price: clientCategory === 'adult' ? 60000 : 45000,
    };

    onAddNewAppointment(newBooking);
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setShowBookingModal(false);
      setClientName('');
      setClientPhone('');
    }, 3000);
  };

  const dayNamesMap: { [key: number]: string } = {
    1: 'Понедельник',
    2: 'Вторник',
    3: 'Среда',
    4: 'Четверг',
    5: 'Пятница',
    6: 'Суббота',
    7: 'Воскресенье',
  };

  const openBookingFormForSlot = (time: string) => {
    if (activeBarber.status === 'resting_or_sick') return; // Cannot book as rest-day
    setSelectedTimeSlot(time);
    setShowBookingModal(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative z-10">
      
      {/* 1. SELECT BARBER HERO SPOTLIGHT */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-display">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            Выбор Лучшего Барбера
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Выберите свободного мастера для мгновенной онлайн-записи в живую очередь.
          </p>
        </div>

        {/* Master Selector - Swipeable horizontal carousel on mobile, clean columns on desktop */}
        <div className="flex overflow-x-auto pb-2 gap-4 scrollbar-none snap-x sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
          {activeBarbers.length === 0 ? (
            <div className="sm:col-span-3 text-center py-6 text-sm text-slate-400 bg-white/5 border border-white/5 rounded-xl w-full">
              В данный момент нет доступных активных барберов на смене.
            </div>
          ) : (
            activeBarbers.map((barber) => {
              const isSelected = selectedBarberId === barber.id;
              
              // Status badges mapping
              const isWorking = barber.status === 'working';
              const isBusy = barber.status === 'busy';

              return (
                <div
                  key={barber.id}
                  onClick={() => setSelectedBarberId(barber.id)}
                  className={`snap-start min-w-[270px] sm:min-w-0 flex-shrink-0 p-4 rounded-xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex items-center gap-3 ${
                    isSelected 
                      ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-450/10' 
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <img 
                    src={barber.avatar} 
                    alt={barber.name} 
                    className="w-11 h-11 rounded-full object-cover shadow-sm border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{barber.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">тел: {barber.phone.split(' ')[2] || barber.phone}</p>
                    
                    <div className="mt-1">
                      {isWorking ? (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wide">
                          🟢 На работе
                        </span>
                      ) : isBusy ? (
                        <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wide">
                          🟡 Занят делом
                        </span>
                      ) : (
                        <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wide">
                          🔴 Выходной
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tick */}
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-cyan-400 text-[#0a0c14]">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. BARBER PROFILE DASHBOARD DETAILS */}
      {activeBarber && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main central calendar picker */}
          <div className="md:col-span-2 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-5 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                Записаться на сегодня: <span className="text-cyan-400 font-extrabold">2 июня 2026 г.</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Кликните на любое свободное время ниже, чтобы забронировать место.
              </p>
            </div>

            {activeBarber.status === 'resting_or_sick' ? (
              <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-xl text-center text-rose-300 font-semibold space-y-1.5">
                <ShieldAlert className="w-8 h-8 text-rose-450 mx-auto" />
                <p>Мастер {activeBarber.name} сегодня отдыхает или болен.</p>
                <p className="text-xs text-rose-450 font-normal">Запись к этому мастеру временно закрыта. Выберите другого барбера выше.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-2">
                {timeSlots.map((slot) => {
                  return (
                    <button
                      key={slot.time}
                      disabled={slot.isBooked}
                      onClick={() => openBookingFormForSlot(slot.time)}
                      className={`py-3 px-2 text-center rounded-xl transition-all duration-300 border text-xs font-bold ${
                        slot.isBooked
                          ? 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed line-through'
                          : 'bg-white/5 hover:bg-gradient-to-br hover:from-cyan-400 hover:to-blue-600 hover:text-slate-950 border-white/10 hover:border-cyan-400 text-slate-205 cursor-pointer shadow-sm'
                      }`}
                    >
                      <span className="block text-xs font-mono">{slot.time}</span>
                      <span className={`block text-[8px] mt-1 uppercase tracking-wide font-medium ${
                        slot.isBooked ? 'text-slate-500/80' : 'text-emerald-400 group-hover:text-slate-950'
                      }`}>
                        {slot.isBooked ? 'Занято' : 'Свободно'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-4 border-t border-white/5 text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-white/20 bg-white/5 inline-block"></span> 
                Доступный слот
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-white/5 border border-transparent inline-block"></span> 
                Зарезервировано
              </span>
            </div>

          </div>

          {/* Right column: Info card displaying master rules */}
          <div className="space-y-6">
            
            {/* Live Card details */}
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-650/20 border border-white/20 rounded-2xl p-5 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src={activeBarber.avatar} 
                  alt={activeBarber.name} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400/50"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-sm text-white font-display">{activeBarber.name}</h4>
                  <p className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">Профессиональный Барбер</p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/10 text-xs text-slate-300">
                
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 mt-0.5 text-cyan-400" />
                  <div>
                    <p className="font-bold text-white">Режим смены</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">с {activeBarber.workingHours.start} до {activeBarber.workingHours.end}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 mt-0.5 text-cyan-400" />
                  <div>
                    <p className="font-bold text-white">Рабочие дни</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {activeBarber.workingDays.map(d => dayNamesMap[d]).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 mt-0.5 text-cyan-400" />
                  <div>
                    <p className="font-bold text-white">Контакты мастера</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{activeBarber.phone}</p>
                  </div>
                </div>

              </div>

            </div>

            {/* Quick reminder card */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-300 space-y-1.5 shadow-lg backdrop-blur-sm">
              <h5 className="font-extrabold flex items-center gap-1.5"><Sliders className="w-4 h-4 text-amber-400" /> Важная информация:</h5>
              <p>Пожалуйста, приходите за 5 минут до забронированного времени.</p>
              <p>Оплата производится на месте у барбера наличными деньгами (Naqt), картой (Uzcard/Humo) или Click.</p>
            </div>

          </div>

        </div>
      )}

      {/* --- MODAL: CLIENT RESERVATION SIGN-UP --- */}
      {showBookingModal && activeBarber && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0b0f1d] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden backdrop-blur-2xl max-h-[90vh] overflow-y-auto transform transition-transform duration-300">
            
            {/* Native Bottom Sheet handle decoration on Mobile screen */}
            <div className="flex justify-center py-3 sm:hidden">
              <div className="w-12 h-1 bg-white/20 rounded-full"></div>
            </div>

            {bookingSuccess ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
                <h3 className="text-lg font-bold text-white font-display">Запись успешно создана!</h3>
                <p className="text-sm text-slate-305">
                  Вы записались к мастеру <b>{activeBarber.name}</b> на сегодня в <b>{selectedTimeSlot}</b>.
                </p>
                <div className="text-xs bg-white/5 border border-white/10 py-2.5 rounded-xl text-slate-400 font-semibold font-mono">
                  Пожалуйста, запомните ваше время. Ждем вас!
                </div>
              </div>
            ) : (
              <form onSubmit={handleClientBooking}>
                <div className="bg-gradient-to-r from-blue-600/30 to-purple-650/30 border-b border-white/10 p-5">
                  <h3 className="text-base font-bold text-white font-display">Оформить запись на стрижку</h3>
                  <p className="text-xs text-cyan-400 mt-1">
                    Мастер: {activeBarber.name} • Время: {selectedTimeSlot} сегодня
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                      Ваше имя (Исми) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Например, Бекзод"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white font-semibold focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                      Номер телефона *
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-slate-450 select-none flex items-center gap-1">
                        <span>🇺🇿</span>
                        <span>+998</span>
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="(99) 777-77-77"
                        value={clientPhone}
                        onChange={(e) => {
                          let val = e.target.value;
                          // If client types +998 directly, strip it or handle beautifully
                          if (val.startsWith('+998')) {
                            val = val.substring(4).trim();
                          }
                          setClientPhone(val);
                        }}
                        className="w-full text-sm bg-white/5 border border-white/10 rounded-xl pl-20 pr-3 py-3 text-white font-semibold focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                      Категория стрижки
                    </label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setClientCategory('adult')}
                        className={`text-xs py-3 px-1.5 rounded-xl border text-center transition font-bold cursor-pointer ${
                          clientCategory === 'adult'
                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        🧔 Взрослый (60 000 UZS)
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setClientCategory('child')}
                        className={`text-xs py-3 px-1.5 rounded-xl border text-center transition font-bold cursor-pointer ${
                          clientCategory === 'child'
                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        👶 Детский (45 000 UZS)
                      </button>
                    </div>
                  </div>

                </div>

                <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-end gap-3 pb-8 sm:pb-4">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="text-xs text-slate-400 hover:text-white font-semibold py-2.5 px-4 cursor-pointer"
                  >
                    Отменить
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-500 hover:to-blue-700 text-[#0a0c14] font-bold text-xs py-3 px-6 rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    Записаться
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
