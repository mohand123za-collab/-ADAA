update public.classes set name = replace(name, 'الصف', 'فصل') where name like 'الصف %';
update public.teachers set circle = replace(circle, 'الصف', 'فصل') where circle like 'الصف %';