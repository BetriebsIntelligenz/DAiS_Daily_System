-- Program Stammdaten
INSERT INTO "Program" ("id","slug","code","name","summary","category","frequency","durationMinutes","xpReward","mode")
VALUES
('mm1-incantations','mm1-incantations','MM1','Incantations','State-Boost Ritual aus dem DAiS Morning Mindset inklusive State & Role Tracking.','mind','daily',12,600,'flow'),
('mm5-day-planning','mm5-day-planning','MM5','Day Planning','Fokussiertes Planungs-Canvas für das DAiS Day Management.','mind','daily',15,450,'single'),
('state-controll','state-controll','SC','State Controll','LOVE, LIGHT, HERO, LEADER, INNOVATOR, POWER HUMAN, IQ SOURCE Trackings.','mind','daily',10,500,'flow'),
('rules-checklist','rules-checklist','RC','Rules Checklist','12 Disziplinen als Ja/Nein-Tracker.','mind','daily',8,300,'single'),
('performance-checklist','performance-checklist','PC1','Performance Checklist','State, Haltung, Energy, Ernährung, Fokus, Konzentration und Disziplin als Score-Tabelle.','mind','daily',8,420,'single'),
('wake-up-program','wake-up-program','WU1','Wake Up Program','Earth Love, Dankbarkeit, Visualisierung, Health Shot und Pump Up Session als Morgen-Checklist.','mind','daily',12,420,'single'),
('daily-checklist-body','daily-checklist-body','MS1','Morgensport','Morgen Sport Routine','body','daily',20,550,'flow'),
('daily-checklist-human','daily-checklist-human','DH1','Daily Human Checklist','Family, Chat und Meet Programme an einem Ort.','human','daily',10,400,'flow'),
('environment-program','environment-program','EN1','Environment Program','Haushalt, Cleaning, Garden, Shaggy Program.','environment','daily',25,500,'flow'),
('environment-household-cards','household-cards','EN2','Haushalts Karten','Wochentagskarten mit Aufgaben-Checklist.','environment','daily',15,420,'single'),
('business-development-program','business-development-program','BU1','Business Development','Virtuelles Kundencenter, Immobilienentwicklungen, Research und KPIs.','business','daily',30,650,'flow')
ON CONFLICT ("id") DO UPDATE
SET "summary" = EXCLUDED."summary",
    "xpReward" = EXCLUDED."xpReward";

-- Units
INSERT INTO "ProgramUnit" ("id","programId","title","order")
VALUES
('mm1-state','mm1-incantations','Incantations',1),
('mm5-core','mm5-day-planning','Fokus',1),
('sc-state','state-controll','State-Level',1),
('rc-checks','rules-checklist','Disziplinen',1),
('pc1-checklist','performance-checklist','Performance Score',1),
('wu1-core','wake-up-program','Wake Up Ritual',1),
('db1-activity','daily-checklist-body','Morgensport',1),
('dh1-family','daily-checklist-human','Connections',1),
('en1-cleaning','environment-program','Cleaning & Garden',1),
('hh-cards-default','environment-household-cards','Haushaltskarte',1),
('bu1-sales','business-development-program','Sales & Development',1)
ON CONFLICT ("id") DO UPDATE
SET "programId" = EXCLUDED."programId",
    "title" = EXCLUDED."title",
    "order" = EXCLUDED."order";

-- Entferne veraltete MM1-Units und Exercises
DELETE FROM "ProgramUnit" WHERE "id" = 'mm1-rituals';
DELETE FROM "Exercise" WHERE "id" IN (
  'mm1-energy-scale',
  'mm1-role',
  'mm1-ritual-checkbox',
  'mm1-result'
);

-- Exercises (Auszug, restliche Felder analog erweitern)
INSERT INTO "Exercise" ("id","unitId","label","type","config","xpValue")
VALUES
('mm1-affirmation-wealth','mm1-state','Reichtum ist mein natürlicher Zustand','checkbox','{}',100),
('mm1-affirmation-magnet','mm1-state','Ich bin ein Magnet für Geld und Erfolg.','checkbox','{}',100),
('mm1-affirmation-energy','mm1-state','Ich bin Energie.','checkbox','{}',100),
('mm1-affirmation-health','mm1-state','Ich bin gesund.','checkbox','{}',100),
('mm1-affirmation-gratitude','mm1-state','Ich bin dankbar für meine Gesundheit.','checkbox','{}',100),
('mm1-intensity','mm1-state','Intensivität','scale','{"scaleMin":1,"scaleMax":10}',100),
('mm5-why','mm5-core','Was ist das Wichtigste heute?','text','{"placeholder":"Fokus Aufgabe..."}',150),
('mm5-emails','mm5-core','E-Mails geprüft','checkbox','{}',80),
('mm5-email-note','mm5-core','Notiz zu einer E-Mail','text','{"placeholder":"Welche Nachricht braucht Follow-up?"}',70),
('mm5-important-tasks','mm5-core','Wichtige Aufgaben','text','{"placeholder":"Aufgabe 1, Aufgabe 2 ..."}',120),
('mm5-meetings','mm5-core','Termine geprüft','checkbox','{}',80),
('mm5-meeting-prep','mm5-core','Vorbereitungen für heutige Termine','text','{"placeholder":"Was muss vor dem nächsten Termin passieren?"}',70),
('sc-love','sc-state','LOVE','scale','{"scaleMin":1,"scaleMax":10}',70),
('sc-light','sc-state','LIGHT','scale','{"scaleMin":1,"scaleMax":10}',70),
('sc-hero','sc-state','HERO','scale','{"scaleMin":1,"scaleMax":10}',70),
('sc-leader','sc-state','LEADER','scale','{"scaleMin":1,"scaleMax":10}',70),
('sc-innovator','sc-state','INNOVATOR','scale','{"scaleMin":1,"scaleMax":10}',70),
('sc-power','sc-state','POWER HUMAN','scale','{"scaleMin":1,"scaleMax":10}',70),
('sc-iq','sc-state','IQ SOURCE','scale','{"scaleMin":1,"scaleMax":10}',70),
('pc-state','pc1-checklist','State','scale','{"scaleMin":1,"scaleMax":5}',60),
('pc-posture','pc1-checklist','Körperhaltung','scale','{"scaleMin":1,"scaleMax":5}',60),
('pc-energy','pc1-checklist','Energy','scale','{"scaleMin":1,"scaleMax":5}',60),
('pc-nutrition','pc1-checklist','Gesunde Ernährung','scale','{"scaleMin":1,"scaleMax":5}',60),
('pc-focus','pc1-checklist','Fokus','scale','{"scaleMin":1,"scaleMax":5}',60),
('pc-concentration','pc1-checklist','Konzentration','scale','{"scaleMin":1,"scaleMax":5}',60),
('pc-discipline','pc1-checklist','Disziplin','scale','{"scaleMin":1,"scaleMax":5}',60),
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
('wu-earth-love','wu1-core','Earth Love Meditation','checkbox','{}',80),
('wu-gratitude','wu1-core','Dankbarkeits Meditation','checkbox','{}',80),
('wu-visualization','wu1-core','Visualisierung','checkbox','{}',80),
('wu-power-shot','wu1-core','Power Health Shot','checkbox','{}',80),
('wu-pump-up','wu1-core','Pump Up Session','checkbox','{}',100),
('db1-sport','db1-activity','Morning Sport absolviert','multiselect','{"options":["Calistenics","Freeletics","Schattenboxen","Laufen","Schwimmen","Boxsack","Seilspringen","Fitness"],"optionsRequireMinutes":true}',550),
('dh1-family-call','dh1-family','Family Kontakt gepflegt','checkbox','{}',120),
('dh1-chat','dh1-family','Menschenwert geschaffen','text','{}',120),
('en1-clean','en1-cleaning','Haushalt erledigt','checkbox','{}',150),
('en1-garden','en1-cleaning','Garden / Shaggy Program','text','{}',150),
('hh-card-check','hh-cards-default','Haushaltskarte bestätigt','checkbox','{}',420),
('bu1-pipeline','bu1-sales','Pipeline gepflegt','checkbox','{}',200),
('bu1-innovation','bu1-sales','Innovationseintrag','text','{}',200)
ON CONFLICT ("id") DO UPDATE
SET "unitId" = EXCLUDED."unitId",
    "label" = EXCLUDED."label",
    "type" = EXCLUDED."type",
    "config" = EXCLUDED."config",
    "xpValue" = EXCLUDED."xpValue";

-- XP Regeln für Morgensport lockern (immer XP trotz niedriger Quality Scores)
UPDATE "Program"
SET "xpRules" = jsonb_build_object(
  'baseValue', "xpReward",
  'requireCompletion', true,
  'minQualityScore', 1,
  'customRuleLabel', 'Regel-Check erfüllt',
  'distribution', jsonb_build_array(jsonb_build_object('area','body','percentage',100))
)
WHERE "id" = 'daily-checklist-body';

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

-- Household Tasks
INSERT INTO "HouseholdTask" ("id","label","order","active")
VALUES
('hh-task-clean','Aufgeräumt',0,true),
('hh-task-dishes','Geschirr in Spühlmaschine getan',1,true),
('hh-task-laundry','Wäsche gewaschen',2,true),
('hh-task-floor','Boden gewischt',3,true),
('hh-task-trash','Müll entsorgt',4,true),
('hh-task-handwerk','Handwerkliche Aufgabe erledigt',5,true),
('hh-task-cooking','Essen zubereitet',6,true),
('hh-task-shopping','Einkaufen gewesen',7,true)
ON CONFLICT ("id") DO UPDATE SET "label" = EXCLUDED."label", "order" = EXCLUDED."order", "active" = EXCLUDED."active";

-- Household Cards
INSERT INTO "HouseholdCard" ("id","title","summary","weekday")
VALUES
('hh-card-monday-reset','Montag Reset','Wohnbereich zurück in Fokus-Mode bringen.',1),
('hh-card-tuesday-kitchen','Dienstag Küche','Küchenroutine und Vorratscheck.',2),
('hh-card-wednesday-laundry','Mittwoch Laundry','Wäsche, Müll und kleine Reparaturen.',3),
('hh-card-thursday-supply','Donnerstag Vorräte','Einkaufen und Entsorgen kombinieren.',4),
('hh-card-friday-deep','Freitag Deep Clean','Woche mit tiefer Reinigung abschließen.',5),
('hh-card-saturday-family','Samstag Family Prep','Küche & Essen für das Wochenende vorbereiten.',6),
('hh-card-sunday-buffer','Sonntag Vorratscheck','Wäsche finalisieren und Einkäufe vorbereiten.',7)
ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title","summary" = EXCLUDED."summary","weekday" = EXCLUDED."weekday";

-- Household Card Tasks
DELETE FROM "HouseholdCardTask" WHERE "cardId" IN (
  'hh-card-monday-reset','hh-card-tuesday-kitchen','hh-card-wednesday-laundry',
  'hh-card-thursday-supply','hh-card-friday-deep','hh-card-saturday-family','hh-card-sunday-buffer'
);
INSERT INTO "HouseholdCardTask" ("id","cardId","taskId","order")
VALUES
(gen_random_uuid(),'hh-card-monday-reset','hh-task-clean',0),
(gen_random_uuid(),'hh-card-monday-reset','hh-task-dishes',1),
(gen_random_uuid(),'hh-card-monday-reset','hh-task-floor',2),
(gen_random_uuid(),'hh-card-monday-reset','hh-task-trash',3),
(gen_random_uuid(),'hh-card-tuesday-kitchen','hh-task-dishes',0),
(gen_random_uuid(),'hh-card-tuesday-kitchen','hh-task-floor',1),
(gen_random_uuid(),'hh-card-tuesday-kitchen','hh-task-cooking',2),
(gen_random_uuid(),'hh-card-wednesday-laundry','hh-task-laundry',0),
(gen_random_uuid(),'hh-card-wednesday-laundry','hh-task-trash',1),
(gen_random_uuid(),'hh-card-wednesday-laundry','hh-task-handwerk',2),
(gen_random_uuid(),'hh-card-thursday-supply','hh-task-shopping',0),
(gen_random_uuid(),'hh-card-thursday-supply','hh-task-trash',1),
(gen_random_uuid(),'hh-card-thursday-supply','hh-task-floor',2),
(gen_random_uuid(),'hh-card-friday-deep','hh-task-clean',0),
(gen_random_uuid(),'hh-card-friday-deep','hh-task-dishes',1),
(gen_random_uuid(),'hh-card-friday-deep','hh-task-floor',2),
(gen_random_uuid(),'hh-card-friday-deep','hh-task-handwerk',3),
(gen_random_uuid(),'hh-card-saturday-family','hh-task-clean',0),
(gen_random_uuid(),'hh-card-saturday-family','hh-task-cooking',1),
(gen_random_uuid(),'hh-card-saturday-family','hh-task-dishes',2),
(gen_random_uuid(),'hh-card-sunday-buffer','hh-task-laundry',0),
(gen_random_uuid(),'hh-card-sunday-buffer','hh-task-shopping',1),
(gen_random_uuid(),'hh-card-sunday-buffer','hh-task-trash',2);
