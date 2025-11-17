-- Program Stammdaten
INSERT INTO "Program" ("id","slug","code","name","summary","category","frequency","durationMinutes","xpReward","mode")
VALUES
('mm1-incantations','mm1-incantations','MM1','Incantations','State-Boost Ritual aus dem DAiS Morning Mindset inklusive State & Role Tracking.','mind','daily',12,600,'flow'),
('mm5-day-planning','mm5-day-planning','MM5','Day Planning','Fokussiertes Planungs-Canvas für das DAiS Day Management.','mind','daily',15,450,'single'),
('state-controll','state-controll','SC','State Controll','LOVE, LIGHT, HERO, LEADER, INNOVATOR, POWER HUMAN, IQ SOURCE Trackings.','mind','daily',10,500,'flow'),
('rules-checklist','rules-checklist','RC','Rules Checklist','12 Disziplinen als Ja/Nein-Tracker.','mind','daily',8,300,'single'),
('daily-checklist-body','daily-checklist-body','DB1','Daily Body Checklist','Sport, Ernährung, Kältebad und Sleep Tracking.','body','daily',20,550,'flow'),
('daily-checklist-human','daily-checklist-human','DH1','Daily Human Checklist','Family, Chat und Meet Programme an einem Ort.','human','daily',10,400,'flow'),
('environment-program','environment-program','EN1','Environment Program','Haushalt, Cleaning, Garden, Shaggy Program.','environment','daily',25,500,'flow'),
('business-development-program','business-development-program','BU1','Business Development','Virtuelles Kundencenter, Immobilienentwicklungen, Research und KPIs.','business','daily',30,650,'flow')
ON CONFLICT ("id") DO UPDATE
SET "summary" = EXCLUDED."summary",
    "xpReward" = EXCLUDED."xpReward";

-- Units
INSERT INTO "ProgramUnit" ("id","programId","title","order")
VALUES
('mm1-state','mm1-incantations','State & Role',1),
('mm1-rituals','mm1-incantations','Ritual',2),
('mm5-core','mm5-day-planning','Fokus',1),
('sc-state','state-controll','State-Level',1),
('rc-checks','rules-checklist','Disziplinen',1),
('db1-activity','daily-checklist-body','Aktivität',1),
('dh1-family','daily-checklist-human','Connections',1),
('en1-cleaning','environment-program','Cleaning & Garden',1),
('bu1-sales','business-development-program','Sales & Development',1)
ON CONFLICT ("id") DO NOTHING;

-- Exercises (Auszug, restliche Felder analog erweitern)
INSERT INTO "Exercise" ("id","unitId","label","type","config","xpValue")
VALUES
('mm1-energy-scale','mm1-state','Energie-Level','scale','{"scaleMin":1,"scaleMax":5,"scaleLabels":["Low","Boosted","On Fire"]}',100),
('mm1-role','mm1-state','Coach / Spirit Role','scale','{"scaleMin":1,"scaleMax":5,"scaleLabels":["Warming up","In Flow","Legendary"]}',100),
('mm1-ritual-checkbox','mm1-rituals','Alle Incantations absolviert','checkbox','{}',200),
('mm1-result','mm1-rituals','Quality & Result','multiselect','{"options":["Fokus >= 70%","Neue Gehirnstruktur verankert","Visualisierung vivid","Coach Stimme stark"]}',200),
('mm5-why','mm5-core','Was ist das Wichtigste heute?','text','{}',150),
('mm5-meetings','mm5-core','Termine','text','{}',100),
('mm5-emails','mm5-core','E-Mails / Briefe geprüft','checkbox','{}',100),
('sc-love','sc-state','LOVE','scale','{"scaleMin":1,"scaleMax":10}',70),
('sc-light','sc-state','LIGHT','scale','{"scaleMin":1,"scaleMax":10}',70),
('sc-hero','sc-state','HERO','scale','{"scaleMin":1,"scaleMax":10}',70),
('sc-leader','sc-state','LEADER','scale','{"scaleMin":1,"scaleMax":10}',70),
('sc-innovator','sc-state','INNOVATOR','scale','{"scaleMin":1,"scaleMax":10}',70),
('sc-power','sc-state','POWER HUMAN','scale','{"scaleMin":1,"scaleMax":10}',70),
('sc-iq','sc-state','IQ SOURCE','scale','{"scaleMin":1,"scaleMax":10}',70),
('rc-0','rc-checks','Rauchfrei','checkbox','{}',20),
('rc-1','rc-checks','Gesund','checkbox','{}',20),
('rc-2','rc-checks','Diszipliniert','checkbox','{}',20),
('rc-3','rc-checks','Reichtum','checkbox','{}',20),
('rc-4','rc-checks','Erfolg','checkbox','{}',20),
('rc-5','rc-checks','Mind Push','checkbox','{}',20),
('rc-6','rc-checks','State Controll','checkbox','{}',20),
('rc-7','rc-checks','Action','checkbox','{}',20),
('rc-8','rc-checks','Meditation','checkbox','{}',20),
('rc-9','rc-checks','Social Value','checkbox','{}',20),
('rc-10','rc-checks','Family Value','checkbox','{}',20),
('rc-11','rc-checks','Daily Body Workout','checkbox','{}',20),
('db1-sport','db1-activity','Morning Sport absolviert','checkbox','{}',150),
('db1-cold','db1-activity','Kältebad','checkbox','{}',150),
('db1-sleep','db1-activity','Sleep Tracker Wert','number','{}',100),
('dh1-family-call','dh1-family','Family Kontakt gepflegt','checkbox','{}',120),
('dh1-chat','dh1-family','Menschenwert geschaffen','text','{}',120),
('en1-clean','en1-cleaning','Haushalt erledigt','checkbox','{}',150),
('en1-garden','en1-cleaning','Garden / Shaggy Program','text','{}',150),
('bu1-pipeline','bu1-sales','Pipeline gepflegt','checkbox','{}',200),
('bu1-innovation','bu1-sales','Innovationseintrag','text','{}',200)
ON CONFLICT ("id") DO UPDATE SET "xpValue" = EXCLUDED."xpValue";

-- Rewards
INSERT INTO "Reward" ("id","name","description","cost","active")
VALUES
('reward-cinema','Kinoabend','Zwei Tickets + Snacks als Feier des Fortschritts.',1500,true),
('reward-dayoff','Freier Tag','Ganzer Tag Offsite ohne Verpflichtungen.',2500,true),
('reward-watch','Neue Uhr','High-End Accessoire als Meilenstein.',8000,false)
ON CONFLICT ("id") DO UPDATE SET "cost" = EXCLUDED."cost", "active" = EXCLUDED."active";

-- Journale
INSERT INTO "Journal" ("id","userId","name","type")
VALUES
('journal-learn',(SELECT id FROM "User" WHERE email='demo@dais.app'),'Lern Journal','learn'),
('journal-success',(SELECT id FROM "User" WHERE email='demo@dais.app'),'Erfolgs Journal','success'),
('journal-gratitude',(SELECT id FROM "User" WHERE email='demo@dais.app'),'Dankbarkeits Journal','gratitude')
ON CONFLICT ("id") DO NOTHING;
