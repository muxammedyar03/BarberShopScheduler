-- Staff users — password: ChangeMe123! (bcrypt cost 10)
-- DBeaver: run after barbers seed

INSERT INTO users (email, display_name, role, barber_id, password_hash)
VALUES
  (
    'admin@barbershop.local',
    'Super Admin',
    'admin',
    NULL,
    '$2b$10$uyhOCkn4eRuUJ1tMAfVZJODqln22ibJBQzRUdIyNrnWcnO5N1/OiO'
  ),
  (
    'barber@barbershop.local',
    'Шохрух Каримов',
    'barber',
    'b1',
    '$2b$10$uyhOCkn4eRuUJ1tMAfVZJODqln22ibJBQzRUdIyNrnWcnO5N1/OiO'
  ),
  (
    'barber2@barbershop.local',
    'Алишер Назаров',
    'barber',
    'b2',
    '$2b$10$uyhOCkn4eRuUJ1tMAfVZJODqln22ibJBQzRUdIyNrnWcnO5N1/OiO'
  )
ON CONFLICT (email) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  barber_id = EXCLUDED.barber_id,
  password_hash = EXCLUDED.password_hash,
  updated_at = now();
