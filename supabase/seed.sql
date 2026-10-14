-- Taxonomy only. Synthetic identities are created by the demo adapter / isolated policy tests,
-- never through a production auth.users fixture or a default reviewer account.
insert into public.topics(name)values('Biomedical imaging'),('Bioinstrumentation'),('Biosignal processing'),('Biomechanics'),('Biomaterials'),('Tissue engineering'),('Rehabilitation engineering'),('Medical devices'),('Computational biology / AI'),('Clinical engineering'),('Regulatory translation')on conflict do nothing;
