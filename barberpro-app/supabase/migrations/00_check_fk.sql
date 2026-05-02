SELECT conname, confdeltype FROM pg_constraint WHERE conrelid = 'agendamentos'::regclass AND contype = 'f';
