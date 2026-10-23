create table if not exists public.locations (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  address        text,
  lat            double precision,
  lng            double precision,
  accepted_goods text[] not null default '{}',   -- everything you can drop off
  needed_goods   text[] not null default '{}',   -- what's urgently needed now
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

alter table public.donations
  add column if not exists location_id uuid references public.locations (id) on delete set null;

alter table public.locations enable row level security;

drop policy if exists "locations_select_active" on public.locations;
create policy "locations_select_active" on public.locations
  for select to authenticated using (is_active = true);

insert into public.locations (name, address, lat, lng, accepted_goods, needed_goods)
select * from (values
  ('BAMX Centro',        'Calz. Independencia Sur 123, Centro',   20.6736, -103.3440,
     array['Arroz','Frijol','Aceite','Leche','Enlatados','Pañales'],
     array['Leche','Aceite']),
  ('Acopio Zapopan',     'Av. Vallarta 5000, Zapopan',            20.7050, -103.4068,
     array['Arroz','Frijol','Pasta','Azúcar','Agua','Ropa'],
     array['Agua','Pasta']),
  ('Acopio Tlaquepaque', 'Av. Niños Héroes 200, Tlaquepaque',     20.6409, -103.2938,
     array['Enlatados','Cereal','Galletas','Leche','Harina'],
     array['Cereal','Enlatados']),
  ('Acopio Tonalá',      'Av. Tonaltecas 150, Tonalá',            20.6244, -103.2336,
     array['Arroz','Frijol','Aceite','Jabón','Verdura fresca'],
     array['Verdura fresca','Jabón']),
  ('Mercado de Abastos', 'Anillo Perif. y Av. Lázaro Cárdenas',   20.6500, -103.3600,
     array['Verdura fresca','Fruta','Pan','Tortilla'],
     array['Fruta','Pan'])
) as v(name, address, lat, lng, accepted_goods, needed_goods)
where not exists (select 1 from public.locations);
