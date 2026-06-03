-- Seed demo barbers (matches src/data.ts ids)
INSERT INTO barbers (id, name, phone, avatar, is_active, is_blocked, working_hours, working_days, status, monthly_fee, billing_day, payment_status)
VALUES
  ('b1', 'Шохрух Каримов', '+998 (90) 123-45-67',
   'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
   true, false, '{"start":"09:00","end":"20:00"}', ARRAY[1,2,3,4,5,6], 'working', 150000, 10, 'paid'),
  ('b2', 'Алишер Назаров', '+998 (93) 345-67-89',
   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
   true, false, '{"start":"10:00","end":"21:00"}', ARRAY[2,3,4,5,6,7], 'busy', 150000, 2, 'overdue'),
  ('b3', 'Жасур Рустамов', '+998 (94) 987-65-43',
   'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
   true, false, '{"start":"08:00","end":"18:00"}', ARRAY[1,3,5], 'resting_or_sick', 150000, 25, 'paid')
ON CONFLICT (id) DO NOTHING;

INSERT INTO appointments (id, barber_id, client_name, client_phone, start_time, end_time, date, category, status, price)
VALUES
  ('a1', 'b1', 'Бекзод', '+998 (99) 441-22-33', '09:00', '09:30', '2026-06-02', 'adult', 'completed', 60000),
  ('a4', 'b1', 'Тимур', '+998 (99) 556-43-21', '12:00', '12:30', '2026-06-02', 'child', 'active', 45000),
  ('a5', 'b1', 'Сардорбек', '+998 (93) 144-55-66', '13:00', '13:45', '2026-06-02', 'adult', 'pending', 60000)
ON CONFLICT (id) DO NOTHING;
