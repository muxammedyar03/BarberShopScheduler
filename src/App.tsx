/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  UserCheck, 
  Users, 
  Building, 
  HelpCircle, 
  BookOpen, 
  ArrowRight,
  Info
} from 'lucide-react';
import { Barber, Appointment, Invoice, CashLog } from './types';
import { 
  INITIAL_BARBERS, 
  INITIAL_APPOINTMENTS, 
  INITIAL_INVOICES, 
  INITIAL_LOGS 
} from './data';
import OwnerView from './components/OwnerView';
import BarberView from './components/BarberView';
import ClientView from './components/ClientView';

type AppPerspective = 'owner' | 'barber' | 'client';

export default function App() {
  // Current app perspective / active role tab
  const [perspective, setPerspective] = useState<AppPerspective>('client');

  // Core Persistent State
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [cashLogs, setCashLogs] = useState<CashLog[]>([]);

  // 1. Initial State Load from LocalStorage or Data Seeds
  useEffect(() => {
    try {
      const savedBarbers = localStorage.getItem('barber_queue_barbers');
      const savedApps = localStorage.getItem('barber_queue_appointments');
      const savedInvoices = localStorage.getItem('barber_queue_invoices');
      const savedLogs = localStorage.getItem('barber_queue_logs');

      if (savedBarbers) setBarbers(JSON.parse(savedBarbers));
      else setBarbers(INITIAL_BARBERS);

      if (savedApps) setAppointments(JSON.parse(savedApps));
      else setAppointments(INITIAL_APPOINTMENTS);

      if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
      else setInvoices(INITIAL_INVOICES);

      if (savedLogs) setCashLogs(JSON.parse(savedLogs));
      else setCashLogs(INITIAL_LOGS);
    } catch (e) {
      console.error("Failed to parse localStorage", e);
      // Fallback to defaults
      setBarbers(INITIAL_BARBERS);
      setAppointments(INITIAL_APPOINTMENTS);
      setInvoices(INITIAL_INVOICES);
      setCashLogs(INITIAL_LOGS);
    }
  }, []);

  // 2. Synchronize memory changes to localStorage on any state modification
  useEffect(() => {
    if (barbers.length > 0) {
      localStorage.setItem('barber_queue_barbers', JSON.stringify(barbers));
    }
  }, [barbers]);

  useEffect(() => {
    if (appointments.length > 0) {
      localStorage.setItem('barber_queue_appointments', JSON.stringify(appointments));
    }
  }, [appointments]);

  useEffect(() => {
    if (invoices.length > 0) {
      localStorage.setItem('barber_queue_invoices', JSON.stringify(invoices));
    }
  }, [invoices]);

  useEffect(() => {
    if (cashLogs.length > 0) {
      localStorage.setItem('barber_queue_logs', JSON.stringify(cashLogs));
    }
  }, [cashLogs]);

  // Handle single barber profile changes (schedule, availability status, custom fields)
  const handleUpdateBarberInfo = (updated: Barber) => {
    const nextList = barbers.map(b => b.id === updated.id ? updated : b);
    setBarbers(nextList);
  };

  // Handle addition of standard reservation made by Clients online
  const handleAddNewAppointment = (app: Appointment) => {
    setAppointments([app, ...appointments]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0c14] text-slate-100 relative overflow-x-hidden select-none">
      
      {/* Background Mesh Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]"></div>
      </div>

      {/* GLOBAL SYSTEM HEADER */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-40 shadow-lg shadow-black/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          
          {/* Left panel: Branded title and vector icon */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <Scissors className="w-5 h-5 animate-pulse-once" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white font-display flex items-center gap-1.5 uppercase">
                Barber Queue <span className="text-[10px] bg-cyan-400/20 text-cyan-400 border border-cyan-400/30 font-bold px-2 py-0.5 rounded-full lowercase font-sans">crm</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Панель управления & Онлайн-очередь в парикмахерскую</p>
            </div>
          </div>

          {/* Center-Right panel: Absolute Perspective Multi-role Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Переключить роль:</span>
            
            <div className="inline-flex rounded-xl p-1 bg-white/5 border border-white/10 backdrop-blur-md gap-1 sm:w-auto w-full">
              
              <button
                id="role-client-tab"
                onClick={() => setPerspective('client')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  perspective === 'client'
                    ? 'bg-white/10 text-cyan-400 border border-white/10 shadow-lg'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Клиент</span>
              </button>

              <button
                id="role-barber-tab"
                onClick={() => setPerspective('barber')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  perspective === 'barber'
                    ? 'bg-white/10 text-cyan-400 border border-white/10 shadow-lg'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Барбер / Мастер</span>
              </button>

              <button
                id="role-owner-tab"
                onClick={() => setPerspective('owner')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  perspective === 'owner'
                    ? 'bg-white/10 text-cyan-400 border border-white/10 shadow-lg'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Владелец CRM</span>
              </button>

            </div>
          </div>

        </div>
      </header>

      {/* INTERACTIVE GUIDE BAR FOR THE USER */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-650/20 border-b border-white/10 text-slate-100 py-3 px-4 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950 px-2 py-0.5 rounded font-extrabold uppercase text-[10px] tracking-wider shadow-sm shadow-cyan-500/10">Квест-Гид</span>
            <p className="font-medium text-[11px] leading-relaxed text-slate-200">
              💡 <b>Как протестировать связи:</b> 1. Роль <b>Клиент</b>: выберите мастера и запишитесь на свободное время. 2. Роль <b>Барбер</b>: откройте смену, начните работу («Принять») и выберите тип оплаты! 3. Роль <b>Владелец</b>: наблюдайте выручку, выставляйте счета и ограничивайте за долги.
            </p>
          </div>
          
          <span className="text-[10px] font-semibold bg-white/5 text-cyan-400 px-2.5 py-1 rounded-md shrink-0 border border-white/10">
            Локальное время: 2026-06-02
          </span>
        </div>
      </div>

      {/* CORE WORK AREA CONTROLS */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 transition-all duration-300 relative z-10">
        
        {perspective === 'client' && (
          <ClientView 
            barbers={barbers}
            appointments={appointments}
            onAddNewAppointment={handleAddNewAppointment}
          />
        )}

        {perspective === 'barber' && (
          <BarberView 
            barbers={barbers}
            onUpdateBarberInfo={handleUpdateBarberInfo}
            appointments={appointments}
            onUpdateAppointments={setAppointments}
            cashLogs={cashLogs}
            onUpdateCashLogs={setCashLogs}
          />
        )}

        {perspective === 'owner' && (
          <OwnerView 
            barbers={barbers}
            onUpdateBarbers={setBarbers}
            invoices={invoices}
            onUpdateInvoices={setInvoices}
            appointments={appointments}
            cashLogs={cashLogs}
          />
        )}

      </main>

      {/* BRUTALIST & MODERN BRANDED FOOTER */}
      <footer className="bg-transparent border-t border-white/5 py-8 mt-12 text-slate-500 text-center text-xs relative z-10 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-400">
            © 2026 Barber Queue CRM. Все права защищены.
          </p>
          <p className="text-[11px] text-slate-500">
            Разработано в соответствии с высокими стандартами автоматизации бизнеса сферы услуг. Полностью на русском языке.
          </p>
        </div>
      </footer>

    </div>
  );
}
